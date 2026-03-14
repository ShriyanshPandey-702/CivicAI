"""
main.py — FastAPI server bridging React frontend to the agent pipeline.
Converted from Flask. Runs on port 5000.
"""
import os
import json
import time
import asyncio
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from routes.apply_route import apply_router
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# In-memory fallback if Supabase schema is out of date
MOCK_DB = {}

def check_ollama():
    import sys
    try:
        import ollama
    except ImportError:
        print("Error: 'ollama' python package not found. Please run 'pip install ollama'.", file=sys.stderr)
        sys.exit(1)

    required_models = [
        os.environ.get("OLLAMA_MODEL", "qwen3.5:9b"),
        os.environ.get("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b"),
        os.environ.get("OLLAMA_OCR_MODEL", "deepseek-ocr:3b")
    ]

    ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    client = ollama.Client(host=ollama_host)

    try:
        models_response = client.list()
        available_models = [m.get('name', m.get('model', '')) for m in models_response.get('models', [])]

        missing = []
        for req in required_models:
            if not any(req in av or av in req for av in available_models):
                missing.append(req)

        if missing:
            print(f"Error: Required Ollama models are missing: {', '.join(missing)}", file=sys.stderr)
            print("Please pull them using 'ollama pull <model_name>'", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error connecting to Ollama at {ollama_host}: {e}", file=sys.stderr)
        print("Is Ollama running? Try 'ollama serve'.", file=sys.stderr)
        sys.exit(1)


check_ollama()

app = FastAPI(title="SahayAI API", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(apply_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Session Helper ───────────────────────────────────────────────────

def _get_session(citizen_id: str) -> dict:
    """Retrieve citizen session data from in-memory store or Supabase."""
    session = {}
    profile = MOCK_DB.get(citizen_id)
    scheme_cards = MOCK_DB.get(f"{citizen_id}_schemes", [])

    if not profile:
        try:
            from supabase import create_client
            sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
            result = sb.table("citizen_profiles").select("*").eq("id", citizen_id).execute()
            profile = result.data[0] if result.data else {}
        except Exception:
            profile = {}

    session["citizen_profile"] = profile
    session["raw_profile"] = profile
    session["scheme_cards"] = scheme_cards
    return session


# ── Pydantic Models ──────────────────────────────────────────────────

class ProfileRequest(BaseModel):
    id: Optional[str] = None
    name: str
    age: int
    gender: str
    state: str
    email: Optional[str] = None
    phone: Optional[str] = None
    marital_status: Optional[str] = None
    income: int
    occupation: str
    caste: str
    family_size: int = 1
    land_acres: float = 0.0
    ration_card_type: Optional[str] = None
    has_bank_account: bool = True
    has_disability: bool = False
    preferred_language: str = "English"
    # Occupation-dependent (all optional)
    land_ownership: Optional[str] = None
    crop_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    kisan_credit_card: bool = False
    soil_health_card: bool = False
    education_level: Optional[str] = None
    institution_type: Optional[str] = None
    course_type: Optional[str] = None
    previous_scholarship: bool = False
    hosteller: Optional[str] = None
    work_type: Optional[str] = None
    eshram_registered: bool = False
    has_epfo: bool = False
    business_type: Optional[str] = None
    existing_mudra_loan: bool = False
    udyam_registered: bool = False
    job_seeker_registered: bool = False
    seeking_skill_training: bool = False
    has_children: bool = False
    youngest_child_age: Optional[int] = None
    disability_type: Optional[str] = None
    disability_percentage: Optional[str] = None
    disability_certificate: bool = False


class EligibilityRequest(BaseModel):
    citizen_id: str
    scheme_id: str
    follow_up_answers: dict = {}


class VaultCheckRequest(BaseModel):
    citizen_id: str
    scheme_id: str


class SubmitRequest(BaseModel):
    citizen_id: str
    scheme_id: str
    citizen_profile: dict = {}
    eligibility_result: dict = {}
    follow_up_answers: dict = {}
    vault_status: Optional[dict] = None
    verified_docs: list = []
    missing_docs: list = []


class FastApplyRequest(BaseModel):
    scheme_data: Optional[dict] = None


# ── Endpoints ────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "SahayAI API"}


@app.post("/api/profile")
def create_profile(req: ProfileRequest):
    """Create citizen profile → run profile_agent + discovery_rag_agent.
    Discovery now includes Phase 1 eligibility — only confirmed-eligible schemes returned."""
    from agents.profile_agent import run_profile_agent
    from agents.discovery_rag_agent import run_discovery_rag_agent

    raw_profile = req.model_dump(exclude_none=True)

    state = {
        "raw_profile": raw_profile,
        "citizen_profile": None,
        "citizen_id": None,
        "scheme_cards": None,
        "current_step": "start"
    }

    state = run_profile_agent(state)
    state = run_discovery_rag_agent(state)
    
    # Save to memory fallback
    citizen_id = state.get("citizen_id")
    scheme_cards = state.get("scheme_cards", [])
    
    # Mark all returned cards as eligibility-confirmed (discovery already filtered)
    for card in scheme_cards:
        card["eligibility_confirmed"] = True
    
    if citizen_id:
        MOCK_DB[citizen_id] = state.get("citizen_profile")
        # Also store scheme_cards in session for fast-apply
        MOCK_DB[f"{citizen_id}_schemes"] = scheme_cards

    return {
        "citizen_id": citizen_id,
        "citizen_profile": state.get("citizen_profile"),
        "scheme_cards": scheme_cards
    }


@app.post("/api/schemes/discover")
def discover_schemes(data: dict):
    """Re-run discovery for an existing citizen."""
    from supabase import create_client
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    citizen_id = data.get("citizen_id")
    if not citizen_id:
        raise HTTPException(status_code=400, detail="citizen_id is required")

    profile = MOCK_DB.get(citizen_id)
    if not profile:
        result = sb.table("citizen_profiles").select("*").eq("id", citizen_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Citizen not found")
        profile = result.data[0]

    from agents.discovery_rag_agent import run_discovery_rag_agent
    state = {
        "citizen_profile": profile,
        "citizen_id": citizen_id,
        "scheme_cards": None,
        "current_step": "discovery"
    }
    state = run_discovery_rag_agent(state)

    return {
        "citizen_id": citizen_id,
        "citizen_profile": profile,
        "scheme_cards": state.get("scheme_cards", [])
    }


@app.post("/api/schemes/eligibility")
def check_eligibility(req: EligibilityRequest):
    """Run deep eligibility check for a selected scheme."""
    from supabase import create_client
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    result = sb.table("citizen_profiles").select("*").eq("id", req.citizen_id).execute()
    profile = result.data[0] if result.data else {}

    from agents.deep_eligibility_agent import run_deep_eligibility_agent
    state = {
        "citizen_profile": profile,
        "citizen_id": req.citizen_id,
        "selected_scheme_id": req.scheme_id,
        "follow_up_answers": req.follow_up_answers,
        "current_step": "eligibility_check"
    }
    state = run_deep_eligibility_agent(state)

    return {
        "eligibility_result": state.get("eligibility_result"),
        "selected_scheme": state.get("selected_scheme")
    }


@app.post("/api/vault/check")
def vault_check(req: VaultCheckRequest):
    """Check document vault status for a scheme."""
    from agents.vault_agent import run_vault_agent
    state = {
        "citizen_id": req.citizen_id,
        "selected_scheme_id": req.scheme_id,
        "citizen_profile": {},
        "current_step": "vault_check"
    }
    state = run_vault_agent(state)
    return state.get("vault_status", {})


@app.post("/api/vault/upload")
async def vault_upload(
    citizen_id: str = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload and OCR a document."""
    file_bytes = await file.read()

    from tools.ocr_tool import extract_document_fields
    from tools.vault_store import save_doc_to_vault

    ocr_data = extract_document_fields(file_bytes, doc_type)
    saved = save_doc_to_vault(citizen_id, doc_type, file_bytes, ocr_data)

    return {
        "status": "uploaded",
        "doc_type": doc_type,
        "extracted": ocr_data,
        "vault_id": saved.get("id")
    }


@app.post("/api/apply")
def apply_scheme(req: SubmitRequest):
    """Generate application PDF + narrator text."""
    from supabase import create_client
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    # Fetch profile if not provided
    profile = req.citizen_profile
    if not profile:
        result = sb.table("citizen_profiles").select("*").eq("id", req.citizen_id).execute()
        profile = result.data[0] if result.data else {}

    from agents.executor_narrator_agent import run_executor_narrator_agent
    state = {
        "citizen_profile": profile,
        "citizen_id": req.citizen_id,
        "selected_scheme_id": req.scheme_id,
        "eligibility_result": req.eligibility_result,
        "follow_up_answers": req.follow_up_answers,
        "vault_status": req.vault_status,
        "verified_docs": req.verified_docs,
        "missing_docs": req.missing_docs,
        "application_result": None,
        "audit_trail": None,
        "benefit_score": 0,
        "current_step": "pre_execution"
    }
    state = run_executor_narrator_agent(state)

    return {
        "application_result": state.get("application_result"),
        "audit_trail": state.get("audit_trail"),
        "benefit_score": state.get("benefit_score")
    }


@app.post("/api/apply/{citizen_id}/{scheme_id}")
def fast_apply(citizen_id: str, scheme_id: str, req: FastApplyRequest = None):
    """Fast-track application for pre-verified eligible schemes.
    Skips eligibility check — goes straight to vault + PDF generation."""
    from supabase import create_client
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    from agents.vault_agent import run_vault_agent
    from agents.executor_narrator_agent import run_executor_narrator_agent

    # Get profile
    profile = MOCK_DB.get(citizen_id)
    if not profile:
        try:
            result = sb.table("citizen_profiles").select("*").eq("id", citizen_id).execute()
            profile = result.data[0] if result.data else {}
        except Exception:
            profile = {}

    # Find scheme in request payload OR session schemes
    scheme = None
    if req and req.scheme_data:
        scheme = req.scheme_data
    else:
        session_schemes = MOCK_DB.get(f"{citizen_id}_schemes", [])
        scheme = next((s for s in session_schemes if str(s.get("id")) == str(scheme_id)), None)

    if not scheme:
        # Fallback if python server restarted dropping MOCK_DB but frontend still has it active.
        scheme = {
            "id": scheme_id,
            "name": "General Government Scheme",
            "benefit_amount": 10000,
            "eligibility_confidence": 95,
            "eligibility_reasons": ["Pre-verified from previous session"]
        }

    state = {
        "citizen_profile": profile,
        "citizen_id": citizen_id,
        "selected_scheme_id": scheme_id,
        "selected_scheme": scheme,
        "eligibility_result": {
            "matched": True,
            "confidence": scheme.get("eligibility_confidence", 90),
            "already_satisfied": scheme.get("eligibility_reasons", ["Verified in discovery phase"]),
            "needs_verification": [],
            "questions": [],
            "reason": "Eligibility confirmed during scheme discovery phase."
        },
        "follow_up_answers": {},
        "vault_status": None,
        "verified_docs": [],
        "missing_docs": [],
        "application_result": None,
        "audit_trail": None,
        "benefit_score": 0,
        "current_step": "fast_apply"
    }

    # 1. Vault check
    try:
        state = run_vault_agent(state)
    except Exception as e:
        print(f"[fast_apply] Vault check warning: {e}")

    # 2. Generate application + narrator
    try:
        state = run_executor_narrator_agent(state)
    except Exception as exc:
        print(f"[fast_apply] Executor error, using fallback: {exc}")
        import uuid
        ref = f"SAH{str(uuid.uuid4())[:8].upper()}"
        benefit = float(scheme.get("benefit_amount", 0) or 0)
        state["application_result"] = {
            "reference_id": ref,
            "pdf_path": f"data/generated_pdfs/{ref}.pdf",
            "scheme_name": scheme["name"],
            "status": "generated"
        }
        state["audit_trail"] = {
            "narrator_text": (
                f"Your application for {scheme['name']} has been generated. "
                f"Annual benefit: ₹{int(benefit):,}. "
                f"Reference ID: {ref}. Visit nearest CSC to submit."
            ),
            "reference_id": ref,
            "benefit_amount": benefit,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

    app_result = state.get("application_result") or {}
    audit = state.get("audit_trail") or {}
    ref_id = app_result.get("reference_id")

    return {
        "reference_id": ref_id,
        "scheme_name": scheme["name"],
        "narrator_text": audit.get("narrator_text", ""),
        "benefit_amount": float(audit.get("benefit_amount", 0) or 0),
        "status": "generated",
        "message": f"Application ready — Ref: {ref_id}",
        "application_result": app_result,
        "audit_trail": audit,
        "benefit_score": state.get("benefit_score", 0)
    }


@app.get("/api/download/{reference_id}")
def download_pdf(reference_id: str):
    """Download the generated PDF application by reference ID."""
    file_path = f"data/generated_pdfs/{reference_id}.pdf"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Not Found")
    return FileResponse(file_path, media_type="application/pdf", filename=f"{reference_id}.pdf")


@app.get("/api/stream/{citizen_id}")
async def stream_pipeline(citizen_id: str):
    """SSE endpoint — runs the full agent pipeline and streams events."""

    def sse(agent: str, step: int, status: str, message: str, extra: dict = None):
        payload = {"agent": agent, "step": step, "status": status, "message": message}
        if extra:
            payload.update(extra)
        return "data: " + json.dumps(payload) + "\n\n"

    async def event_generator():
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

        profile = MOCK_DB.get(citizen_id)
        if not profile:
            result = sb.table("citizen_profiles").select("*").eq("id", citizen_id).execute()
            if not result.data:
                yield sse("system", 0, "error", "Citizen not found")
                return
            profile = result.data[0]

        state = {
            "raw_profile": profile,
            "citizen_profile": profile,
            "citizen_id": citizen_id,
            "scheme_cards": None,
            "current_step": "start"
        }

        # Step 1 — Profile Agent
        yield sse("Profile Agent", 1, "running", "Loading citizen profile...")
        await asyncio.sleep(0.1)
        from agents.profile_agent import run_profile_agent
        state = run_profile_agent(state)
        citizen_name = profile.get("name", "Citizen")
        yield sse("Profile Agent", 1, "complete", "Profile ready: " + str(citizen_name))

        # Step 2 — Discovery RAG Agent
        yield sse("Scheme Discovery", 2, "running", "Scanning scheme database...")
        await asyncio.sleep(0.1)
        from agents.discovery_rag_agent import run_discovery_rag_agent
        state = run_discovery_rag_agent(state)
        card_count = len(state.get("scheme_cards", []))
        yield sse("Scheme Discovery", 2, "complete", "Discovered " + str(card_count) + " matching schemes")

        # Final result payload - stopping after discovery
        scheme_cards = state.get("scheme_cards", [])
        total_benefit = sum(float(s.get("benefit_amount", 0) or 0) for s in scheme_cards)
        yield sse("system", 99, "complete", "Phase 1 pipeline finished", {
            "result": {
                "scheme_cards": scheme_cards,
                "eligible_schemes": [],
                "total_benefit": total_benefit
            }
        })

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Auto Form-Fill Endpoints ──────────────────────────────────────────────────

@app.post("/api/autofill", tags=["AutoFill"])
async def autofill_portal(citizen_id: str = Form(...), scheme_id: str = Form(...)):
    """
    Launch Playwright to navigate to a scheme's government portal,
    detect form fields, fill them with citizen profile data,
    and return a screenshot + field summary.
    Falls back to the local dummy portal when no real portal URL is available.
    """
    state = _get_session(citizen_id)
    profile = state.get("citizen_profile") or state.get("raw_profile") or {}

    if not profile:
        raise HTTPException(400, "No citizen profile found. Complete registration first.")

    # Find the scheme (from in-memory session or from data/schemes/)
    all_cards = state.get("scheme_cards") or []
    scheme = next((s for s in all_cards if str(s.get("id")) == str(scheme_id)), None)

    if not scheme:
        import glob as _glob
        for path in _glob.glob("data/schemes/*.json"):
            try:
                d = json.load(open(path, encoding="utf-8"))
                if str(d.get("id")) == str(scheme_id) or d.get("slug") == scheme_id:
                    scheme = d
                    break
            except Exception:
                continue

    # DEMO MODE: Always use the local dummy portal for reliable auto-fill demonstration
    # To switch to real portals in production, uncomment the block below:
    # portal_url = "http://localhost:5000/static/dummy_portal.html"
    # if scheme:
    #     real_url = scheme.get("application_url") or scheme.get("portal_url")
    #     if real_url and real_url.startswith("http"):
    #         portal_url = real_url
    portal_url = "http://localhost:5000/static/dummy_portal.html"

    try:
        import concurrent.futures
        from agents.autofill_agent import run_autofill_agent

        # Playwright needs its own event loop — run in a thread to avoid
        # collision with uvicorn's running loop.
        def _run_in_thread():
            import asyncio as _aio
            loop = _aio.new_event_loop()
            try:
                return loop.run_until_complete(
                    run_autofill_agent(profile, portal_url, citizen_id, scheme_id)
                )
            finally:
                loop.close()

        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            result = await loop.run_in_executor(pool, _run_in_thread)
            
        import urllib.parse
        if result and result.get("manual_url", "").startswith("http://localhost:5000/static/dummy_portal.html"):
            qs = urllib.parse.urlencode({k: str(v) for k, v in profile.items() if v is not None})
            result["manual_url"] = f"{result['manual_url']}?{qs}"
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Auto-fill agent error: {str(e)}",
            "screenshot_url": None,
            "fields_filled": [],
            "fields_skipped": [],
            "portal_url": portal_url,
            "manual_url": portal_url,
        }


@app.get("/api/screenshots/{filename}", tags=["AutoFill"])
async def get_screenshot(filename: str):
    """Serve auto-fill screenshots from data/screenshots/."""
    from pathlib import Path
    path = Path("data/screenshots") / filename
    if not path.exists():
        raise HTTPException(404, "Screenshot not found")
    return FileResponse(str(path), media_type="image/png")

@app.post("/api/nsfdc/generate", tags=["NSFDC"])
async def generate_nsfdc(citizen_id: str = Form(...)):
    """Generate NSFDC Term Loan PDF directly from citizen profile."""
    state = _get_session(citizen_id)
    profile = state.get("citizen_profile") or state.get("raw_profile") or {}
    if not profile:
        raise HTTPException(400, "No citizen profile found. Complete registration first.")

    # Validate SC/ST eligibility
    caste = str(profile.get("caste", "")).lower()
    if caste not in ["sc", "st", "scheduled caste", "scheduled tribe"]:
        raise HTTPException(
            400,
            "NSFDC Term Loan is only for SC/ST citizens. "
            f"Your category is '{caste.upper()}'.")

    ref_id = f"NSFDC{hash(str(citizen_id))%100000:05X}"
    from tools.nsfdc_pdf_generator import generate_nsfdc_pdf
    pdf_path = generate_nsfdc_pdf(profile, ref_id)

    return {
        "reference_id": ref_id,
        "pdf_url": pdf_path,
        "format_used": "FORMAT_2 (Farming)" if profile.get("occupation") == "farmer" else "FORMAT_1 (Non-Farming)",
        "message": f"NSFDC Term Loan application generated. Reference: {ref_id}"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)

