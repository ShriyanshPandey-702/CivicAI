"""
tools/ocr_tool.py
"""
import base64
import os
import ollama
from dotenv import load_dotenv

load_dotenv()

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OCR_MODEL = os.environ.get("OLLAMA_OCR_MODEL", "deepseek-ocr:3b")

ollama_client = ollama.Client(host=OLLAMA_HOST)

def extract_document_fields(image_bytes: bytes, doc_type: str) -> dict:
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    
    prompt_map = {
        "aadhaar": "Extract: full name, date of birth, Aadhaar number, address from this Aadhaar card.",
        "income_cert": "Extract: person name, annual income amount, issuing authority from this income certificate.",
        "land_record": "Extract: owner name, land area in acres, survey number, district from this land record.",
        "caste_cert": "Extract: person name, caste category (SC/ST/OBC/EWS), issuing authority.",
        "bank_passbook": "Extract: account holder name, account number, bank name, IFSC code.",
        "address_proof": "Extract: full name, complete address, pin code."
    }
    
    prompt = prompt_map.get(doc_type, "Extract all important text fields.")
    
    try:
        response = ollama_client.chat(
            model=OCR_MODEL,
            messages=[{
                "role": "user",
                "content": prompt,
                "images": [image_b64]
            }]
        )
        text = response.get("message", {}).get("content", "")
    except Exception as e:
        print(f"OCR Request failed: {e}")
        text = str(e)
        
    return {"raw_text": text, "doc_type": doc_type}
