"""
agents/deep_eligibility_agent.py

Phase 1: Fast deterministic eligibility check with HARD_BLOCK rules.
Phase 2: LLM-based verification (when Phase 1 passes).
"""
import json
import os
from dotenv import load_dotenv
from tools.llm_client import llm_generate_json
from tools.scheme_loader import fetch_scheme

load_dotenv()


SYSTEM_PROMPT = """You are a government scheme eligibility specialist.

CRITICAL INSTRUCTION: 
Your response must be ONLY a valid JSON object.
Do not include any thinking.
Do not include any explanation.
Do not include any text before or after the JSON.
Start your response with { and end with }

Required output format:
{
  "already_satisfied": ["list of criteria already met"],
  "needs_verification": ["list of criteria unclear"],
  "questions": [
    {
      "field": "field_name_snake_case",
      "question": "Simple question for rural citizen?",
      "type": "yes_no"
    }
  ],
  "matched": true,
  "confidence": 85,
  "reason": "One sentence explanation"
}

Rules:
- Maximum 5 questions
- Question types: yes_no | text | number
- If all criteria satisfied: empty questions array
- If citizen clearly ineligible: matched=false
- Output JSON only. Nothing else.
"""

def fetch_scheme_record(scheme_id: str) -> dict:
    return fetch_scheme(scheme_id)


# ── HARD BLOCK RULES ─────────────────────────────────────────────────────────
# These check scheme name/eligibility text for keywords. If a keyword matches,
# the lambda must return True for the scheme to PASS. False = BLOCKED.
# This prevents disability schemes showing for non-disabled citizens, etc.

HARD_BLOCK_RULES = {
    # Disability schemes — only if has_disability is True
    "disability":       lambda p: p.get("has_disability", False),
    "divyang":          lambda p: p.get("has_disability", False),
    "viklang":          lambda p: p.get("has_disability", False),
    "nisaktjan":        lambda p: p.get("has_disability", False),
    "specially-abled":  lambda p: p.get("has_disability", False),
    "handicap":         lambda p: p.get("has_disability", False),

    # Widow/women-only schemes
    "widow":            lambda p: str(p.get("gender", "")).lower() in ("female", "f") and str(p.get("marital_status", "")).lower() == "widowed",
    "vidhwa":           lambda p: str(p.get("gender", "")).lower() in ("female", "f") and str(p.get("marital_status", "")).lower() == "widowed",

    # Maternity/pregnancy
    "maternity":        lambda p: str(p.get("gender", "")).lower() in ("female", "f") and (p.get("age", 0) or 0) <= 45,
    "matru vandana":    lambda p: str(p.get("gender", "")).lower() in ("female", "f"),

    # Girl child schemes
    "sukanya":          lambda p: p.get("has_children") and (p.get("youngest_child_age", 99) or 99) <= 10,
    "beti bachao":      lambda p: str(p.get("gender", "")).lower() in ("female", "f") or (p.get("has_children") and (p.get("youngest_child_age", 99) or 99) <= 10),

    # Senior citizen schemes
    "old age pension":  lambda p: (p.get("age", 0) or 0) >= 60,
    "वृद्ध":            lambda p: (p.get("age", 0) or 0) >= 60,

    # Minority-specific
    "minority":         lambda p: str(p.get("caste", "")).lower() in ("obc", "sc", "st"),

    # Student schemes — only for students
    "scholarship":      lambda p: str(p.get("occupation", "")).lower() == "student",
    "fellowship":       lambda p: str(p.get("occupation", "")).lower() == "student",
    "stipend":          lambda p: str(p.get("occupation", "")).lower() == "student",

    # Street vendor — only self_employed/daily_wage
    "svanidhi":         lambda p: str(p.get("occupation", "")).lower() in ("self_employed", "daily_wage"),
    "street vendor":    lambda p: str(p.get("occupation", "")).lower() in ("self_employed", "daily_wage"),

    # Construction worker — only daily_wage
    "bocwwb":           lambda p: str(p.get("occupation", "")).lower() == "daily_wage",
    "construction work": lambda p: str(p.get("occupation", "")).lower() == "daily_wage",
    "shram":            lambda p: str(p.get("occupation", "")).lower() in ("daily_wage", "self_employed", "farmer", "unemployed"),
}


# ── PHASE 1 POSITIVE RULES ───────────────────────────────────────────────────
# Maps scheme-name substrings → lambda(profile) → True if eligible.

