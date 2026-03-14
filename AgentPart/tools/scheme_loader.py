"""
tools/scheme_loader.py

Unified scheme lookup: tries Supabase first, falls back to local JSON files.
Normalizes scraped JSON schemas to match the expected format.
"""
import os
import glob
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)

_SCHEMES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "schemes")

# Cache local schemes in memory (loaded once)
_local_schemes_cache: dict | None = None


def _load_local_schemes() -> dict:
    """Load all local JSON schemes into a dict keyed by 'id'."""
    global _local_schemes_cache
    if _local_schemes_cache is not None:
        return _local_schemes_cache

    _local_schemes_cache = {}
    try:
        for filepath in glob.glob(os.path.join(_SCHEMES_DIR, "*.json")):
            with open(filepath, "r", encoding="utf-8") as f:
                scheme = json.load(f)
                scheme_id = scheme.get("id")
                if scheme_id:
                    _local_schemes_cache[scheme_id] = scheme
                # Also index by slug for fallback matching
                slug = scheme.get("slug")
                if slug:
                    _local_schemes_cache[slug] = scheme
    except Exception as e:
        print(f"[scheme_loader] Error loading local schemes: {e}")

    return _local_schemes_cache


def _normalize_scheme(scheme: dict) -> dict:
    """
    Normalize a scraped scheme JSON to match the format expected by agents.
    Safe to call on already-normalized schemes.
    """
    # Already has eligibility_rules → likely original format, return as-is
    if "eligibility_rules" in scheme and isinstance(scheme["eligibility_rules"], dict):
        return scheme

    # Convert scraped format → standard format
    normalized = dict(scheme)

    # eligibility_criteria → eligibility_rules
    criteria = scheme.get("eligibility_criteria", [])
    rules = {}
    for c in criteria:
        field = c.get("field", "")
        if field == "age":
            rules["min_age"] = c.get("min")
            rules["max_age"] = c.get("max")
        elif field == "income":
            rules["max_income"] = c.get("max")
        elif field == "caste":
            rules["caste"] = c.get("values", ["all"])
    if not rules:
        rules = {"caste": ["all"]}
    normalized["eligibility_rules"] = rules

    # documents_required → required_docs
    if "documents_required" in scheme and "required_docs" not in scheme:
        normalized["required_docs"] = scheme["documents_required"]

    # Ensure required fields exist
    normalized.setdefault("required_docs", [])
    normalized.setdefault("benefit_amount", 0)
    normalized.setdefault("benefit_description", scheme.get("details", ""))
    normalized.setdefault("category", scheme.get("scheme_category_raw", "General"))
    normalized.setdefault("portal_url", scheme.get("application_url", ""))

    return normalized


def fetch_scheme(scheme_id: str) -> dict:
    """
    Fetch a scheme by ID.
    1. Try Supabase 'schemes' table first.
    2. Fall back to local JSON files from data/schemes/.
    Returns a normalized scheme dict or {} if not found.
    """
    # Try Supabase first
    try:
        result = supabase.table("schemes").select("*").eq("id", scheme_id).execute()
        if result.data:
            return result.data[0]
    except Exception as e:
        print(f"[scheme_loader] Supabase lookup failed for '{scheme_id}': {e}")

    # Fall back to local JSON
    local = _load_local_schemes()
    scheme = local.get(scheme_id)
    if scheme:
        return _normalize_scheme(scheme)

    # If not found, return empty dict
    print(f"[scheme_loader] Scheme '{scheme_id}' not found in DB or local files")
    return {}
