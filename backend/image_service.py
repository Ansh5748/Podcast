import os
import requests
import logging
import base64
import asyncio
import time
from typing import Optional

logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self):
        self.fal_key = os.environ.get('FAL_KEY')
        self.hf_api_url = os.environ.get('HUGGINGFACE_API_URL', 'https://api-inference.huggingface.co/models')
        self.hf_token = os.environ.get('HUGGINGFACE_TOKEN')
        
    async def generate_character_image(self, visual_description: str, name: str, character_context: Optional[dict] = None) -> Optional[str]:
        """Generate a character image using FAL, Hugging Face, or DiceBear"""
        
        # Build a rich prompt based on character context
        age = character_context.get('age', '') if character_context else ''
        profession = character_context.get('profession', '') if character_context else ''
        world_name = character_context.get('world_name', '') if character_context else ''
        
        base_prompt = f"High-end cinematic portrait of {name}"
        if age: base_prompt += f", {age} years old"
        if profession: base_prompt += f", a {profession}"
        if world_name: base_prompt += f", from the world of {world_name}"
        
        full_prompt = f"{base_prompt}. {visual_description}. Ultra-realistic, 8k, detailed skin texture, professional studio lighting, shallow depth of field."
        
        # 1. Try FAL first if key is available
        if self.fal_key:
            try:
                logger.info(f"Attempting image generation for {name} using FAL...")
                # Using the standard synchronous endpoint for Flux Schnell
                response = requests.post(
                    "https://fal.run/fal-ai/flux/schnell",
                    headers={
                        "Authorization": f"Key {self.fal_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "prompt": full_prompt,
                        "image_size": "square_hd",
                        "num_inference_steps": 4,
                        "enable_safety_checker": True
                    },
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'images' in data and len(data['images']) > 0:
                        image_url = data['images'][0]['url']
                        logger.info(f"Successfully generated image for {name} via FAL: {image_url}")
                        return image_url
                    else:
                        logger.warning(f"FAL returned 200 but no images: {data}")
                elif response.status_code == 403:
                    logger.error(f"FAL API Auth Error (Balance Exhausted): {response.text}")
                else:
                    logger.error(f"FAL API returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"FAL image generation failed: {e}")

        # 2. Fallback to Hugging Face if FAL fails or is not available
        if self.hf_token and self.hf_token != "hf_your_token_here":
            try:
                logger.info(f"Attempting image generation for {name} using Hugging Face...")
                
                # List of models that are frequently "warm" or available on the free Inference API
                hf_models = [
                    "black-forest-labs/FLUX.1-schnell",
                    "stabilityai/sdxl-turbo",
                    "stabilityai/stable-diffusion-xl-base-1.0",
                    "runwayml/stable-diffusion-v1-5"
                ]
                
                headers = {
                    "Authorization": f"Bearer {self.hf_token}",
                    "X-Wait-For-Model": "true", # Critical for free tier
                    "Accept": "image/png"
                }
                
                for model_id in hf_models:
                    try:
                        api_url = f"https://api-inference.huggingface.co/models/{model_id}"
                        logger.info(f"Trying HF model: {model_id}")
                        
                        payload = {
                            "inputs": full_prompt,
                            "parameters": {"negative_prompt": "blurry, distorted, low quality, bad anatomy"},
                            "options": {"wait_for_model": True}
                        }
                        
                        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
                        
                        if response.status_code == 200:
                            # Check if we got an image (bytes) or an error JSON
                            content_type = response.headers.get('Content-Type', '')
                            if 'image' in content_type or response.content[:4] == b'\x89PNG':
                                img_base64 = base64.b64encode(response.content).decode('utf-8')
                                image_url = f"data:image/png;base64,{img_base64}"
                                logger.info(f"Successfully generated image for {name} via HF ({model_id})")
                                return image_url
                            else:
                                logger.error(f"HF model {model_id} returned non-image content: {response.text[:100]}")
                                continue
                        elif response.status_code == 503:
                            logger.warning(f"HF model {model_id} is still loading despite wait flag, trying next...")
                            continue
                        elif response.status_code == 404:
                            logger.error(f"HF model {model_id} not found or not supported by free Inference API (404). URL: {api_url}")
                            continue
                        else:
                            logger.error(f"HF model {model_id} failed with status {response.status_code}: {response.text[:100]}")
                            continue
                    except Exception as model_e:
                        logger.error(f"Error with HF model {model_id}: {model_e}")
                        continue
                        
            except Exception as e:
                logger.error(f"Hugging Face image generation failed: {e}")

        # 3. Fallback to Pollinations.ai (High-quality, free, no auth)
        for attempt in range(2):
            try:
                logger.info(f"Attempting image generation for {name} using Pollinations.ai (Attempt {attempt+1})...")
                encoded_prompt = requests.utils.quote(full_prompt)
                seed = sum(ord(c) for c in name) + attempt # Slightly different seed for retry
                pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
                
                response = requests.get(pollinations_url, timeout=60)
                if response.status_code == 200:
                    img_base64 = base64.b64encode(response.content).decode('utf-8')
                    content_type = response.headers.get('Content-Type', 'image/jpeg')
                    image_url = f"data:{content_type};base64,{img_base64}"
                    logger.info(f"Successfully generated and encoded image for {name} via Pollinations.ai")
                    return image_url
                elif response.status_code == 429:
                    logger.warning(f"Pollinations.ai rate limited (429), waiting 2 seconds before retry...")
                    await asyncio.sleep(2)
                    continue
                else:
                    logger.error(f"Pollinations.ai returned status {response.status_code}: {response.text[:100]}")
                    break
            except Exception as e:
                logger.error(f"Pollinations.ai fallback failed: {e}")
                break

        # 4. Fallback to Hercai (Multiple models)
        hercai_models = ["v3", "lexica", "prodia", "simurg", "animefy", "raava"]
        for model in hercai_models:
            try:
                logger.info(f"Attempting image generation for {name} using Hercai ({model})...")
                hercai_url = f"https://hercai.onrender.com/{model}/text2image?prompt={requests.utils.quote(full_prompt)}"
                response = requests.get(hercai_url, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    if 'url' in data:
                        img_res = requests.get(data['url'], timeout=30)
                        if img_res.status_code == 200:
                            img_base64 = base64.b64encode(img_res.content).decode('utf-8')
                            image_url = f"data:image/jpeg;base64,{img_base64}"
                            logger.info(f"Successfully generated and encoded image for {name} via Hercai ({model})")
                            return image_url
                else:
                    logger.warning(f"Hercai {model} returned status {response.status_code}")
            except Exception as e:
                logger.error(f"Hercai {model} fallback failed: {e}")

        # 5. Fallback to a direct public Flux/SD endpoint if available (e.g., via pollinations with different parameters)
        try:
            logger.info(f"Final attempt for {name} using Pollinations (SDXL fallback)...")
            sdxl_url = f"https://image.pollinations.ai/prompt/{requests.utils.quote(full_prompt)}?width=1024&height=1024&nologo=true&model=search"
            response = requests.get(sdxl_url, timeout=30)
            if response.status_code == 200:
                img_base64 = base64.b64encode(response.content).decode('utf-8')
                image_url = f"data:image/jpeg;base64,{img_base64}"
                return image_url
        except:
            pass

        # 6. Last fallback: DiceBear for consistent high-quality placeholders
        logger.warning(f"Using DiceBear placeholder for {name} due to service unavailability.")
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}&backgroundColor=b6e3f4"
