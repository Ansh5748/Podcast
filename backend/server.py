from fastapi import FastAPI, APIRouter, HTTPException, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import urllib.parse
import uuid
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from models import World, WorldCreate, Character, CharacterCreate, PodcastScript, ScriptCreate, OllamaModel, Location, LocationCreate
from llm_service import LLMService
from image_service import ImageService
from video_service import VideoService
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
llm_service = LLMService()
image_service = ImageService()
video_service = VideoService()

# Global configuration
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

# Create the main app
app = FastAPI(title="Fictional World Podcast Studio API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ==================== COMMON AI UTILS ====================

class SuggestionInput(BaseModel):
    type: str  # "world" or "character"
    context: str

@api_router.post("/ai/suggest")
async def suggest_description(input: SuggestionInput):
    """Generate an AI suggestion for a description"""
    try:
        suggestion = await llm_service.suggest_description(input.type, input.context)
        return {"suggestion": suggestion}
    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WORLD ENGINE ====================

@api_router.post("/worlds/generate", response_model=World)
async def generate_world(input: WorldCreate):
    """Generate a fictional world using AI"""
    try:
        world_data = await llm_service.generate_world(input.prompt, input.name)
        
        world_obj = World(**world_data)
        
        # Store in MongoDB
        doc = world_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.worlds.insert_one(doc)
        
        logger.info(f"Generated world: {world_obj.name}")
        return world_obj
    except Exception as e:
        logger.error(f"World generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/worlds", response_model=List[World])
async def get_worlds():
    """Get all worlds"""
    try:
        worlds = await db.worlds.find({}, {"_id": 0}).to_list(100)
        
        for world in worlds:
            if isinstance(world.get('created_at'), str):
                world['created_at'] = datetime.fromisoformat(world['created_at'])
            if isinstance(world.get('updated_at'), str):
                world['updated_at'] = datetime.fromisoformat(world['updated_at'])
        
        return worlds
    except Exception as e:
        logger.error(f"Error fetching worlds: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/worlds/{world_id}", response_model=World)
async def get_world(world_id: str):
    """Get world by ID"""
    try:
        world = await db.worlds.find_one({"id": world_id}, {"_id": 0})
        
        if not world:
            raise HTTPException(status_code=404, detail="World not found")
        
        if isinstance(world.get('created_at'), str):
            world['created_at'] = datetime.fromisoformat(world['created_at'])
        if isinstance(world.get('updated_at'), str):
            world['updated_at'] = datetime.fromisoformat(world['updated_at'])
        
        return world
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching world: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/worlds/{world_id}")
async def delete_world(world_id: str):
    """Delete world"""
    try:
        result = await db.worlds.delete_one({"id": world_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="World not found")
        
        return {"status": "deleted", "id": world_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting world: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CHARACTER ENGINE ====================

@api_router.post("/characters/generate", response_model=Character)
async def generate_character(input: CharacterCreate):
    """Generate a character using AI"""
    try:
        # Get world info
        world = await db.worlds.find_one({"id": input.world_id}, {"_id": 0})
        if not world:
            raise HTTPException(status_code=404, detail="World not found")
        
        # Generate character
        char_data = await llm_service.generate_character(
            world['name'],
            world['description'],
            input.prompt,
            input.name,
            input.is_real_person,
            profession=input.profession,
            location=input.current_location,
            age=input.age
        )
        
        char_data['world_id'] = input.world_id
        char_data['world_name'] = world['name']
        char_data['is_real_person'] = input.is_real_person
        
        # Generate character image
        if 'visual_description' in char_data and 'name' in char_data:
            image_url = await image_service.generate_character_image(
                char_data['visual_description'],
                char_data['name'],
                character_context={
                    'age': char_data.get('age'),
                    'profession': char_data.get('profession'),
                    'world_name': char_data.get('world_name')
                }
            )
            char_data['image_url'] = image_url
        
        char_obj = Character(**char_data)
        
        # Store in MongoDB
        doc = char_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.characters.insert_one(doc)
        
        logger.info(f"Generated character: {char_obj.name}")
        return char_obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Character generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/characters", response_model=List[Character])
async def get_characters(world_id: Optional[str] = None):
    """Get all characters, optionally filtered by world"""
    try:
        query = {"world_id": world_id} if world_id else {}
        characters = await db.characters.find(query, {"_id": 0}).to_list(100)
        
        for char in characters:
            if isinstance(char.get('created_at'), str):
                char['created_at'] = datetime.fromisoformat(char['created_at'])
        
        return characters
    except Exception as e:
        logger.error(f"Error fetching characters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/characters/{character_id}", response_model=Character)
async def get_character(character_id: str):
    """Get character by ID"""
    try:
        character = await db.characters.find_one({"id": character_id}, {"_id": 0})
        
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        if isinstance(character.get('created_at'), str):
            character['created_at'] = datetime.fromisoformat(character['created_at'])
        
        return character
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching character: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/characters/{character_id}")
async def delete_character(character_id: str):
    """Delete character"""
    try:
        result = await db.characters.delete_one({"id": character_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Character not found")
        
        return {"status": "deleted", "id": character_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting character: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/characters/{character_id}/test-voice")
async def test_character_voice(character_id: str):
    """Generate a test voice sample for a character matching their age and persona"""
    try:
        character = await db.characters.find_one({"id": character_id})
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        sample_text = f"Hello, I am {character['name']}. I am {character['age']} years old and I work as a {character['profession']}. This is my unique voice profile from the world of {character['world_name']}."
        
        # Determine the best persona based on age and gender
        try:
            age_int = int(character.get('age', '30'))
        except:
            age_int = 30
            
        desc = (character.get('visual_description', '') + character.get('backstory', '')).lower()
        is_female = any(word in desc for word in ['woman', 'female', 'girl', 'lady', 'her', 'she'])
        is_elderly = age_int > 60
        is_young = age_int < 20

        # Map character to distinct voice for natural conversation
        voice_id = "indian_male"  # Default
        if is_female:
            voice_id = "indian_female"
            if is_elderly: voice_id = "female_warm"
            elif is_young: voice_id = "female_bright"
        else:
            if is_elderly: voice_id = "male_deep"
            elif is_young: voice_id = "male_young"

        proxy_url = f"{BACKEND_URL}/api/proxy-audio?voice={voice_id}&text={urllib.parse.quote(sample_text)}"
        return {"voice_url": proxy_url}
    except Exception as e:
        logger.error(f"Test voice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/proxy-audio")
async def proxy_audio(voice: str, text: str):
    """Proxy TTS audio to avoid CORS and format issues"""
    try:
        # First check if we should use local Bark-generated audio
        if text.startswith("_BARK_"):
            # Local Bark audio file
            audio_path = text.replace("_BARK_", "")
            if os.path.exists(audio_path):
                with open(audio_path, "rb") as f:
                    return Response(content=f.read(), media_type="audio/wav")

        # High-Quality Human TTS via Google (Free/Unlimited)
        # We map personas to distinct global accents to force male/female variety
        lang_map = {
            "male_young": "en-IE",   # Young male (Irish)
            "male_deep": "en-AU",    # Deep male (Australian)
            "female_warm": "en-GB",  # Warm female (British)
            "female_bright": "en-US",# Bright female (US)
            "indian_male": "en-IN",  # Indian male (Standard)
            "indian_female": "hi-IN",# Use Hindi code for female feel or en-IN
            "Hindi_Standard": "hi-IN"
        }

        persona = voice if voice in lang_map else "indian_male"
        lang = lang_map.get(persona, "en-IN")

        tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(text)}&tl={lang}&client=tw-ob"

        async with httpx.AsyncClient() as client:
            response = await client.get(tts_url, timeout=20.0)

            if response.status_code != 200:
                response = await client.get(
                    f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(text)}&tl=en-IN&client=tw-ob"
                )

            return Response(content=response.content, media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"Proxy audio error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/characters/{character_id}", response_model=Character)
async def update_character(character_id: str, input: Dict[str, Any]):
    """Update an existing character"""
    try:
        # Check if character exists
        existing = await db.characters.find_one({"id": character_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Character not found")
            
        # Update fields
        update_data = {k: v for k, v in input.items() if v is not None}
        
        # If location changed, update coordinates
        if 'current_location' in update_data and update_data['current_location'] != existing['current_location']:
            coords = llm_service._get_coordinates_from_location(update_data['current_location'])
            update_data['lat'] = coords['lat']
            update_data['lng'] = coords['lng']

        # If image regeneration requested
        if update_data.get('regenerate_image'):
            # Use current visual description and name or new ones if provided
            vis_desc = update_data.get('visual_description', existing.get('visual_description'))
            name = update_data.get('name', existing.get('name'))
            if vis_desc and name:
                new_image = await image_service.generate_character_image(
                    vis_desc, 
                    name,
                    character_context={
                        'age': update_data.get('age', existing.get('age')),
                        'profession': update_data.get('profession', existing.get('profession')),
                        'world_name': update_data.get('world_name', existing.get('world_name'))
                    }
                )
                update_data['image_url'] = new_image
                
                # Update any scripts where this character is host or guest to include the new image URL
                await db.scripts.update_many(
                    {"host_character_id": character_id},
                    {"$set": {"host_image_url": new_image}}
                )
                await db.scripts.update_many(
                    {"guest_character_id": character_id},
                    {"$set": {"guest_image_url": new_image}}
                )
                
            update_data.pop('regenerate_image')

        await db.characters.update_one({"id": character_id}, {"$set": update_data})
        
        updated = await db.characters.find_one({"id": character_id}, {"_id": 0})
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
            
        return updated
    except Exception as e:
        logger.error(f"Error updating character: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PODCAST SCRIPT ENGINE ====================

class ScriptGenerateRequest(BaseModel):
    topic: str
    host_character_id: str
    guest_character_id: str
    style: str
    language: Optional[str] = "English"

@api_router.post("/scripts/generate", response_model=PodcastScript)
async def generate_script(input: ScriptGenerateRequest):
    """Generate podcast script"""
    try:
        # Get host and guest data
        host = await db.characters.find_one({"id": input.host_character_id}, {"_id": 0})
        guest = await db.characters.find_one({"id": input.guest_character_id}, {"_id": 0})
        
        if not host or not guest:
            raise HTTPException(status_code=404, detail="Character not found")
        
        # Generate script
        script_data = await llm_service.generate_podcast_script(
            input.topic,
            host,
            guest,
            input.style,
            input.language
        )
        
        script_obj = PodcastScript(
            title=script_data.get('title', f"Podcast: {input.topic}"),
            topic=input.topic,
            world_id=host['world_id'],
            host_character_id=input.host_character_id,
            guest_character_id=input.guest_character_id,
            host_name=host['name'],
            guest_name=guest['name'],
            host_image_url=host.get('image_url'),
            guest_image_url=guest.get('image_url'),
            conversation=script_data.get('conversation', []),
            language=input.language or "English"
        )
        
        # Store in MongoDB
        doc = script_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.scripts.insert_one(doc)
        
        logger.info(f"Generated script: {script_obj.title}")
        return script_obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Script generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/scripts", response_model=List[PodcastScript])
async def get_scripts():
    """Get all scripts"""
    try:
        scripts = await db.scripts.find({}, {"_id": 0}).to_list(100)
        
        for script in scripts:
            if isinstance(script.get('created_at'), str):
                script['created_at'] = datetime.fromisoformat(script['created_at'])
        
        return scripts
    except Exception as e:
        logger.error(f"Error fetching scripts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/scripts/{script_id}", response_model=PodcastScript)
async def get_script(script_id: str):
    """Get script by ID"""
    try:
        script = await db.scripts.find_one({"id": script_id}, {"_id": 0})
        
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")
        
        if isinstance(script.get('created_at'), str):
            script['created_at'] = datetime.fromisoformat(script['created_at'])
        
        return script
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching script: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/scripts/{script_id}")
async def delete_script(script_id: str):
    """Delete script"""
    try:
        result = await db.scripts.delete_one({"id": script_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Script not found")
        
        return {"status": "deleted", "id": script_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting script: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/scripts/{script_id}/extend")
async def extend_script(script_id: str, input: Dict[str, Any]):
    """Extend an existing script with 4 more exchanges"""
    try:
        script = await db.scripts.find_one({"id": script_id})
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")
            
        host = await db.characters.find_one({"id": script['host_character_id']})
        guest = await db.characters.find_one({"id": script['guest_character_id']})
        
        if not host or not guest:
            raise HTTPException(status_code=404, detail="Characters not found")
            
        new_exchanges = await llm_service.extend_podcast_script(
            script, host, guest, input.get('style'), script.get('language', 'English')
        )
        
        if new_exchanges:
            updated_conversation = script['conversation'] + new_exchanges
            await db.scripts.update_one(
                {"id": script_id}, 
                {"$set": {"conversation": updated_conversation}}
            )
            
        updated_script = await db.scripts.find_one({"id": script_id}, {"_id": 0})
        if isinstance(updated_script.get('created_at'), str):
            updated_script['created_at'] = datetime.fromisoformat(updated_script['created_at'])
            
        return updated_script
    except Exception as e:
        logger.error(f"Error extending script: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/scripts/{script_id}/rethink/{exchange_index}")
async def rethink_exchange(script_id: str, exchange_index: int):
    """Rethink/Regenerate a specific exchange in a script"""
    try:
        script = await db.scripts.find_one({"id": script_id})
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")
            
        host = await db.characters.find_one({"id": script['host_character_id']})
        guest = await db.characters.find_one({"id": script['guest_character_id']})
        
        if not host or not guest:
            raise HTTPException(status_code=404, detail="Characters not found")
            
        new_exchange = await llm_service.rethink_exchange(
            script, exchange_index, host, guest
        )
        
        if new_exchange:
            conversation = script['conversation']
            conversation[exchange_index] = new_exchange
            await db.scripts.update_one(
                {"id": script_id}, 
                {"$set": {"conversation": conversation}}
            )
            
        updated_script = await db.scripts.find_one({"id": script_id}, {"_id": 0})
        if isinstance(updated_script.get('created_at'), str):
            updated_script['created_at'] = datetime.fromisoformat(updated_script['created_at'])
            
        return updated_script
    except Exception as e:
        logger.error(f"Error rethinking exchange: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VIDEO ENGINE (V1.0) ====================

class VideoGenerationRequest(BaseModel):
    script_id: str
    studio_id: str
    part_index: Optional[int] = 0
    custom_studio_url: Optional[str] = None
    voice_profile_id: Optional[str] = None # Optional override

@api_router.post("/video/generate")
async def generate_video_part(input: VideoGenerationRequest):
    """Generate a video segment using free orchestration with extreme realism"""
    try:
        script = await db.scripts.find_one({"id": input.script_id})
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")
            
        logger.info(f"Generating cinematic video part for script {input.script_id}")
        
        # Get studio config
        studios_res = await get_studios()
        studio_config = next((s for s in studios_res['studios'] if s['id'] == input.studio_id), studios_res['studios'][0])
        
        # Trigger orchestration with part continuity
        part_index = input.part_index if hasattr(input, 'part_index') else 0
        gen_result = await video_service.generate_podcast_video(script, input.studio_id, studio_config, part_index=part_index)
        video_url = gen_result['video_url']
        poster_url = gen_result['poster_url']
        
        # Store video record in database
        video_record = {
            "id": str(uuid.uuid4()),
            "script_id": input.script_id,
            "title": script.get('title'),
            "video_url": video_url,
            "poster_url": poster_url,
            "studio_id": input.studio_id,
            "studio_name": studio_config.get('name'),
            "host_name": script.get('host_name'),
            "guest_name": script.get('guest_name'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Ensure we don't have ObjectId issues during insertion/return
        await db.videos.insert_one(dict(video_record))
        
        # Remove any _id from record if it was added by MongoDB
        video_record.pop('_id', None)
        
        return {
            "status": "completed",
            "video": video_record
        }
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/video/list")
async def list_videos(script_id: Optional[str] = None):
    """Get all generated videos with migration check for poster_url"""
    try:
        query = {"script_id": script_id} if script_id else {}
        videos = await db.videos.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        # Migration check: ensure every video has a poster_url for frontend consistency
        for vid in videos:
            if "poster_url" not in vid:
                vid["poster_url"] = "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1280"
                
        return {"videos": videos}
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/video/{video_id}")
async def delete_video(video_id: str):
    """Delete a generated video"""
    try:
        result = await db.videos.delete_one({"id": video_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        return {"status": "deleted", "id": video_id}
    except Exception as e:
        logger.error(f"Error deleting video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/video/studios")
async def get_studios():
    """Get available professional studio setups matching elite real-world podcasts"""
    return {
        "studios": [
            {
                "id": "the_wood_room", 
                "name": "The Wood Room", 
                "preview": "/studios/the_wood_room.png",
                "description": "Professional acoustic panels, wood slat walls, and warm ambient spotlighting."
            },
            {
                "id": "the_horizon", 
                "name": "The Horizon", 
                "preview": "/studios/the_horizon.png",
                "description": "Clean, bright, and professional with high-end microphones and a sunset view."
            },
            {
                "id": "the_loft_lounge", 
                "name": "The Loft Lounge", 
                "preview": "/studios/the_loft_lounge.png",
                "description": "Exposed brick, warm lighting, and a comfortable leather setup."
            },
            {
                "id": "urban_perspectives", 
                "name": "Urban Perspectives", 
                "preview": "/studios/urban_perspectives.png",
                "description": "Vibrant neon accents, futuristic tech, and low-light atmosphere."
            },
            {
                "id": "she_speaks", 
                "name": "She Speaks", 
                "preview": "/studios/she_speaks.png",
                "description": "Minimalist setup with dual white armchairs and a vibrant pink backdrop."
            },
            {
                "id": "chasing_dreams", 
                "name": "Chasing Dreams", 
                "preview": "/studios/chasing_dreams.png",
                "description": "Dreamy pink neon studio with plush velvet chairs and cozy ambient lighting."
            },
            {
                "id": "growth_mindset", 
                "name": "Growth Mindset", 
                "preview": "/studios/growth_mindset.png",
                "description": "Fresh light-green studio with soft armchairs, natural light, and a calm productivity vibe."
            },
            {
                "id": "real_conversations_bold_ideas", 
                "name": "Real Conversations Bold Ideas", 
                "preview": "/studios/real_conversations_bold_ideas.png",
                "description": "Warm orange studio with cozy armchairs, glowing lights, and a bold conversational vibe."
            },
            {
                "id": "frequency", 
                "name": "Frequency", 
                "preview": "/studios/frequency.png",
                "description": "Teal-lit modern studio with geometric panels and a sleek, high-energy vibe."
            },
            {
                "id": "unfiltered", 
                "name": "Unfiltered", 
                "preview": "/studios/unfiltered.png",
                "description": "Raw, dim-lit studio with rugged textures and an unpolished, authentic feel."
            },
            {
                "id": "unfiltered_thoughts",
                "name": "Unfiltered Thoughts",
                "preview": "/studios/unfiltered_thoughts.png",
                "description": "Moody minimalist setup with soft shadows and a deep, introspective atmosphere."
            }
        ]
    }

@api_router.post("/locations", response_model=Location)
async def create_location(input: LocationCreate):
    """Create a new persistent location"""
    try:
        loc_obj = Location(**input.model_dump())
        doc = loc_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.locations.insert_one(doc)
        return loc_obj
    except Exception as e:
        logger.error(f"Location creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/locations", response_model=List[Location])
async def get_locations(world_id: Optional[str] = None):
    """Get all locations, optionally filtered by world"""
    try:
        query = {"world_id": world_id} if world_id else {}
        locations = await db.locations.find(query, {"_id": 0}).to_list(100)
        
        for loc in locations:
            if isinstance(loc.get('created_at'), str):
                loc['created_at'] = datetime.fromisoformat(loc['created_at'])
        
        return locations
    except Exception as e:
        logger.error(f"Error fetching locations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== OLLAMA MANAGEMENT ====================

@api_router.get("/ollama/models", response_model=List[OllamaModel])
async def get_ollama_models():
    """Get available Ollama models"""
    try:
        models = llm_service.get_ollama_models()
        return models
    except Exception as e:
        logger.error(f"Error fetching Ollama models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/ollama/health")
async def ollama_health():
    """Check Ollama health"""
    return {
        "ollama_available": llm_service.ollama_available,
        "gemini_available": llm_service.gemini_available
    }


@api_router.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "services": {
            "ollama": llm_service.ollama_available,
            "gemini": llm_service.gemini_available,
            "database": "connected"
        }
    }


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
