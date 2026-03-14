"""
tools/vault_store.py
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)


def save_doc_to_vault(citizen_id: str, doc_type: str, file_bytes: bytes, ocr_extracted: dict) -> dict:
    file_path = f"{citizen_id}/{doc_type}.jpg"
    
    try:
        supabase.storage.from_("document-vault").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
    except Exception as e:
        print(f"Vault Upload Error: {e}")

    result = supabase.table("document_vault").upsert({
        "citizen_id": citizen_id,
        "doc_type": doc_type,
        "storage_path": file_path,
        "ocr_extracted": ocr_extracted,
        "verified": True
    }).execute()
    
    return result.data[0] if result.data else {}


def get_vault_docs(citizen_id: str) -> list:
    result = supabase.table("document_vault")\
        .select("*")\
        .eq("citizen_id", citizen_id)\
        .execute()
    return result.data
