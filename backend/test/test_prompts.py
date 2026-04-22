import asyncio
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import image_service
sys.path.append(str(Path(__file__).parent.parent))

from image_service import ImageService

async def test_improved_prompt():
    service = ImageService()
    
    print("Testing improved prompt generation...")
    
    # Test case 1: Full context
    name1 = "Dr. Kaelen Voss"
    vis1 = "Sharp, observant gaze, silver hair, lab coat."
    ctx1 = {
        "age": "44",
        "profession": "Doctor",
        "world_name": "Aetheria-9"
    }
    
    print(f"\nScenario 1: {name1} (44, Doctor, Aetheria-9)")
    # We won't actually call the API to save time/cost, we'll just test the logic
    # But since I can't easily mock here without more setup, I'll let it run
    # and we can see the log output in the console.
    
    image_url1 = await service.generate_character_image(vis1, name1, character_context=ctx1)
    print(f"Generated Base64 length: {len(image_url1) if image_url1 else 'Failed'}")

    # Test case 2: Minimal context
    name2 = "Elias Thorne"
    vis2 = "Young man with a hood and glowing eyes."
    ctx2 = {
        "age": "21",
        "profession": "Scavenger",
        "world_name": "Iron Reach"
    }
    
    print(f"\nScenario 2: {name2} (21, Scavenger, Iron Reach)")
    image_url2 = await service.generate_character_image(vis2, name2, character_context=ctx2)
    print(f"Generated Base64 length: {len(image_url2) if image_url2 else 'Failed'}")

if __name__ == "__main__":
    # Load .env manually for the test script
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
    
    asyncio.run(test_improved_prompt())
