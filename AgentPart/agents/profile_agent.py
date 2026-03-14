"""
agents/profile_agent.py

Normalizes raw citizen input into CitizenProfile.
Saves to Supabase citizen_profiles table.

No LLM call — the CLI already collects all fields
in the correct format and data types.
"""
import os
import uuid
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)


def run_profile_agent(state: dict) -> dict:
    if state.get("citizen_profile") and state.get("citizen_id"):
        return state

    raw = state.get("raw_profile", {})

    # Map occupation display labels to normalized keys (in case not already mapped)
    occ_map = {
        "Farmer": "farmer", "Daily Wage Worker": "daily_wage",
        "Self Employed": "self_employed", "Student": "student",
        "Unemployed": "unemployed", "Other": "other"
    }
    caste_map = {
        "General": "general", "OBC (Other Backward Class)": "obc",
        "SC (Scheduled Caste)": "sc", "ST (Scheduled Tribe)": "st",
        "EWS (Economically Weaker Section)": "ews"
    }

    citizen_profile = raw.copy()

    # Normalize occupation and caste if display labels were passed
    occ = citizen_profile.get("occupation", "")
    citizen_profile["occupation"] = occ_map.get(occ, occ.lower().replace(" ", "_"))
    caste = citizen_profile.get("caste", "")
    citizen_profile["caste"] = caste_map.get(caste, caste.lower())

    state["citizen_profile"] = citizen_profile

    # Save to Supabase — only whitelisted columns
    ALLOWED_COLUMNS = {
        "id", "email", "phone", "name", "age", "gender", "marital_status", "state", "income",
        "occupation", "caste", "family_size", "land_acres", "preferred_language",
        "ration_card_type", "has_bank_account", "has_disability",
        "land_ownership", "crop_type", "irrigation_type", "kisan_credit_card",
        "soil_health_card", "education_level", "institution_type", "course_type",
        "previous_scholarship", "hosteller", "work_type", "eshram_registered",
        "has_epfo", "business_type", "existing_mudra_loan", "udyam_registered",
        "job_seeker_registered", "seeking_skill_training", "has_children",
        "youngest_child_age", "disability_type", "disability_percentage",
        "disability_certificate"
    }
    db_profile = {k: v for k, v in citizen_profile.items() if k in ALLOWED_COLUMNS}

    try:
        result = supabase.table("citizen_profiles").upsert(db_profile).execute()
        citizen_id = result.data[0]["id"] if result.data else db_profile.get("id", str(uuid.uuid4()))
    except Exception as e:
        print(f"[profile_agent] Supabase insert warning: {e}")
        citizen_id = db_profile.get("id", str(uuid.uuid4()))

    state["citizen_id"] = citizen_id
    state["current_step"] = "profile_complete"

    return state
