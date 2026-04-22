import requests
import json

def test_video_list():
    print("--- Testing Video Management (List) ---")
    backend_url = "http://localhost:8000"
    try:
        response = requests.get(f"{backend_url}/api/video/list")
        if response.status_code == 200:
            videos = response.json().get("videos", [])
            print(f"SUCCESS: Found {len(videos)} archived videos")
            for v in videos[:3]:
                print(f" - {v['title']} ({v['studio_name']})")
        else:
            print(f"FAILED: Status {response.status_code}")
    except Exception as e:
        print(f"ERROR: {e}")

def test_video_generation_flow():
    print("\n--- Testing Video Generation Flow (Free Tier) ---")
    backend_url = "http://localhost:8000"
    
    # 1. Get scripts
    try:
        scripts = requests.get(f"{backend_url}/api/scripts").json()
        if not scripts:
            print("No scripts found. Please generate a script first.")
            return
        
        script_id = scripts[0]['id']
        studio_id = "the_wood_room"
        
        # 2. Trigger generation
        print(f"Triggering generation for script {script_id}...")
        response = requests.post(
            f"{backend_url}/api/video/generate",
            json={"script_id": script_id, "studio_id": studio_id}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS: Video generated successfully!")
            print(f"Video URL: {result['video']['video_url']}")
        else:
            print(f"FAILED: Status {response.status_code}, {response.text}")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_video_list()
    test_video_generation_flow()
