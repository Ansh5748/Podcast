# PROJECT: Fictional World Content Creation Platform (v1.0 Vision)

## PROJECT OBJECTIVE
Build an internal AI-powered system that generates hyper-realistic, cinematic content (videos, podcasts, movies, music) set in a fully persistent fictional world. The system must produce content indistinguishable from real human-shot videos, with 100% accurate human behavior, thinking patterns, and consistent character representation.

---

## CORE PRINCIPLES (v1.0)
1.  **Extreme Realism**: Behavior and visual quality must match high-end studio productions. No "AI-feel".
2.  **No Hallucinations**: Character reactions must be 100% grounded in their personality, backstory, and current state.
3.  **Complete Originality**: No real-world names, faces, countries, or references. Everything is set on another planet in a different solar system.
4.  **Thinking, Not Generating**: Characters simulate internal reasoning before responding.
5.  **Persistence**: Every person, location, and event in the world is fixed and consistent across all content.

---

## SYSTEM MODULES

### 1. WORLD ENGINE (BEYOND EARTH)
*   **Planet Simulation**: Unique geography, climate, and physics (fictional solar system).
*   **Societal Structure**: Countries, economies, governance, and cultures (entrepreneurs, politicians, students, etc.).
*   **Introductory Content**: 1-hour documentary video explaining the world's origin, history, and current state.

### 2. CHARACTER & DIGITAL TWIN ENGINE
*   **Fictional Characters**: Persistent identities with backstories, skills, and personality models.
*   **Real Person Onboarding**: Digital twins with exact mindset, thinking style, humor, and voice patterns. Replicates "how this person would actually respond".
*   **Evolution System**: Characters age and progress (e.g., student at Ara → employee at a tech hub). Requires periodic image/state updates.

### 3. HUMAN BEHAVIOR INTELLIGENCE (CRITICAL)
*   **Simulation vs. Generation**: AI must reason based on the character's role, expertise, and current mindset.
*   **Behavioral Training**: Trained on real-world patterns (podcasts, interviews, books) but generating 100% unique, unscripted responses.
*   **Emotional Variation**: Natural pauses, laughter, hesitation, and tone shifts.

### 4. LOCATION & INFRASTRUCTURE SYSTEM
*   **Fixed Locations**: Schools, studios, cities, and landmarks are persistent.
*   **Permission-Based Entry**: Real people or fictional schools can "list" themselves on the platform to be used in videos.
*   **Studio Engine**: Fixed environments (rent/buy studios) with consistent lighting and camera setups.

### 5. CONTENT CREATION PIPELINE
*   **Podcast Studio**: Dynamic conversations based on host curiosity and guest expertise.
*   **News & Social Media**: Internal "YouTube" type platform where world events are uploaded.
*   **Entertainment**: Music videos and full-length movies set in the fictional world.
*   **Quality**: Better than high-end cameras (Arri/RED) with cinematic framing and lighting.

### 6. IMMERSION & VR
*   **VR Support**: Users can enter the world, live their dreams, buy land, and participate in events.
*   **Fearless Experience**: Try things impossible in real life (bungee jumping, entrepreneurship) without real-world consequences.

---

## LOCAL EXECUTION (ROOT SCRIPTS)
*   **Install All**: `npm install` followed by `npm run install:all`
*   **Run All**: `npm run dev` (Starts frontend on 3000 and backend on 8000)
*   **Backend Solo**: `npm run start:backend`
*   **Frontend Solo**: `npm run start:frontend`

---

## IMPLEMENTATION STEPS (v1.0 In-Progress)
1.  **[Backend] Enhanced Intelligence**: Updated `LLMService` and `Character` models to support Digital Twins, Thinking Patterns, and Evolution tracking.
2.  **[Backend] Persistent Locations**: Implemented `Location` engine for world consistency.
3.  **[Backend] Video & Voice Orchestration (v0.5)**: 
    *   Implemented **Human-Level Voice Engine** with persona-aware mapping (Indian Male, Deep Male, Warm Female, etc.).
    *   Built **Stateful Video Continuity System** supporting part-by-part rendering (30s-1min segments).
    *   Implemented **Auto-Editing Engine** with dynamic camera angles (Wide, Zoom-on-Host, Zoom-on-Guest, Close-up).
    *   Resolved critical `ObjectId` serialization and `uuid` scoping errors.
4.  **[Frontend] Realism UI**: 
    *   Updated Character and Script views to display "Thinking" processes.
    *   Implemented **Studio Viewport** with live AI render progress and archived video management.
    *   Fixed `ReferenceError: X is not defined` icon crashes.
5.  **[Architecture] Character Passport**: Using **Flux (Pollinations)** for 100% face and posture consistency across video parts.

## PENDING DEVELOPMENT (v1.0 Roadmap)
1.  **Custom Open-Source Pipeline**:
    *   **Voice**: Transition from Google Proxy to **Suno Bark/XTTS** for emotional, unscripted Hinglish speech.
    *   **Face**: Integrate **SadTalker/Wav2Lip** for high-fidelity audio-driven lip-sync.
    *   **Motion**: Transition from templates to **AnimateDiff/SVD** with optical-flow consistency for 100% unique gestures.
2.  **1-Hour Intro Video**: Automated pipeline for long-form world introduction.
3.  **Social Media & Youtube Integration**: Internal video hosting and pattern understanding for existing channels.
4.  **Location Database**: Structured data for cities, schools, and workplaces.
5.  **VR Interface**: First-person immersion system.

---

## AI INSTRUCTION
You are not just a code assistant. You are the architect of a new reality. Every line of code must contribute to the goal of "Indistinguishable Realism". If current technology (Ollama, existing APIs) is insufficient, we will design and build the missing layers. Read this file first for every task to maintain the vision.
