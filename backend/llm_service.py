import os
import json
import requests
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

PODCAST_KNOWLEDGE_BASE = {
    "TBPN": {"style": "Hook-driven, fast-paced, high energy", "profession": "Media, Entertainment"},
    "Raj Shamani": {"style": "Entrepreneurship, networking, personal growth", "profession": "Business, Lifestyle"},
    "Alex Hormozi": {"style": "Value-packed, direct, business scaling, no-nonsense", "profession": "Business, Sales"},
    "The Anatomy Of a Dream": {"style": "Visionary, creative process, psychology", "profession": "Creative, Psychology"},
    "HimanshuG": {"style": "Technical, practical AI applications", "profession": "Technology"},
    "Y Combinator": {"style": "Startup-focused, tactical, high-growth", "profession": "Startups"},
    "Aquired": {"style": "Deep-dive business history, analytical, strategic", "profession": "Business Strategy"},
    "Doc Williams": {"style": "Tools-focused, efficiency, no-code", "profession": "Productivity"},
    "Greg Isenberg": {"style": "Community-driven, product-led growth", "profession": "Marketing"},
    "Nikhil Kamath": {"style": "In-depth financial and economic analysis", "profession": "Finance"},
    "Tony Robbins": {"style": "High-impact motivation, psychological shifts", "profession": "Personal Development"},
    "GrowthX": {"style": "Revenue-focused, growth frameworks", "profession": "Growth Marketing"},
    "Dan Zakaria": {"style": "Design-centric, UX, product philosophy", "profession": "Design"},
    "GaryVee": {"style": "Attention-focused, hustle, social media trends", "profession": "Marketing"},
    "Nishkarsh Sharma": {"style": "E-commerce, tactical execution", "profession": "E-commerce"},
    "ankur warikoo": {"style": "Relatable, structured advice, life lessons", "profession": "Education, Finance"},
    "David Bombal": {"style": "Technical, cybersecurity, networking", "profession": "Cybersecurity"},
    "Andrej Karpathy": {"style": "First-principles technical, AI research", "profession": "AI Research"},
    "The Ai Hustle": {"style": "Trend-focused, practical AI monetization", "profession": "AI Business"},
    "Andy Lo": {"style": "Creative tech, automation", "profession": "Tech Automation"},
    "Simon Hoiberg": {"style": "SaaS growth, technical architecture", "profession": "SaaS"},
    "Modern MBA": {"style": "Business case studies, strategic analysis", "profession": "Business Education"},
    "Liam Ottley": {"style": "AI Automation Agency (AAA) focus", "profession": "AI Services"},
    "100x Engineers": {"style": "High-performance engineering, technical depth", "profession": "Software Engineering"},
    "Two Minute Papers": {"style": "Research-heavy, visual, exciting future tech", "profession": "Scientific Research"},
    "AI Explained": {"style": "Deep-dive AI analysis, news context", "profession": "AI News"},
    "Matt Wolfe": {"style": "Tool-focused AI news, experimental", "profession": "AI Tools"},
    "John Hammond": {"style": "Hacking, security walkthroughs", "profession": "Cybersecurity"},
    "Daniel Marqusee": {"style": "Product design, creative direction", "profession": "Design"},
    "Big Think": {"style": "Intellectual, interdisciplinary, profound", "profession": "Philosophy, Science"},
    "Gen-Z Way": {"style": "Youth-culture, trend-driven", "profession": "Culture"},
    "Ali Abdaal": {"style": "Productivity, meaningful work, slow-growth", "profession": "Productivity"},
    "Richard Branson": {"style": "Adventure-led business, big-picture vision", "profession": "Entrepreneurship"},
    "Mark Cuban": {"style": "Pragmatic, investment-focused, sharp", "profession": "Finance, Sports"},
    "Time Feriss": {"style": "Deconstruction of excellence, tactical", "profession": "Performance"},
    "Gotham Clips": {"style": "Short-form impact, intense moments", "profession": "Media"},
    "The Toak Show": {"style": "Candid, storytelling", "profession": "Society"},
    "Dara Nolan": {"style": "Humorous, observational", "profession": "Comedy"},
    "Rich Roll": {"style": "Deep health, endurance, spiritual growth", "profession": "Wellness"},
    "Cleo Abram": {"style": "Explainer-style, tech optimism", "profession": "Science Communication"},
    "Andrew Huberman": {"style": "Science-based protocols, detailed biology", "profession": "Health, Neuroscience"},
    "Theo Von": {"style": "Absurdist, storytelling, relatable human struggle", "profession": "Comedy, Society"},
    "PBD Podcast": {"style": "Business meets politics, intense debate", "profession": "Business, Politics"},
    "Candace Ownes": {"style": "Controversial, cultural critique", "profession": "Politics"},
    "Crime Junkie": {"style": "Suspenseful storytelling, detailed investigations", "profession": "True Crime"},
    "New York Times Podcast": {"style": "Journalistic, investigative, polished", "profession": "News"},
    "Rotten Mango": {"style": "Intense true crime storytelling", "profession": "True Crime"},
    "Tucker Carlson": {"style": "Opinion-heavy, direct, cultural commentary", "profession": "Media, Politics"},
    "Call Her Daddy": {"style": "Candid, relationship-focused, modern culture", "profession": "Relationships"},
    "Shawn Ryan Show": {"style": "Military/Special Ops deep dives, intense, patriotic", "profession": "Military"},
    "Joe Rogan": {"style": "Long-form, wide-ranging, curiosity-led, unfiltered", "profession": "General"},
    "Tim Ferriss Show": {"style": "Deconstructing world-class performers", "profession": "Performance"},
    "Deviate with Rolf Potts": {"style": "Travel-focused, philosophical", "profession": "Travel"},
    "Bookworm": {"style": "Literature analysis, focused", "profession": "Education"},
    "The Knowledge Project": {"style": "Decision-making, mental models", "profession": "Self-Improvement"},
    "My First Million": {"style": "Ideation, business opportunities, high-energy", "profession": "Business"},
    "Huberman Lab": {"style": "Scientific protocols for performance", "profession": "Health"},
    "Noah Kagan Presents": {"style": "Practical business experiments", "profession": "Entrepreneurship"},
    "Indie Hackers": {"style": "Solopreneurship, small-scale business", "profession": "Business"},
    "Diary of a CEO": {"style": "Vulnerable, high-production, deep life lessons", "profession": "Business, Life"},
    "Dare to Lead with Brene Brown": {"style": "Vulnerability, leadership, empathy", "profession": "Leadership"},
    "Smart Passive Income": {"style": "Educational, structured business advice", "profession": "Online Business"},
    "Online Marketing Made Easy": {"style": "Step-by-step marketing tutorials", "profession": "Marketing"}
}

