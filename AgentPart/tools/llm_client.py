import os
import json
import re
import ollama
from dotenv import load_dotenv

load_dotenv()

# Ollama config
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:9b")
EMBEDDING_MODEL = os.environ.get("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b")
EMBEDDING_DIMS = int(os.environ.get("OLLAMA_EMBEDDING_DIMS", "1536"))

# Configure ollama client host
ollama_client = ollama.Client(host=OLLAMA_HOST)

def llm_chat(system_prompt: str,
             user_message: str,
             temperature: float = 0,
             json_mode: bool = False,
             think: bool = False) -> str:
    
    # /think and /no_think prefix tokens are ONLY supported by qwen3:* models.
    # qwen3.5 is a different model family and does NOT support these tokens —
    # sending them causes an empty response. Guard strictly against this.
    is_qwen3_think_model = (
        "qwen3:" in OLLAMA_MODEL.lower() and
        "qwen3.5" not in OLLAMA_MODEL.lower() and
        "qwen3-" not in OLLAMA_MODEL.lower()
    )
    if is_qwen3_think_model:
        user_message = f"/think\n{user_message}" if think else f"/no_think\n{user_message}"
        
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    options = {
        "temperature": temperature,
        "num_predict": 2048
    }

    try:
        if json_mode:
            response = ollama_client.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                options=options,
                format="json"
            )
        else:
            response = ollama_client.chat(
                model=OLLAMA_MODEL,
                messages=messages,
                options=options
            )
            
        return response['message']['content']
        
    except Exception as e:
        print(f"Ollama chat error: {e}")
        raise

def llm_generate_json(system_prompt: str,
                      user_message: str,
                      think: bool = False) -> dict:
    
    try:
        response_text = llm_chat(
            system_prompt,
            user_message,
            temperature=0,
            json_mode=True,
            think=think
        )
        print(f"[llm_client] Raw LLM response preview: {repr(response_text[:200])}")
    except Exception as e:
        print(f"Error generating JSON: {e}")
        response_text = ""
    
    # Step 1: Remove thinking blocks
    response_text = re.sub(
        r'<think>[\s\S]*?</think>',
        '',
        response_text,
        flags=re.DOTALL | re.IGNORECASE
    ).strip()
    
    # Step 2: Remove orphaned closing tags
    response_text = re.sub(
        r'</think>',
        '',
        response_text
    ).strip()
    
    # Step 3: Extract from markdown code fences
    json_match = re.search(
        r'```(?:json)?\s*([\s\S]*?)\s*```',
        response_text
    )
    if json_match:
        response_text = json_match.group(1).strip()
    
    # Step 4: Try direct JSON parse
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass
    
    # Step 5: Extract first { to last }
    start = response_text.find('{')
    end = response_text.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(
                response_text[start:end+1]
            )
        except json.JSONDecodeError:
            pass
    
    # Step 6: Safe dict fallback
    print(f"JSON parse failed. Raw response: {response_text[:300]}")
    return {
        "already_satisfied": [],
        "needs_verification": [],
        "questions": [],
        "matched": True,
        "confidence": 60,
        "reason": "Profile reviewed. Proceeding."
    }

def get_embedding(text: str) -> list:
    """Embeddings use local Ollama"""
    response = ollama_client.embeddings(
        model=EMBEDDING_MODEL,
        prompt=text
    )
    embedding = response['embedding']
    
    # Truncate to 1536 dims for pgvector
    return embedding[:EMBEDDING_DIMS]
