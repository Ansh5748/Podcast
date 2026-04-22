import asyncio
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import image_service
sys.path.append(str(Path(__file__).parent.parent))

from image_service import ImageService

async def test_image_generation_base64():
    service = ImageService()
    
    print("Testing base64 image generation for 'Dr. Kaelen Voss' via Pollinations.ai...")
    visual_description = "A person from Aetheria-9 with sharp, observant gaze and a habit of checking their surroundings."
    name = "Dr. Kaelen Voss"
    
    # This should now return a base64 string because FAL and HF will fail
    image_url = await service.generate_character_image(visual_description, name)
    
    if image_url:
        print(f"Resulting Image URL length: {len(image_url)}")
        if image_url.startswith("data:image"):
            print("SUCCESS: Generated a Base64 image string.")
            # Verify it's a decent length (not just an error message)
            if len(image_url) > 1000:
                print("Image data looks substantial.")
            else:
                print(f"WARNING: Image data is very short: {image_url[:100]}")
        else:
            print(f"FAILURE: Generated a direct URL instead of base64: {image_url}")
    else:
        print("FAILURE: Failed to generate any image.")

if __name__ == "__main__":
    # Load .env manually for the test script
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
    
    asyncio.run(test_image_generation_base64())