class LLMService:
    def __init__(self):
        self.ollama_host = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
        self.gemini_api_key = os.environ.get('GEMINI_API_KEY')
        self.ollama_available = False
        self.gemini_available = False
        
        if self.gemini_api_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=self.gemini_api_key)
                self.gemini_available = True
                logger.info("Google GenAI (Gemini) configured successfully.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")
                self.gemini_available = False
            
        self._check_ollama()

    def _check_ollama(self):
        try:
            # Add /api/tags check with short timeout
            response = requests.get(f"{self.ollama_host}/api/tags", timeout=1)
            if response.status_code == 200:
                self.ollama_available = True
                logger.info("Ollama is ONLINE")
            else:
                self.ollama_available = False
                logger.warning(f"Ollama returned status {response.status_code}")
        except Exception as e:
            self.ollama_available = False
            logger.info(f"Ollama is OFFLINE: {type(e).__name__}")

    def get_ollama_models(self) -> List[Dict[str, Any]]:
        if not self.ollama_available:
            return []
        try:
            response = requests.get(f"{self.ollama_host}/api/tags")
            return response.json().get('models', [])
        except Exception:
            return []

    async def _call_llm(self, prompt: str, system_prompt: str = "", model_override: Optional[str] = None) -> str:
        """
        Unified LLM Gateway.
        Integrated Models:
        - Text: Llama 3, Mistral, Gemini 2.0 Flash
        - Video: SkyReels-V2 (High-Consistency), Wan2.2 (Hallucination-Free)
        - Voice: Voicebox (Indian Accent), Indic-TTS (Regional Accuracy)
        """
        # Try Ollama first
        if self.ollama_available:
            try:
                # Use model_override if provided, otherwise detect best available
                model_name = model_override
                if not model_name:
                    models = self.get_ollama_models()
                    model_name = "llama3" # Default
                    
                    if models:
                        model_names = [m.get('name') for m in models]
                        if "llama3:latest" in model_names: model_name = "llama3:latest"
                        elif "llama3" in model_names: model_name = "llama3"
                        elif "llama3.1:latest" in model_names: model_name = "llama3.1:latest"
                        elif "llama3.1" in model_names: model_name = "llama3.1"
                        else:
                            llama_models = [n for n in model_names if "llama" in n.lower()]
                            if llama_models: model_name = llama_models[0]
                            else: model_name = model_names[0]

                response = requests.post(
                    f"{self.ollama_host}/api/generate",
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "system": system_prompt,
                        "stream": False
                    },
                    timeout=120 # Increased to 120 for heavy script generation
                )
                if response.status_code == 200:
                    res_text = response.json().get('response', '').strip()
                    if res_text:
                        logger.info(f"Ollama ({model_name}) generated response successfully.")
                        return res_text
            except requests.exceptions.Timeout:
                logger.warning(f"Ollama ({model_name}) timed out after 90s. Is the model too large or hardware slow?")
            except Exception as e:
                logger.error(f"Ollama call failed: {e}")
        
        # Fallback to Gemini using the new SDK
        if self.gemini_available:
            # Common model names and their fully qualified versions
            model_variations = [
                'gemini-2.0-flash', 
                'gemini-1.5-flash', 
                'gemini-1.5-pro',
                'models/gemini-2.0-flash',
                'models/gemini-1.5-flash',
                'models/gemini-1.5-pro'
            ]
            
            for model_name in model_variations:
                try:
                    logger.info(f"Attempting Gemini fallback with {model_name}...")
                    response = self.gemini_client.models.generate_content(
                        model=model_name,
                        contents=f"System: {system_prompt}\n\nPrompt: {prompt}"
                    )
                    res_text = response.text.strip()
                    if res_text:
                        logger.info(f"Gemini ({model_name}) fallback succeeded.")
                        return res_text
                except Exception as e:
                    # Check for quota errors specifically to avoid spamming other variations if exhausted
                    err_msg = str(e).lower()
                    if "429" in err_msg or "resource_exhausted" in err_msg:
                        logger.warning(f"Gemini {model_name} quota exhausted. Skipping other variations.")
                        break
                    logger.warning(f"Gemini {model_name} call failed: {e}")
                    continue
        
        # FINAL SAFETY FALLBACK - Hardcoded high-quality templates if all AI fails
        logger.warning("All AI services failed. Using hardcoded fallback templates.")
        return self._get_hardcoded_fallback(prompt)

    def _get_hardcoded_fallback(self, context: str) -> str:
        """Provide high-quality, realistic descriptions and names when AI is unavailable"""
        context_lower = context.lower()
        
        # Unique Naming Banks
        continent_names = ["Aethelgard", "Vesperia", "Northelia", "Zynthos", "Oshara", "Kyberia", "Eldoris", "Xandaria"]
        country_names = [
            "Kaelith", "Dravos", "Zunari", "Mythor", "Vaelon", "Nyxia", "Orionis", "Talaris", 
            "Xylos", "Pharos", "Ithaca-Prime", "Solara", "Lunaris", "Aethel", "Vesper", "Northe",
            "Zynth", "Oshar", "Kyber", "Eldor", "Xandar", "Kael", "Drav", "Zunar", "Myth"
        ]
        state_names = ["New Eden", "Silicon Flats", "The Glass Rim", "Iron Reach", "Cobalt Bay", "Neon Spire", "Crystal Peak", "Shadow Basin"]
        city_names = ["Aether-City", "Void-Port", "Pulse-Hub", "Core-Terminal", "Sky-Station", "Bio-Sphere", "Ozone-Point", "Tech-Center"]

        # World sub-fields
        if "world geography" in context_lower:
            return "A multi-layered landscape of obsidian shards and crystalline formations, dominated by the 'Shattered Spire' mountain range."
        if "world climate" in context_lower:
            return "Extreme temperature shifts between day and night, with periodic 'Ozone Storms' that light up the perpetual twilight."
        if "world governance" in context_lower:
            return "A technocratic meritocracy governed by the 'Council of Engineers', where resource allocation is handled by AI protocols."
        if "world economy" in context_lower:
            return "Based entirely on the extraction of 'Void Matter' from the planet's core and the trade of advanced thermal shielding."
        if "world culture" in context_lower:
            return "Stoic and highly technical; the inhabitants value efficiency and resilience, with a rich oral tradition of survival stories."
        
        if "world hierarchy" in context_lower:
            # Generate a massive hierarchy for fallback with UNIQUE names
            continents = []
            for i in range(len(continent_names)):
                c_name = continent_names[i]
                countries = []
                for j in range(15): # 15 countries per continent
                    co_name = f"{country_names[(i+j) % len(country_names)]}-{i}{j}"
                    states = []
                    for k in range(5): # 5 states per country
                        s_name = f"{state_names[(j+k) % len(state_names)]}-{k}"
                        cities = [f"{city_names[(k+l) % len(city_names)]}-{l}" for l in range(10)] # 10 cities per state
                        states.append({"name": s_name, "cities": cities})
                    countries.append({"name": co_name, "states": states})
                continents.append({"name": c_name, "countries": countries})
            return json.dumps(continents)

        if "world" in context_lower or "planet" in context_lower:
            return (
                "A world defined by its perpetual twilight and jagged obsidian mountain ranges that hum with a low-frequency electromagnetic pulse. "
                "The atmosphere is thick with a metallic tang, and the local architecture consists of modular, subterranean hubs connected by pressurized glass transit tubes. "
                "Survival here isn't just a choice; it's a meticulously calculated logistical dance between resource scarcity and the planet's erratic gravity shifts."
            )
        
        if "doctor" in context_lower or "physician" in context_lower:
            return (
                "A surgical specialist known for a clinical detachment that borders on the unsettling, yet possesses a 99% success rate in high-risk bio-augmentations. "
                "They move with a precise, economy of motion, often smelling faintly of sterile ozone and bitter tea. "
                "Beneath the cold exterior lies a restless intellect that views every biological failure as a personal insult to their craft."
            )

        if "engineer" in context_lower or "tech" in context_lower:
            return (
                "A structural engineer who speaks in rapid-fire technical jargon and keeps their workspace in a state of 'organized chaos' that only they can navigate. "
                "They are obsessed with the structural integrity of the glass transit tubes, often seen tapping at joints and listening for microscopic stress fractures. "
                "Their hands are perpetually stained with graphite and hydraulic fluid, a physical testament to a life spent wrestling with the planet's unforgiving physics."
            )

        # Default general high-realism description
        return (
            "An individual defined by their sharp, observant gaze and a habit of checking their surroundings with a calculated caution born from years in the outer rims. "
            "They possess a dry, cynical wit and a voice that sounds like gravel over silk, often speaking in short, impactful sentences. "
            "Every movement is deliberate, hiding a deep-seated internal tension that only surfaces when they think no one is watching."
        )

    async def suggest_description(self, type: str, context: str) -> str:
        """Generate a brief but detailed AI suggestion for a world or character"""
        system_prompt = (
            f"You are an expert creative writer for a fictional world platform called 'CharacterCast'. "
            f"Your goal is to provide 'Extreme Realism' for a {type}. "
            f"Avoid all AI cliches. Do not use words like 'vibrant', 'tapestry', 'testament', or 'nestled'. "
            "Write with a cinematic, grounded, and slightly gritty tone. "
            "Include specific sensory details (smells, specific sounds, textures). "
            "If it's a character, focus on their internal contradictions and human flaws. "
            "If it's a world, focus on the logistics of survival and the atmospheric tension. "
            "Output ONLY the description text. No titles, no introduction, no quotes, just the paragraph(s)."
        )
        user_prompt = (
            f"Create a detailed description for this {type} based on the following context:\n"
            f"Context: {context}\n\n"
            f"Make it about 3-4 sentences long, focusing on high-impact realism."
        )
        
        return await self._call_llm(user_prompt, system_prompt)

    async def generate_world(self, prompt: str, name: str) -> Dict[str, Any]:
        system_prompt = (
            "You are a world-building expert specializing in fictional planets in non-Earth solar systems. "
            "Create a detailed fictional world with 100% human realism. "
            "Output ONLY a JSON object with fields: "
            "name, description, geography, climate, governance, economy, culture, "
            "continents (list of 6-9 objects, each with 'name' and 'countries' list. "
            "Each country object must have 'name', 'states' list. "
            "Each state object must have 'name', 'cities' list of strings)."
        )
        user_prompt = f"World Name: {name}\nUser Instructions: {prompt}"
        
        response_text = await self._call_llm(user_prompt, system_prompt)
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
            world_data = json.loads(json_str)
            # Ensure no fields are empty
            for field in ["geography", "climate", "governance", "economy", "culture"]:
                if not world_data.get(field) or world_data[field] == "Unknown":
                    world_data[field] = self._get_hardcoded_fallback(f"world {field}")
            
            if not world_data.get('continents'):
                world_data['continents'] = json.loads(self._get_hardcoded_fallback("world hierarchy"))
                
            return world_data
        except Exception as e:
            logger.error(f"Failed to parse world JSON: {e}")
            # Return full structured data from fallback instead of "Unknown"
            return {
                "name": name or "Aeteria",
                "description": self._get_hardcoded_fallback("world"),
                "geography": self._get_hardcoded_fallback("world geography"),
                "climate": self._get_hardcoded_fallback("world climate"),
                "governance": self._get_hardcoded_fallback("world governance"),
                "economy": self._get_hardcoded_fallback("world economy"),
                "culture": self._get_hardcoded_fallback("world culture"),
                "continents": json.loads(self._get_hardcoded_fallback("world hierarchy"))
            }

    def _get_coordinates_from_location(self, location: str) -> Dict[str, float]:
        """Generate consistent coordinates based on the location name string"""
        import hashlib
        import random
        
        # Use a hash of the location string to seed random number generation
        # This ensures the same location always results in the same coordinates
        seed = int(hashlib.md5(location.encode()).hexdigest(), 16)
        rng = random.Random(seed)
        
        return {
            "lat": rng.uniform(-60, 60),
            "lng": rng.uniform(-180, 180)
        }

    async def generate_character(self, world_name: str, world_desc: str, prompt: str, name: str, is_real: bool = False, profession: str = "", location: str = "", age: str = "") -> Dict[str, Any]:
        role_desc = "character designer" if not is_real else "digital twin architect"
        system_prompt = (
            f"You are a {role_desc} for the fictional world of {world_name}. "
            f"World context: {world_desc}. "
            "Create a character with 100% human realism. "
            "Output ONLY a JSON object with fields: "
            "name, age, profession, backstory, personality, personality_traits (list), expertise, "
            "visual_description, thinking_style, humor_style, current_location, career_status, "
            "lat (number between -90 and 90), lng (number between -180 and 180)."
        )
        user_prompt = f"Character Name: {name}\nUser Instructions: {prompt}\nIs Digital Twin: {is_real}\n"
        if profession:
            user_prompt += f"Required Profession: {profession}\n"
        if location:
            user_prompt += f"Starting Location: {location}\n"
        if age:
            user_prompt += f"Exact Age: {age}\n"
        
        response_text = await self._call_llm(user_prompt, system_prompt)
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
            char_data = json.loads(json_str)
            
            # Ensure coordinates exist for the globe based on location
            if location:
                coords = self._get_coordinates_from_location(location)
                char_data['lat'] = coords['lat']
                char_data['lng'] = coords['lng']
            elif 'lat' not in char_data:
                import random
                char_data['lat'] = random.uniform(-60, 60)
                char_data['lng'] = random.uniform(-180, 180)
            
            return char_data
        except Exception as e:
            logger.error(f"Failed to parse character JSON: {e}")
            coords = self._get_coordinates_from_location(location or "Main Transit Hub")
            return {
                "name": name or "Unnamed Citizen",
                "age": "28",
                "profession": profession or "Citizen",
                "backstory": self._get_hardcoded_fallback(prompt or "character"),
                "personality": "Complex",
                "personality_traits": ["Resilient", "Observant"],
                "expertise": profession or "Survival",
                "visual_description": f"A {profession or 'person'} from {world_name}",
                "thinking_style": "Analytical",
                "humor_style": "Dry",
                "current_location": location or "Main Transit Hub",
                "career_status": "Active",
                "lat": coords['lat'],
                "lng": coords['lng']
            }

    async def generate_podcast_script(self, topic: str, host: Dict[str, Any], guest: Dict[str, Any], style: str, language: str = "English") -> Dict[str, Any]:
        """Generate a full long-form podcast script in multiple parts for reliability"""
        try:
            # PART 1: The Intro & Guest History (15-20 exchanges)
            part1_script = await self._generate_script_part(
                topic, host, guest, style, language, 
                part_mission="Introduction and Deep Dive into Guest's History & Achievements. Establish why they are valuable.",
                target_length=20
            )
            
            # PART 2: Deep Dive into Topic & Mindset (20-25 exchanges)
            part2_script = await self._generate_script_part(
                topic, host, guest, style, language, 
                part_mission=f"Deep dive into the core topic: {topic}. Connect it to the guest's unique mindset and past experience.",
                target_length=25,
                context_conversation=part1_script.get('conversation', [])
            )
            
            # PART 3: Controversy & Future Vision (20-25 exchanges)
            part3_script = await self._generate_script_part(
                topic, host, guest, style, language, 
                part_mission="Explore controversies in the field, unpopular opinions, and the future vision. End with a powerful closing.",
                target_length=25,
                context_conversation=part1_script.get('conversation', []) + part2_script.get('conversation', [])
            )
            
            full_conversation = (
                part1_script.get('conversation', []) + 
                part2_script.get('conversation', []) + 
                part3_script.get('conversation', [])
            )
            
            return {
                "title": part1_script.get('title', f"Podcast: {topic}"),
                "conversation": full_conversation
            }
        except Exception as e:
            logger.error(f"Multi-part generation failed: {e}")
            return self._get_massive_fallback(topic, host, guest, language)

    async def _generate_script_part(self, topic: str, host: Dict[str, Any], guest: Dict[str, Any], style: str, language: str, part_mission: str, target_length: int, context_conversation: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Helper to generate a specific chunk of the script"""
        knowledge_base_str = json.dumps(PODCAST_KNOWLEDGE_BASE, indent=2)
        
        language_instruction = f"The script MUST be written in {language}."
        if language.lower() == "hinglish":
            language_instruction = "The script MUST be written in 'Hinglish' (Hindi-English mix)."
            
        recent_context = ""
        if context_conversation:
            # Use last 10 lines for context
            recent_context = f"\nRECENT CONTEXT (Continue from here):\n{json.dumps(context_conversation[-10:])}"
        
        system_prompt = (
            "You are a master podcast scriptwriter for the CharacterCast Platform. "
            f"Your mission for this part: {part_mission}\n"
            f"{language_instruction}\n"
            f"Use this knowledge base for inspiration:\n{knowledge_base_str}\n\n"
            "CORE REQUIREMENTS:\n"
            "1. NO INTRODUCTIONS LIKE 'TODAY WE TALK ABOUT...': Start like a real conversation. The host should start by diving into the guest's deep history, achievements, or a specific valuable thing they've done in the past.\n"
            "2. GUEST-CENTRIC START: The first 10-15 exchanges must focus on the guest's mindset, past struggles, and what makes them valuable/unique in their field.\n"
            "3. 30+ ASPECTS: Cover the guest's profession, specific knowledge, unique interests, mindset, childhood influences, big wins, and failures.\n"
            "4. EXTREME REALISM: Use natural speech patterns, filler words ('uh', 'you know'), interruptions, and emotional shifts.\n"
            "5. HOOK, KNOWLEDGE, CONTROVERSY: Start with a massive hook, deliver deep unique knowledge, and touch on a controversial or high-stakes angle to keep audience retention.\n"
            "6. THOUGHT SIMULATION: Every exchange MUST include a 'thought' field showing the character's internal logic/hidden agenda.\n"
            "7. SCALE: Aim for at least 50-70 exchanges in this initial part.\n"
            "8. EMOTIONS: Use specific, varied emotions (e.g., 'Skeptical', 'Intense', 'Vulnerable', 'Dismissive').\n"
            "Output ONLY a JSON object with: title, conversation (list of objects with character_name, text, emotion, thought)."
        )
        
        host_context = f"{host['name']} ({host['profession']}, {host['thinking_style']})"
        guest_context = f"{guest['name']} ({guest['profession']}, {guest['thinking_style']})"
        
        user_prompt = (
            f"Topic: {topic}\n"
            f"Style: {style}\n"
            f"Host: {host_context}\n"
            f"Guest: {guest_context}\n"
            f"{part_mission}\n"
            f"{recent_context}"
        )
        
        # Try multiple models for reliability
        models_to_try = ["llama3:latest", "llama3.2:latest", "mistral:latest"]
        response_text = ""
        
        for model in models_to_try:
            try:
                response_text = await self._call_llm(user_prompt, system_prompt, model_override=model)
                if response_text and "error" not in response_text.lower():
                    break
            except:
                continue
        
        if not response_text and self.gemini_available:
            response_text = await self._call_llm(user_prompt, system_prompt)
            
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
            return json.loads(json_str)
        except:
            # Small local fallback for this specific part
            return {"conversation": []}

    def _get_massive_fallback(self, topic: str, host: Dict[str, Any], guest: Dict[str, Any], language: str) -> Dict[str, Any]:
        """Generates a massive 50+ exchange fallback when AI services fail"""
        h_name = host['name']
        g_name = guest['name']
        h_prof = host.get('profession', 'Expert')
        g_prof = guest.get('profession', 'Specialist')
        is_hinglish = language.lower() == "hinglish"
        
        import random
        
        conversation = []
        
        # 1. Guest Intro / History (15 exchanges)
        if is_hinglish:
            conversation.append({"character_name": h_name, "text": f"Yaar {g_name}, main kaafi time se soch raha tha... tumne wo jo 5 saal pehle start kiya tha, that pivot point. Wahan se sab badal gaya, right?", "emotion": "Intense", "thought": "Start with the real history, no fluff."})
            conversation.append({"character_name": g_name, "text": "Bilkul. Log sirf results dekhte hain, par wo 2 saal ka grind... it was brutal. Maine sab kuch stake par laga diya tha.", "emotion": "Vulnerable", "thought": "Vulnerability is the best hook."})
            conversation.append({"character_name": h_name, "text": "I remember seeing your work back then. {g_prof} industry mein tab koi aisa risk nahi le raha tha.", "emotion": "Respectful", "thought": "Acknowledge the unique achievement."})
            conversation.append({"character_name": g_name, "text": "True. Tab sab ne bola tha ki main pagal hoon. But I had this gut feeling ki technology is direction mein move karegi.", "emotion": "Confident", "thought": "Highlighting my vision."})
        else:
            conversation.append({"character_name": h_name, "text": f"So {g_name}, I've been digging into your history. That moment 5 years ago... that wasn't just a pivot. It was a complete teardown of everything you built, wasn't it?", "emotion": "Intense", "thought": "Dive straight into the achievement/struggle."})
            conversation.append({"character_name": g_name, "text": "It was. Everyone sees the success now, but those two years... they were dark. I had everything on the line, and I mean everything.", "emotion": "Vulnerable", "thought": "Be real. People connect with the struggle."})
            conversation.append({"character_name": h_name, "text": "In the {g_prof} world, taking a bet that big usually ends careers. What was the specific trigger that made you go all-in?", "emotion": "Analytical", "thought": "Get into the technical/strategic 'why'."})
            conversation.append({"character_name": g_name, "text": "It was a conversation I had with a mentor. He told me that if I'm not uncomfortable, I'm not growing. That hit me hard.", "emotion": "Reflective", "thought": "Sharing the mindset shift."})

        # Add 46 more simulated exchanges to reach 50+
        aspects = [
            "childhood influences", "biggest failure", "daily routine", "unpopular opinion", 
            "future vision", "technical bottlenecks", "ethics of the field", "mental health",
            "managing scale", "learning from competitors", "the role of luck", "system building"
        ]
        
        for i in range(len(conversation), 65):
            is_host = i % 2 == 0
            char = h_name if is_host else g_name
            aspect = aspects[i % len(aspects)]
            
            if is_hinglish:
                if is_host:
                    texts = [
                        f"Mera ek question hai about {aspect}. Tum ise kaise handle karte ho?",
                        "Kyunki industry mein kafi noise hai is baare mein.",
                        "Interesting. But what about the controversy? Log kehte hain ye sustainable nahi hai.",
                        "Main agree karta hoon, par execution matters more than just the idea.",
                        "Ye aspect kaafi log miss kar dete hain. Your mindset here is quite unique.",
                        "Let's dive deeper. Agar tum aaj start karte, toh kya badalte?"
                    ]
                else:
                    texts = [
                        f"{aspect.capitalize()} is actually the core of my strategy. Bina uske scale nahi hota.",
                        "People think it's easy, but systems banana padta hai. Automation is key.",
                        "Exactly! Main hamesha kehta hoon, focus on the 1% changes.",
                        "Vahi toh main bol raha hoon. High-stakes games require high-stakes thinking.",
                        "Sach bolun toh, it's about the grit. 99% log quit kar dete hain jab cheezein tough hoti hain.",
                        "Mera simple rule hai: Keep iterating until the market forced you to stop."
                    ]
            else:
                if is_host:
                    texts = [
                        f"I want to touch on {aspect}. How does that integrate into your broader philosophy?",
                        "There's a lot of debate around this. Some say it's too risky.",
                        "That's a bold stance. But how do you reconcile that with the current market trends?",
                        "I see your point. But the data suggests a different direction for most players.",
                        "This is where the 'Hook' comes in. What's the one thing everyone is getting wrong about this?",
                        "If you were to mentor your younger self, knowing what you know now, what's the one lesson?"
                    ]
                else:
                    texts = [
                        f"{aspect.capitalize()} is the filter I use for every major decision. It simplifies everything.",
                        "Risk is just uncalculated opportunity. I spend 80% of my time calculating, 20% executing.",
                        "The trends are lagging indicators. I prefer looking at the first-principles of the industry.",
                        "The data is only as good as the questions you ask it. Most people ask the wrong questions.",
                        "The controversy is where the alpha is. If everyone agrees, there's no profit left in the idea.",
                        "It's about the obsession. If you aren't thinking about this at 3 AM, you aren't in the game."
                    ]
            
            conversation.append({
                "character_name": char,
                "text": texts[i % len(texts)],
                "emotion": random.choice(["Serious", "Intense", "Skeptical", "Confident", "Vulnerable", "Direct"]),
                "thought": f"Exploring {aspect} in the context of {topic}. Part {i}."
            })
            
        return {
            "title": f"The {g_name} Blueprint: {topic}",
            "conversation": conversation
        }

    async def extend_podcast_script(self, script_data: Dict[str, Any], host: Dict[str, Any], guest: Dict[str, Any], new_style: Optional[str] = None, language: str = "English") -> List[Dict[str, Any]]:
        """Add 4 more high-impact exchanges to an existing script"""
        last_exchanges = script_data['conversation'][-15:] # Give more context (15 exchanges)
        
        language_instruction = f"The script MUST be written in {language}."
        if language.lower() == "hinglish":
            language_instruction = "The script MUST be written in 'Hinglish' (Hindi-English mix)."
        
        system_prompt = (
            "You are extending a high-stakes podcast conversation. "
            "IMPORTANT: Continue exactly from where the last line left off. DO NOT repeat topics already covered. "
            f"{language_instruction}\n"
            "Establish a NEW angle or deeper dive into the topic. "
            f"Incorporate elements of 'Hook, Knowledge, Controversy'. "
            f"New suggested style/pivot: {new_style or 'Maintain current flow'}. "
            "Generate EXACTLY 4 new exchanges that push the conversation deeper. "
            "Output ONLY a JSON list of 4 objects with: character_name, text, emotion, thought."
        )
        
        user_prompt = (
            f"Topic: {script_data['topic']}\n"
            f"Recent Context (Last 15 lines): {json.dumps(last_exchanges)}\n"
            f"Host: {host['name']}\n"
            f"Guest: {guest['name']}\n"
            "Generate the next 4 unique exchanges in the conversation. Do NOT repeat previous lines."
        )
        
        response_text = await self._call_llm(user_prompt, system_prompt)
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
            
            if not json_str.startswith('[') and not json_str.startswith('{'):
                 raise ValueError("Non-JSON response received from LLM")
                 
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse extension JSON: {e}")
            
            # Randomized and context-aware fallback templates for extension
            import random
            
            templates = [
                [
                    {"character_name": host['name'], "text": "Let's pivot for a second. How does this impact the common person?", "emotion": "Curious", "thought": "I need to make this relatable."},
                    {"character_name": guest['name'], "text": "It changes everything. We're looking at a complete paradigm shift.", "emotion": "Serious", "thought": "They aren't ready for the scale of this."},
                    {"character_name": host['name'], "text": "A paradigm shift is a big claim. Can you give me one concrete example?", "emotion": "Skeptical", "thought": "Pushing for evidence."},
                    {"character_name": guest['name'], "text": "Look at the data from the last quarter. It's unprecedented.", "emotion": "Confident", "thought": "The numbers don't lie."}
                ],
                [
                    {"character_name": host['name'], "text": "I've heard rumors that this was planned years ago. Any truth to that?", "emotion": "Intense", "thought": "Going for the controversy."},
                    {"character_name": guest['name'], "text": "Rumors? I've seen the documents. This was orchestrated.", "emotion": "Direct", "thought": "I'm exposing the whole thing now."},
                    {"character_name": host['name'], "text": "If that's true, why hasn't anyone spoken up until now?", "emotion": "Shocked", "thought": "This is a massive scoop."},
                    {"character_name": guest['name'], "text": "Fear. Plain and simple. But I'm done being afraid.", "emotion": "Vulnerable", "thought": "This is my moment of truth."}
                ]
            ]
            
            # Adjust templates for Hinglish if needed
            if language.lower() == "hinglish":
                templates = [
                    [
                        {"character_name": host['name'], "text": "Chalo, thoda pivot karte hain. Common man par iska kya impact hoga?", "emotion": "Curious", "thought": "Relatability check."},
                        {"character_name": guest['name'], "text": "Sab kuch badal jayega. Hum ek complete paradigm shift dekh rahe hain.", "emotion": "Serious", "thought": "Scale is huge."},
                        {"character_name": host['name'], "text": "Paradigm shift? Ye toh bada claim hai. Koi concrete example do?", "emotion": "Skeptical", "thought": "Evidence needed."},
                        {"character_name": guest['name'], "text": "Last quarter ka data dekho. It's totally unprecedented.", "emotion": "Confident", "thought": "Numbers talk."}
                    ]
                ]
            
            return random.choice(templates)

    async def rethink_exchange(self, script_data: Dict[str, Any], exchange_index: int, host: Dict[str, Any], guest: Dict[str, Any]) -> Dict[str, Any]:
        """Regenerate a single exchange with a 'rethink' approach (deeper, more controversial, or better hook)"""
        context_before = script_data['conversation'][max(0, exchange_index-5):exchange_index]
        original_exchange = script_data['conversation'][exchange_index]
        
        system_prompt = (
            "You are 'rethinking' a specific line in a podcast script to make it more impactful. "
            "Make it sharper, more human, or more controversial. "
            "Keep the same character who was speaking. "
            "Output ONLY a JSON object with: character_name, text, emotion, thought."
        )
        
        user_prompt = (
            f"Context before: {json.dumps(context_before)}\n"
            f"Original line: {json.dumps(original_exchange)}\n"
            "Regenerate this line to be 100% more engaging and realistic."
        )
        
        response_text = await self._call_llm(user_prompt, system_prompt)
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to parse rethink JSON: {e}")
            return original_exchange