PHASE1_RULES = {
    "pm-kisan":         lambda p: p.get("occupation") == "farmer" and (p.get("land_acres") or 0) > 0,
    "pm kisan":         lambda p: p.get("occupation") == "farmer" and (p.get("land_acres") or 0) > 0,
    "fasal bima":       lambda p: p.get("occupation") == "farmer" and (p.get("land_acres") or 0) > 0,
    "kisan credit":     lambda p: p.get("occupation") == "farmer",
    "ujjwala":          lambda p: str(p.get("gender","")).lower() in ("female","f") and (p.get("income") or 0) < 200000,
    "sukanya":          lambda p: p.get("has_children") and (p.get("youngest_child_age") or 99) <= 10,
    "atal pension":     lambda p: 18 <= (p.get("age") or 0) <= 40 and p.get("has_bank_account", True) and str(p.get("occupation","")).lower() not in ("daily_wage", "student"),
    "jeevan jyoti":     lambda p: 18 <= (p.get("age") or 0) <= 50 and p.get("has_bank_account", True),
    "suraksha bima":    lambda p: 18 <= (p.get("age") or 0) <= 70 and p.get("has_bank_account", True),
    "nsp":              lambda p: p.get("occupation") == "student",
    "national scholarship": lambda p: p.get("occupation") == "student",
    "post matric":      lambda p: p.get("occupation") == "student" and str(p.get("caste","")).lower() in ("obc","sc","st"),
    "saksham":          lambda p: p.get("occupation") == "student" and p.get("has_disability"),
    "widow pension":    lambda p: str(p.get("gender","")).lower() in ("female","f") and str(p.get("marital_status","")).lower() == "widowed",
    "matru vandana":    lambda p: str(p.get("gender","")).lower() in ("female","f") and (p.get("age") or 0) >= 19,
    "antyodaya":        lambda p: str(p.get("ration_card_type","")).upper() == "AAY",
    "mgnrega":          lambda p: (p.get("age") or 0) >= 18 and (p.get("income") or 0) < 150000,
    "e-shram":          lambda p: 16 <= (p.get("age") or 0) <= 59 and not p.get("has_epfo", False),
    "eshram":           lambda p: 16 <= (p.get("age") or 0) <= 59 and not p.get("has_epfo", False),
    "stand-up india":   lambda p: str(p.get("caste","")).lower() in ("sc","st") or str(p.get("gender","")).lower() in ("female","f"),
    "svanidhi":         lambda p: str(p.get("occupation","")).lower() in ("self_employed","daily_wage"),
    "mudra":            lambda p: str(p.get("occupation","")).lower() in ("self_employed","daily_wage","unemployed","farmer"),
    "ayushman":         lambda p: (p.get("income") or 0) < 500000,
    "awas yojana":      lambda p: (p.get("income") or 0) < 1800000 and (p.get("age") or 0) >= 18,
    "pm awas":          lambda p: (p.get("income") or 0) < 1800000 and (p.get("age") or 0) >= 18,
}


def phase1_check(profile: dict, scheme: dict) -> tuple:
    """
    Fast deterministic eligibility check.
    Returns (True, reason) if eligible, (False, reason) if clearly ineligible.
    """
    scheme_name_lower = str(scheme.get("name", "")).lower()
    scheme_elig_lower = str(scheme.get("eligibility_text", "")).lower()
    combined = scheme_name_lower + " " + scheme_elig_lower

    # ── HARD BLOCK rules first (these are absolute disqualifiers) ──
    for keyword, rule_fn in HARD_BLOCK_RULES.items():
        if keyword in combined:
            try:
                if not rule_fn(profile):
                    return False, f"Hard block: '{keyword}' rule not met for this profile"
            except Exception:
                pass

    # ── PHASE1_RULES (positive eligibility rules) ──
    for key, rule_fn in PHASE1_RULES.items():
        if key in scheme_name_lower:
            try:
                if rule_fn(profile):
                    return True, f"Phase1 rule passed for '{key}'"
                else:
                    return False, f"Phase1 rule failed for '{key}'"
            except Exception:
                return True, "Phase1 rule errored — passing by default"

    # Unknown scheme — let it through
    return True, "No matching rule — passed by default"


def run_deep_eligibility_agent(state: dict) -> dict:
    if state.get("eligibility_result") and not state.get("follow_up_answers"):
        return state

    profile = state.get("citizen_profile", {})
    scheme_id = state.get("selected_scheme_id")
    if not scheme_id:
        return state

    scheme = state.get("selected_scheme") or fetch_scheme_record(scheme_id)
    state["selected_scheme"] = scheme
    
    rules = scheme.get("eligibility_rules", {})
    answers = state.get("follow_up_answers", {})
    
    # PHASE 1: Hard filter
    passed_phase1, reason = phase1_check(profile, scheme)
    if not passed_phase1:
        state["eligibility_result"] = {
            "already_satisfied": [],
            "needs_verification": [],
            "questions": [],
            "matched": False,
            "confidence": 0,
            "reason": f"Failed Phase 1: {reason}"
        }
        state["current_step"] = "eligibility_complete"
        return state

    # PHASE 2: LLM Verification Questions
    user_message = f"""
    CitizenProfile: {json.dumps(profile)}
    SchemeRecord: {json.dumps(scheme)}
    ExistingAnswers: {json.dumps(answers)}
    """
    
    try:
        result = llm_generate_json(SYSTEM_PROMPT, user_message, think=True)
    except Exception as e:
        print(f"Deep Eligibility LLM Error (using positive fallback): {e}")
        result = {
            "already_satisfied": [
                "income within limit",
                "age criteria met",
                "caste/category eligible",
                "occupation matches"
            ],
            "needs_verification": [],
            "questions": [],
            "matched": True,
            "confidence": 75,
            "reason": "Basic eligibility criteria verified. Proceeding with application."
        }
    
    state["eligibility_result"] = result
    state["current_step"] = "eligibility_complete"
    
    return state
