"""
scripts/ingest_schemes.py

Reads all 12 scheme JSON files in data/schemes,
generates embeddings using Ollama (qwen3-embedding:4b),
and inserts them into the Supabase 'schemes' table.
"""
import json
import os
import glob
import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)


def embed_scheme(scheme: dict) -> list[float]:
    text = f"""
    Scheme: {scheme['name']}
    Category: {scheme['category']}
    Description: {scheme['description']}
    Eligibility: {json.dumps(scheme['eligibility_rules'])}
    Benefits: {scheme['benefit_description']}
    """
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b")
    
    response = requests.post(
        f"{base_url}/api/embed",
        json={
            "model": model,
            "input": text
        },
        timeout=30
    )
    response.raise_for_status()
    data = response.json()
    
    embedding = data["embeddings"][0]
    # Truncate to 1536 to stay within pgvector limit
    return embedding[:1536]


def ingest_all():
    scheme_files = glob.glob("data/schemes/*.json")
    if not scheme_files:
        print("No scheme files found in data/schemes/*.json")
        return

    for file_path in scheme_files:
        with open(file_path, encoding='utf-8') as f:
            scheme = json.load(f)
        
        print(f"Embedding: {scheme['name']}")
        embedding = embed_scheme(scheme)
        
        # Insert into Supabase
        # Catch any conflict if run multiple times (requires distinct constraint or we just insert)
        # For hackathon, we assume fresh DB.
        supabase.table("schemes").insert({
            "name": scheme["name"],
            "category": scheme["category"],
            "eligibility_rules": scheme["eligibility_rules"],
            "required_docs": scheme["required_docs"],
            "benefit_amount": scheme["benefit_amount"],
            "benefit_description": scheme["benefit_description"],
            "portal_url": scheme["portal_url"],
            "embedding": embedding
        }).execute()
        
        print(f"✔ Inserted: {scheme['name']}")
    
    print(f"All {len(scheme_files)} schemes ingested successfully.")


if __name__ == "__main__":
    # Ensure Ollama base URL is set for the ollama client implicitly
    os.environ["OLLAMA_HOST"] = os.environ.get("OLLAMA_BASE_URL", "https://api.ollama.com")
    ingest_all()
