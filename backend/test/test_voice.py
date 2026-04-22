import requests
import urllib.parse

def test_google_tts():
    print("--- Testing Google Translate TTS ---")
    text = "Hello, this is a test of the truly unlimited free voice engine."
    lang = "en-IN"
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(text)}&tl={lang}&client=tw-ob"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"SUCCESS: Received audio data ({len(response.content)} bytes)")
            # Save for manual verification
            with open("backend/test/voice_sample.mp3", "wb") as f:
                f.write(response.content)
            print("Sample saved to backend/test/voice_sample.mp3")
        else:
            print(f"FAILED: Status {response.status_code}")
    except Exception as e:
        print(f"ERROR: {e}")

def test_proxy_audio():
    print("\n--- Testing Backend Proxy Audio ---")
    backend_url = "http://localhost:8000"
    text = "Testing the backend proxy for voice generation."
    voice = "Brian"
    url = f"{backend_url}/api/proxy-audio?voice={voice}&text={urllib.parse.quote(text)}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"SUCCESS: Proxy returned audio ({len(response.content)} bytes)")
        else:
            print(f"FAILED: Status {response.status_code}, Detail: {response.text}")
    except Exception as e:
        print(f"ERROR: Ensure backend is running at {backend_url}. Error: {e}")

if __name__ == "__main__":
    test_google_tts()
    test_proxy_audio()
