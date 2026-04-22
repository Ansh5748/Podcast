import os
import requests
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

def test_llm():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    ollama_host = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
    gemini_key = os.environ.get('GEMINI_API_KEY')
    
    print(f"--- LLM Diagnostic ---")
    print(f"Ollama Host: {ollama_host}")
    
    # Test Ollama
    try:
        res = requests.get(f"{ollama_host}/api/tags", timeout=2)
        if res.status_code == 200:
            print(f"Ollama: ONLINE")
            models = res.json().get('models', [])
            print(f"Ollama Models: {[m.get('name') for m in models]}")
        else:
            print(f"Ollama: OFFLINE (Status {res.status_code})")
    except Exception as e:
        print(f"Ollama: OFFLINE ({type(e).__name__})")
        
    # Test Gemini
    if gemini_key:
        print(f"Gemini Key: Found (starts with {gemini_key[:5]}...)")
        success = False
        for model_name in ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']:
            try:
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Hello")
                print(f"Gemini ({model_name}): ONLINE (Response: {response.text[:20].strip()}...)")
                success = True
                break
            except Exception as e:
                print(f"Gemini ({model_name}): ERROR ({type(e).__name__})")
        if not success:
            print("Gemini: All models failed.")
    else:
        print(f"Gemini Key: NOT FOUND")

if __name__ == "__main__":
    test_llm()
