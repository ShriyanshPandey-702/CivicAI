"""
tools/rag.py
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from tools.llm_client import get_embedding

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)


def search_schemes(citizen_profile: dict, top_k: int = 10) -> list:
    """
    Builds a query text, gets the embedding, and calls match_schemes.
    """
    query_text = f"""
    Age: {citizen_profile.get('age', 0)}, 
    Income: {citizen_profile.get('income', 0)}, 
    Caste: {citizen_profile.get('caste', 'unknown')}, 
    State: {citizen_profile.get('state', 'unknown')}, 
    Occupation: {citizen_profile.get('occupation', 'unknown')}, 
    Land: {citizen_profile.get('land_acres', 0)} acres
    """
    
    embedding = get_embedding(query_text)
    
    result = supabase.rpc("match_schemes", {
        "query_embedding": embedding,
        "match_threshold": 0.3,
        "match_count": top_k
    }).execute()
    
    return result.data
