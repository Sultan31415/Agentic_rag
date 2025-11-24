import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables.")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
resp = requests.get(url)
data = resp.json()

for m in data.get("models", []):
    name = m.get("name", "")
    supported = m.get("supportedGenerationMethods", [])
    print(name, "->", supported)
