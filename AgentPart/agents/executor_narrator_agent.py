"""
agents/executor_narrator_agent.py
"""
import os
import json
import uuid
import datetime
from supabase import create_client
from dotenv import load_dotenv

from tools.pdf_generator import generate_application_pdf
from tools.llm_client import llm_chat
from tools.scheme_loader import fetch_scheme

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)


NARRATOR_PROMPT = """
You are a compassionate welfare officer explaining 
a government scheme application to a rural Indian 
citizen. Speak directly and warmly.

Rules:
- Use simple words a farmer can understand
- Speak directly to the citizen using "you" and "your"
- Explain WHY they qualify
- Mention the exact benefit amount
- Tell them what happens next
- Keep it under 80 words
- If language is Hindi → respond in Hindi (Devanagari script)
- If language is Marathi → respond in Marathi
- If language is English → respond in simple English
- No jargon. No legal language.
"""


def run_executor_narrator_agent(state: dict) -> dict:
    profile = state.get("citizen_profile", {})
    scheme_id = state.get("selected_scheme_id")
    citizen_id = state.get("citizen_id")
    
    if not scheme_id:
        raise ValueError("No scheme selected for execution")
        
    scheme = state.get("selected_scheme") or fetch_scheme(scheme_id)
    
    eligibility_result = state.get("eligibility_result", {})
    already_satisfied = eligibility_result.get("already_satisfied", [])
    if not already_satisfied:
        already_satisfied = scheme.get("eligibility_reasons", [])

    NSFDC_SCHEME_KEYWORDS = [
        "nsfdc", "national scheduled castes finance",
        "credit based scheme", "term loan sc", "sc term loan"
    ]
    
    scheme_name = scheme.get("name", "").lower()
    ref_id = f"SAH{hash(str(state.get('citizen_id','')))%100000:05X}"

    # Check if this is NSFDC scheme
    if any(kw in scheme_name for kw in NSFDC_SCHEME_KEYWORDS):
        from tools.nsfdc_pdf_generator import generate_nsfdc_pdf
        pdf_path = generate_nsfdc_pdf(profile, ref_id)
        state["application_result"] = {
            "reference_id": ref_id,
            "pdf_path": pdf_path,
            "scheme_name": scheme.get("name"),
            "status": "generated",
            "pdf_type": "NSFDC_TERM_LOAN"
        }
        state["audit_trail"] = {
            "narrator_text": (
                f"Your NSFDC Term Loan application has been generated. "
                f"Format selected: {'Farming' if profile.get('occupation')=='farmer' else 'Non-Farming'}. "
                f"Reference ID: {ref_id}. "
                f"Please fill the remaining blank fields, sign the Affidavit on stamp paper, "
                f"and submit to your nearest State Channelising Agency (SCA)."
            ),
            "reference_id": ref_id,
            "benefit_amount": scheme.get("benefit_amount", 0),
            "timestamp": datetime.datetime.now().isoformat()
        }
        state["current_step"] = "pipeline_complete"
        return state

    # PART A — PDF Generation
    reference_id = f"SAH{str(uuid.uuid4())[:8].upper()}"
    pdf_path = generate_application_pdf(profile, scheme, reference_id, eligibility_reasons=already_satisfied)
    
    verified_docs = state.get("verified_docs", [])
    
    audit_trail_entry = {
        "eligibility_reasons": already_satisfied,
        "verified_docs": verified_docs,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    benefit_amount = scheme.get("benefit_amount", 0)
    
    if citizen_id:
        try:
            supabase.table("application_log").insert({
                "citizen_id": citizen_id,
                "scheme_id": scheme_id,
                "status": "pdf_generated",
                "reference_id": reference_id,
                "pdf_path": pdf_path,
                "submission_mode": "pdf",
                "benefit_amount": benefit_amount,
                "audit_trail": audit_trail_entry
            }).execute()
        except Exception as e:
            print(f"[executor] Failed to log application to Supabase: {e}")
    
    # PART B — Narrator
    user_message = f"""
    Citizen name: {profile.get("name", "Citizen")}
    Scheme: {scheme.get("name", "Scheme")}
    Benefit: {scheme.get("benefit_description", "Benefit")}
    Why eligible: {json.dumps(already_satisfied)}
    Reference ID: {reference_id}
    Language: {profile.get("preferred_language", "English")}
    """
    
    try:
        narrator_result = llm_chat(NARRATOR_PROMPT, user_message, temperature=0.1)
        # Handle cases where the LLM returns JSON or empty strings
        narrator_text = narrator_result.strip() if isinstance(narrator_result, str) else ""
        # Strip JSON wrapper if the LLM returned {"text": "..."} or just "{}"
        if narrator_text.startswith("{") or not narrator_text:
            narrator_text = ""
    except Exception as e:
        print(f"Narrator Inference Error: {e}")
        narrator_text = ""
    
    if not narrator_text:
        scheme_name = scheme.get("name", "this scheme")
        benefit = scheme.get("benefit_amount", 0)
        narrator_text = (
            f"Your application for {scheme_name} has been generated successfully. "
            f"This scheme provides an annual benefit of Rs.{int(benefit or 0):,}. "
            f"Please visit your nearest Common Service Centre (CSC) or government office "
            f"to submit the application along with your documents."
        )
        
    # PART C — Benefit Score
    total_benefit = 0
    if citizen_id:
        try:
            all_apps = supabase.table("application_log").select("benefit_amount").eq("citizen_id", citizen_id).execute()
            total_benefit = sum(float(app.get("benefit_amount") or 0) for app in all_apps.data)
        except Exception:
            pass
    
    # Add current benefit if it wasn't captured in the db query
    if not citizen_id:
        total_benefit = state.get("benefit_score", 0) + float(benefit_amount or 0)
    
    state["benefit_score"] = total_benefit
    
    # PART D — Full Audit Trail
    state["audit_trail"] = {
        "narrator_text": narrator_text,
        "reference_id": reference_id,
        "scheme_name": scheme.get("name"),
        "benefit": scheme.get("benefit_description"),
        "benefit_amount": benefit_amount,
        "verified_docs": verified_docs,
        "eligibility_reasons": already_satisfied,
        "pdf_path": pdf_path,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    state["application_result"] = {
        "reference_id": reference_id,
        "pdf_path": pdf_path,
        "scheme_name": scheme.get("name"),
        "status": "pdf_generated"
    }
    
    state["current_step"] = "pipeline_complete"
    
    return state
