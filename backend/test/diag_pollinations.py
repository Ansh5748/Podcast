import requests
import os
import sys

def test_pollinations_url():
    # Example prompt that might have been used
    name = "Dr. Kaelen Voss"
    visual_description = "A person from Aetheria-9 with sharp, observant gaze and a habit of checking their surroundings."
    prompt = f"High-end cinematic portrait of {name}, {visual_description}. Ultra-realistic, 8k, detailed skin texture, professional studio lighting, shallow depth of field."
    
    encoded_prompt = requests.utils.quote(prompt)
    seed = sum(ord(c) for c in name)
    pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
    
    print(f"Testing URL: {pollinations_url}")
    
    try:
        response = requests.get(pollinations_url, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type')}")
        
        if response.status_code == 200:
            if 'image' in response.headers.get('Content-Type', ''):
                print("Success! Received an image.")
                # Save it to verify
                with open("test/generated_image.jpg", "wb") as f:
                    f.write(response.content)
                print("Image saved to test/generated_image.jpg")
            else:
                print(f"Warning: Content-Type is not image. Body: {response.text[:200]}")
        else:
            print(f"Error: Received status code {response.status_code}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_pollinations_url()
