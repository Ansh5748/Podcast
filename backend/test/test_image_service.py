import asyncio
import os
import sys
from pathlib import Path

# Add the current directory to sys.path to import image_service
sys.path.append(str(Path(__file__).parent))

from image_service import ImageService

async def test_image_generation():
    service = ImageService()
    
    print("Testing image generation for 'Dr. Kaelen Voss'...")
    visual_description = "A person from Aetheria-9 with sharp, observant gaze and a habit of checking their surroundings."
    name = "Dr. Kaelen Voss"
    
    # We expect FAL to fail (balance exhausted)
    # We expect HF to potentially fail or succeed
    # We expect Pollinations.ai to succeed if others fail
    
    image_url = await service.generate_character_image(visual_description, name)
    
    print(f"\nResulting Image URL: {image_url}")
    
    if image_url:
        if image_url.startswith("data:image"):
            print("Successfully generated a Base64 image (likely from Hugging Face).")
        elif "pollinations.ai" in image_url:
            print("Successfully generated a Pollinations.ai URL.")
        elif "fal.run" in image_url:
            print("Successfully generated a FAL URL.")
        elif "dicebear.com" in image_url:
            print("Fell back to DiceBear placeholder.")
        else:
            print("Generated an unknown image URL format.")
    else:
        print("Failed to generate any image.")

if __name__ == "__main__":
    # Load .env manually for the test script
    from dotenv import load_dotenv
    load_dotenv()
    
    asyncio.run(test_image_generation())
