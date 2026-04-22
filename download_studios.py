import os
import requests
from pathlib import Path

STUDIOS = {
    "wood_room": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1000",
    "horizon": "https://images.unsplash.com/photo-1478737270239-2fccd27ee8fb?auto=format&fit=crop&q=80&w=1000",
    "loft_lounge": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000",
    "urban": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000",
    "she_speaks": "https://images.unsplash.com/photo-1492619339944-513478936675?auto=format&fit=crop&q=80&w=1000",
    "minimalist": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
    "industrial": "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=1000",
    "library": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1000",
    "future": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
    "nature": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000",
    "cyberpunk": "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&q=80&w=1000"
}

def download_studios():
    base_path = Path("frontend/public/studios")
    base_path.mkdir(parents=True, exist_ok=True)
    
    for name, url in STUDIOS.items():
        file_path = base_path / f"{name}.jpg"
        if not file_path.exists():
            print(f"Downloading {name}...")
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    with open(file_path, "wb") as f:
                        f.write(response.content)
                    print(f"Saved {name}.jpg")
                else:
                    print(f"Failed to download {name}: {response.status_code}")
            except Exception as e:
                print(f"Error downloading {name}: {e}")
        else:
            print(f"{name}.jpg already exists")

if __name__ == "__main__":
    download_studios()
