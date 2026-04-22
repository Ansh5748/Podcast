import asyncio
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import image_service
sys.path.append(str(Path(__file__).parent.parent))

from image_service import ImageService

async def test_resilient_generation():
    service = ImageService()
    
    print("Testing resilient image generation with retries and extra fallbacks...")
    
    name = "Dr. Kaelen Voss"
    vis = "Sharp, observant gaze, silver hair, lab coat."
    ctx = {
        "age": "44",
        "profession": "Doctor",
        "world_name": "Aetheria-9"
    }
    
    # This should now try multiple models and services
    image_url = await service.generate_character_image(vis, name, character_context=ctx)
    
    if image_url:
        print(f"Final Image URL/Data length: {len(image_url)}")
        if image_url.startswith("data:image"):
            print("SUCCESS: Generated a Base64 image.")
        elif "dicebear" in image_url:
            print("NOTICE: Fell back to DiceBear (All AI services failed or rate limited).")
        else:
            print(f"UNKNOWN: {image_url[:100]}")
    else:
        print("FAILURE: No image generated at all.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
    
    asyncio.run(test_resilient_generation())
