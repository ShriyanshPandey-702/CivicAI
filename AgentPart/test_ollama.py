import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("OLLAMA_API_KEY", "").strip()
base_url = os.environ.get("OLLAMA_BASE_URL", "https://api.ollama.com").strip()
model = os.environ.get("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b").strip()

url = f"{base_url}/v1/embeddings"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
data = {
    "model": model,
    "input": "hello world"
}

try:
    print(f"Testing {url}...")
    res = requests.post(url, headers=headers, json=data)
    print("STATUS:", res.status_code)
    try:
        print("RESPONSE:", res.json())
    except:
        print("TEXT:", res.text)
except Exception as e:
    print("ERROR:", e)
    
url2 = f"{base_url}/api/embeddings"
data2 = {
    "model": model,
    "prompt": "hello world"
}
try:
    print(f"Testing {url2}...")
    res = requests.post(url2, headers=headers, json=data2)
    print("STATUS:", res.status_code)
    try:
        print("RESPONSE:", res.json())
    except:
        print("TEXT:", res.text)
except Exception as e:
    print("ERROR:", e)
