from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# ==================== WORLD MODELS ====================

class WorldCreate(BaseModel):
    name: str
    prompt: Optional[str] = ""

class World(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: str
    geography: Optional[str] = ""
    climate: Optional[str] = ""
    governance: Optional[str] = ""
    economy: Optional[str] = ""
    culture: Optional[str] = ""
    continents: List[Dict[str, Any]] = Field(default_factory=list) # [{name, countries: [{name, states: [{name, cities: []}]}]}]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)

# ==================== CHARACTER MODELS ====================

class CharacterCreate(BaseModel):
    world_id: str
    name: Optional[str] = ""
    age: Optional[str] = ""
    profession: Optional[str] = ""
    current_location: Optional[str] = ""
    prompt: Optional[str] = ""
    is_real_person: bool = False
    external_links: Optional[List[str]] = None

class Character(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    world_id: str
    world_name: str
    name: str
    age: Optional[str] = ""
    profession: Optional[str] = ""
    backstory: str
    personality: str
    personality_traits: List[str] = Field(default_factory=list)
    expertise: str
    visual_description: str
    image_url: Optional[str] = None
    
    # Realism & Behavior (v1.0)
    is_real_person: bool = False
    thinking_style: Optional[str] = ""
    humor_style: Optional[str] = ""
    voice_profile_id: Optional[str] = None
    memory_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Evolution & Location
    current_location: Optional[str] = "Unknown" # e.g., "Ara City - Student District"
    career_status: Optional[str] = "Starting" # e.g., "Student", "Engineer", "Entrepreneur"
    lat: Optional[float] = 0.0
    lng: Optional[float] = 0.0
    
    # Voice & Media
    voice_id: Optional[str] = Field(default_factory=lambda: f"vb-indian-{generate_uuid()[:8]}")
    voice_accent: Optional[str] = "Indian"
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)

# ==================== SCRIPT & CONTENT MODELS ====================

class ScriptCreate(BaseModel):
    topic: str
    host_character_id: str
    guest_character_id: str
    style: Optional[str] = "Conversational"

class PodcastScript(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str
    topic: str
    world_id: str
    host_character_id: str
    guest_character_id: str
    host_name: str
    guest_name: str
    host_image_url: Optional[str] = None
    guest_image_url: Optional[str] = None
    language: str = "English"
    conversation: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)

# ==================== SYSTEM MODELS ====================

class OllamaModel(BaseModel):
    name: str
    size: Optional[int] = 0
    modified_at: Optional[str] = ""

class LocationCreate(BaseModel):
    world_id: str
    name: str
    type: str # e.g., "City", "Village", "School", "Studio"
    description: str
    coordinates: Optional[Dict[str, float]] = None

class Location(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    world_id: str
    name: str
    type: str
    description: str
    coordinates: Optional[Dict[str, float]] = None
    parent_location_id: Optional[str] = None # e.g., City ID for a School
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(from_attributes=True)
