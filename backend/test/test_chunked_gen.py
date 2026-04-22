import asyncio
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import llm_service
sys.path.append(str(Path(__file__).parent.parent))

from llm_service import LLMService

async def test_chunked_generation():
    service = LLMService()
    
    print("Testing chunked script generation (Part 1, 2, 3)...")
    
    topic = "The Future of Medicine"
    host = {
        "name": "Dr. Kaelen Voss",
        "profession": "Doctor",
        "thinking_style": "Analytical",
        "personality": "Complex",
        "backstory": "Veteran doctor from the outer rims.",
        "world_id": "world-123"
    }
    guest = {
        "name": "Elias Thorne",
        "profession": "Scavenger",
        "thinking_style": "Intuitive",
        "personality": "Resilient",
        "backstory": "Resourceful scavenger with a secret history."
    }
    
    # We'll test PART 1 first to see if it works
    print("\n--- Generating PART 1 (Intro & History) ---")
    part1 = await service._generate_script_part(
        topic, host, guest, "Conversational", "English",
        part_mission="Introduction and Deep Dive into Guest's History. NO 'Today we talk about' intro.",
        target_length=5 # Small length for test speed
    )
    
    if part1.get('conversation'):
        print(f"SUCCESS: Generated {len(part1['conversation'])} exchanges for Part 1.")
        for line in part1['conversation'][:2]:
            print(f"[{line['character_name']}]: {line['text'][:60]}...")
    else:
        print("FAILURE: Part 1 generation failed. Using massive fallback...")
        fallback = service._get_massive_fallback(topic, host, guest, "English")
        print(f"Fallback SUCCESS: Generated {len(fallback['conversation'])} exchanges.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
    
    asyncio.run(test_chunked_generation())
