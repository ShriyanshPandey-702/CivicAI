"""
agents/discovery_rag_agent.py

Quality-focused discovery: returns 3-8 well-matched schemes rather than
10+ noisy ones. Applies confidence threshold, state filter, and
deterministic hard blocks.
"""
from tools.rag import search_schemes
import os
import glob
import json

# ─────────────────────────────────────────────────────────────────────────────
# POST-RAG DETERMINISTIC FILTER
# ─────────────────────────────────────────────────────────────────────────────

def _make_rules():
    """Build the filter rule table. Returns list of (name_substring, check_fn)."""
    rules = []

    # Sukanya Samriddhi Yojana — for girl children under 10 only
    def _ssy(p):
        gender = str(p.get("gender", "")).lower()
        if gender in ("male", "m"):
            return "scheme is for girl children only (gender: male)"
        age = p.get("age")
        youngest = p.get("youngest_child_age")
        if youngest is not None and youngest <= 10:
            return None
        if age is not None and age > 10:
            return f"citizen age {age} and no eligible child under 10"
        return None
    rules.append(("Sukanya Samriddhi", _ssy))

    # PM Ujjwala Yojana — women-only
    def _ujjwala(p):
        gender = str(p.get("gender", "")).lower()
        if gender in ("male", "m"):
            return f"scheme is for women beneficiaries only (gender: {gender})"
        return None
    rules.append(("Ujjwala", _ujjwala))

    # NSP Scholarships — students under 30
    def _nsp(p):
        occ = str(p.get("occupation", "")).lower()
        if occ and occ not in ("student", ""):
            return f"occupation '{occ}' is not 'student'"
        age = p.get("age")
        if age is not None and age > 30:
            return f"citizen age {age} exceeds scholarship age limit of 30"
        return None
    rules.append(("NSP", _nsp))
    rules.append(("National Scholarship", _nsp))

    # Post Matric Scholarship OBC — reserved categories, students, under 30
    def _pms_obc(p):
        caste = str(p.get("caste", "")).lower()
        occ = str(p.get("occupation", "")).lower()
        if occ and occ not in ("student", ""):
            return f"occupation '{occ}' is not 'student'"
        if caste and caste not in ("obc", "sc", "st", "ews", ""):
            return f"caste '{caste}' not in [obc, sc, st, ews]"
        age = p.get("age")
        if age is not None and age > 30:
            return f"citizen age {age} exceeds scholarship age limit of 30"
        return None
    rules.append(("Post Matric Scholarship", _pms_obc))

    # Atal Pension Yojana — 18–40 only, not students or daily_wage
    def _apy(p):
        age = p.get("age")
        occ = str(p.get("occupation", "")).lower()
        if occ == "student":
            return "Atal Pension Yojana is not applicable for students"
        if occ == "daily_wage":
            return "Atal Pension Yojana is lower priority for daily wage workers (use E-Shram instead)"
        if age is not None and (age < 18 or age > 40):
            return f"citizen age {age} is outside scheme range of 18-40"
        return None
    rules.append(("Atal Pension", _apy))

    # Antyodaya Anna Yojana — AAY ration cards only
    def _aay_ration(p):
        ration = str(p.get("ration_card_type", "")).lower()
        if ration and ration not in ("aay", "antyodaya", "none", ""):
            return f"ration card '{ration}' does not match AAY requirement"
        return None
    rules.append(("Antyodaya", _aay_ration))

    # PM-KISAN — farmers with land
    def _pmkisan(p):
        occ = str(p.get("occupation", "")).lower()
        land = p.get("land_acres")
        if occ and occ not in ("farmer", ""):
            return f"occupation '{occ}' is not 'farmer' (required for PM-KISAN)"
        if land is not None and float(land) == 0:
            return "land_acres is 0 — only land-owning farmers qualify"
        return None
    rules.append(("PM-KISAN", _pmkisan))
    rules.append(("PM Kisan", _pmkisan))

    # Pradhan Mantri Fasal Bima — farmers with land
    def _pmfby(p):
        occ = str(p.get("occupation", "")).lower()
        land = p.get("land_acres")
        if occ and occ not in ("farmer", ""):
            return f"occupation '{occ}' is not 'farmer' (required for PMFBY)"
        if land is not None and float(land) == 0:
            return "land_acres is 0 — only land-owning farmers qualify"
        return None
    rules.append(("Fasal Bima", _pmfby))
    rules.append(("Pradhan Mantri Fasal", _pmfby))

    return rules

_FILTER_RULES = _make_rules()


def _post_rag_filter(scheme_cards: list, profile: dict) -> list:
    """Remove schemes the citizen clearly cannot qualify for."""
    filtered = []
    for scheme in scheme_cards:
        name = scheme.get("name", "")
        removed = False
        for (name_substr, check_fn) in _FILTER_RULES:
            if name_substr.lower() in name.lower():
                try:
                    reason = check_fn(profile)
                except Exception:
                    reason = None
                if reason:
                    print(f"[filter] Removed '{name}' — {reason}")
                    removed = True
                    break
        if not removed:
            filtered.append(scheme)
    return filtered


# Occupation keyword expansion
OCCUPATION_KEYWORDS = {
    "farmer": [
        "farmer", "kisan", "agriculture", "fasal", "crop", "cultivat",
        "land", "irrigation", "agri", "rural", "krishi"
    ],
    "daily_wage": [
        "worker", "labour", "laborer", "shram", "shramik", "majdoor",
        "nirman", "construction", "unorganized", "informal", "bocw",
        "asangathit", "migrant", "daily wage", "wage earner",
        "building", "coolie", "mazdoor", "rozgar", "employment guarantee"
    ],
    "self_employed": [
        "self employed", "entrepreneur", "micro enterprise", "msme",
        "small business", "vendor", "artisan", "craftsman", "handloom",
        "weaver", "potter", "street vendor", "hawker", "mudra",
        "vyapar", "udyog", "udyami", "karigar"
    ],
    "student": [
        "student", "scholar", "education", "school", "college",
        "university", "academic", "study", "vidya", "shiksha",
        "fellowship", "merit", "talent", "youth", "yuva", "trainee"
    ],
    "unemployed": [
        "unemployed", "job seeker", "skill training", "vocational",
        "apprentice", "placement", "career", "rozgar", "berozgar",
        "livelihood", "employment", "internship", "youth"
    ],
}

# Gender keyword expansion
GENDER_KEYWORDS = {
    "female": [
        "women", "woman", "female", "mahila", "stree", "nari",
        "girl", "widow", "vidhwa", "maternity", "mother", "beti",
        "kishori", "sakhi", "swayamsiddha"
    ],
    "male": [
        "men", "male", "boy", "youth", "yuva", "kisan", "sainik"
    ],
}

# Caste keyword expansion
CASTE_KEYWORDS = {
    "sc":  ["scheduled caste", " sc ", "dalit", "harijan", "ambedkar"],
    "st":  ["scheduled tribe", " st ", "tribal", "adivasi", "vanvasi", "janjati"],
    "obc": ["other backward", " obc ", "backward class", "pichhda"],
    "ews": ["economically weaker", " ews ", "bpl", "below poverty"],
    "general": [],
}

# Marital status keyword expansion
MARITAL_KEYWORDS = {
    "widowed":  ["widow", "vidhwa", "bereaved", "deceased husband", "spouse death"],
    "married":  ["married", "spouse", "family", "household"],
    "single":   ["single", "unmarried", "bachelor"],
}

def calculate_confidence(scheme: dict, profile: dict) -> int:
    rules = scheme.get("eligibility_rules") or {}
    name_lower = scheme.get("name", "").lower()
    tags = [t.lower() for t in (scheme.get("tags") or [])]
    category = scheme.get("category", "").lower()
    elig_text = scheme.get("eligibility_text", "").lower()
    details = scheme.get("details", "").lower()
    benefit_desc = scheme.get("benefit_description", "").lower()
    combined_text = f"{name_lower} {' '.join(tags)} {category} {elig_text} {details} {benefit_desc}"

    similarity = float(scheme.get("similarity") or scheme.get("confidence", 0) or 0.5)
    base = int(similarity * 50)  # 0-50 base from RAG similarity

    bonus = 0
    occupation = profile.get("occupation", "").lower()
    gender = profile.get("gender", "").lower()
    caste = profile.get("caste", "").lower()
    marital = profile.get("marital_status", "").lower()
    income = profile.get("income", 0) or 0
    age = profile.get("age", 0) or 0
    state = profile.get("state", "").lower()
    ration = (profile.get("ration_card_type") or "").lower()
    has_disability = profile.get("has_disability", False)
    has_children = profile.get("has_children", False)

    # ── Occupation match (+20) ───────────────────────────────────────
    occ_keywords = OCCUPATION_KEYWORDS.get(occupation, [occupation])
    occ_hits = sum(1 for kw in occ_keywords if kw in combined_text)
    if occ_hits >= 3: bonus += 20
    elif occ_hits >= 1: bonus += 12

    # ── Category match (+15) ─────────────────────────────────────────
    CATEGORY_MAP = {
        "farmer":      ["agriculture", "rural", "environment"],
        "student":     ["education", "scholarship", "learning"],
        "daily_wage":  ["employment", "social_welfare", "labour", "skills"],
        "self_employed": ["business", "employment", "finance"],
        "unemployed":  ["employment", "skills", "social_welfare"],
    }
    expected_cats = CATEGORY_MAP.get(occupation, [])
    if any(ec in category for ec in expected_cats): bonus += 15

    # ── Gender match (+10) ───────────────────────────────────────────
    gender_kws = GENDER_KEYWORDS.get(gender, [])
    if any(kw in combined_text for kw in gender_kws): bonus += 10

    # ── Caste match (+8) ─────────────────────────────────────────────
    caste_kws = CASTE_KEYWORDS.get(caste, [])
    if caste_kws and any(kw in combined_text for kw in caste_kws): bonus += 8

    # ── Marital status match (+8) ────────────────────────────────────
    marital_kws = MARITAL_KEYWORDS.get(marital, [])
    if marital_kws and any(kw in combined_text for kw in marital_kws): bonus += 8

    # ── Income bracket match (+5) ────────────────────────────────────
    if income < 50000 and any(w in combined_text for w in ["bpl","below poverty","low income","poor","garib"]): bonus += 5
    if income < 120000 and "annual income" in combined_text: bonus += 3

    # ── Ration card match (+5) ───────────────────────────────────────
    if ration in ["aay","bpl"] and any(w in combined_text for w in ["ration","aay","antyodaya","bpl","food security"]): bonus += 5

    # ── Age bracket match (+5) ───────────────────────────────────────
    if age >= 60 and any(w in combined_text for w in ["senior","old age","elderly","pension","60 years"]): bonus += 5
    if 18 <= age <= 35 and any(w in combined_text for w in ["youth","young","yuva","18","student"]): bonus += 3

    # ── Disability match (+10) ───────────────────────────────────────
    if has_disability and any(w in combined_text for w in ["disability","divyang","viklang","specially-abled","handicap"]): bonus += 10

    # ── State match (+5) ─────────────────────────────────────────────
    if state and state in combined_text: bonus += 5

    # ── Children match (+5) ──────────────────────────────────────────
    if has_children and any(w in combined_text for w in ["child","children","beti","sukanya","girl","maternity"]): bonus += 5

    # ── Universal schemes get base boost ─────────────────────────────
    universal_keywords = ["all citizens", "any citizen", "indian national", "all indians", "jan dhan", "suraksha bima", "jeevan jyoti"]
    if any(kw in combined_text for kw in universal_keywords): bonus += 10

    total = min(base + bonus, 99)
    return total

def apply_profile_boosts(scheme: dict, profile: dict) -> int:
    """Apply targeted boosts for specific profile+scheme combinations."""
    confidence = scheme.get("confidence", 0)
    name = scheme.get("name","").lower()
    tags = " ".join(scheme.get("tags") or []).lower()
    cat = scheme.get("category","").lower()
    combined = name + " " + tags + " " + cat

    occ = profile.get("occupation","")
    gender = profile.get("gender","")
    marital = profile.get("marital_status","")
    ration = (profile.get("ration_card_type") or "").lower()
    income = profile.get("income", 0) or 0

    # Daily wage + social welfare schemes
    if occ == "daily_wage" and cat in ["social_welfare","employment","health"]:
        confidence = max(confidence, 70)

    # Widow + pension/welfare schemes
    if gender == "female" and marital == "widowed":
        if any(w in combined for w in ["pension","welfare","widow","vidhwa","social","women"]):
            confidence = max(confidence, 72)

    # BPL/AAY families + food/welfare schemes
    if ration in ["aay","bpl"]:
        if any(w in combined for w in ["food","ration","nutrition","antyodaya","bpl","welfare"]):
            confidence = max(confidence, 72)

    # Pregnant/maternity
    if gender == "female" and profile.get("age",0) <= 40:
        if any(w in combined for w in ["maternity","pregnancy","mother","maternal","vandana","pmmvy"]):
            confidence = max(confidence, 75)

    return confidence


def _state_filter(scheme_cards: list, profile: dict) -> list:
    """Remove state-specific schemes that don't match the citizen's state."""
    citizen_state = str(profile.get("state", "")).lower().strip()
    if not citizen_state:
        return scheme_cards  # Can't filter without a state

    filtered = []
    for s in scheme_cards:
        scheme_state = str(s.get("state") or s.get("eligibility_rules", {}).get("state", "") or "").lower().strip()
        scheme_level = str(s.get("level", "")).lower()
        scheme_name_lower = s.get("name", "").lower()
        
        # Always include Central/National schemes
        if scheme_level in ("central", "national", "") or not scheme_state:
            filtered.append(s)
        # Include if citizen's state matches
        elif citizen_state in scheme_state or scheme_state in citizen_state:
            filtered.append(s)
        else:
            print(f"[state-filter] Removed '{s.get('name','')}' -- state '{scheme_state}' != citizen state '{citizen_state}'")
    return filtered


# ─────────────────────────────────────────────────────────────────────────────
# MINIMUM CONFIDENCE THRESHOLD
# ─────────────────────────────────────────────────────────────────────────────
MIN_CONFIDENCE = 75
MAX_SCHEMES = 8


def run_discovery_rag_agent(state: dict) -> dict:
    if state.get("scheme_cards"):
        return state

    profile = state.get("citizen_profile", {})
    
    try:
        raw_results = search_schemes(profile, top_k=10)
    except Exception as e:
        print(f"[discovery] RAG search failed ({e}) -- using local schemes only")
        raw_results = []
    
    # Load all local scheme JSONs
    schemes_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "schemes")
    all_schemes = []
    try:
        for filepath in glob.glob(os.path.join(schemes_dir, "*.json")):
            with open(filepath, "r", encoding="utf-8") as f:
                all_schemes.append(json.load(f))
    except Exception as e:
        print(f"[debug discovery_rag] Error loading local schemes: {e}")

    # Merge PGVector results with local JSONs
    seen_ids = set()
    combined_schemes = []
    
    for scheme in raw_results:
        combined_schemes.append(scheme)
        if scheme.get("id"):
            seen_ids.add(scheme.get("id"))
        
    for scheme in all_schemes:
        scheme_id = scheme.get("id")
        if scheme_id and scheme_id not in seen_ids:
            combined_schemes.append(scheme)
            seen_ids.add(scheme_id)
            
    # Score all schemes
    scheme_cards = []
    
    use_rag = False  # Force to False since 600 schemes lack embeddings
    MIN_CONFIDENCE = 65
    
    for scheme in combined_schemes:
        confidence = calculate_confidence(scheme, profile)
        scheme["confidence"] = confidence
        confidence = apply_profile_boosts(scheme, profile)
        
        # ── ROOT CAUSE FIX 1: Raise minimum confidence to 75 ──
        if confidence >= MIN_CONFIDENCE:
            scheme_cards.append({
                "id": scheme.get("id", ""),
                "name": scheme.get("name", "Unknown"),
                "category": scheme.get("category", "General"),
                "benefit_amount": scheme.get("benefit_amount", 0),
                "benefit_description": scheme.get("benefit_description", ""),
                "confidence": confidence,
                "required_docs": scheme.get("required_docs", []),
                "portal_url": scheme.get("portal_url", ""),
                "eligibility_rules": scheme.get("eligibility_rules", {}),
                "state": scheme.get("state", ""),
                "level": scheme.get("level", "Central"),
                "eligibility_text": scheme.get("eligibility_text", ""),
            })

    # ── ROOT CAUSE FIX 4: State filter ──
    print(f"[debug discovery_rag] Before state filter: {len(scheme_cards)} schemes")
    scheme_cards = _state_filter(scheme_cards, profile)
    print(f"[debug discovery_rag] After state filter: {len(scheme_cards)} schemes")

    # Apply post-RAG deterministic filter
    print(f"[debug discovery_rag] profile.get('gender') -> {profile.get('gender')}")
    scheme_cards = _post_rag_filter(scheme_cards, profile)
    print(f"[debug discovery_rag] After post-RAG filter: {len(scheme_cards)} schemes")
    
    # ── PHASE 1 ELIGIBILITY: Run deterministic + hard block check ──
    from agents.deep_eligibility_agent import phase1_check
    
    eligible_cards = []
    for scheme in scheme_cards:
        try:
            is_eligible, reason = phase1_check(profile, scheme)
            if is_eligible:
                scheme["eligibility_confirmed"] = True
                scheme["eligibility_confidence"] = scheme.get("confidence", 75)
                scheme["eligibility_reasons"] = ["Verified via deterministic rules"]
                eligible_cards.append(scheme)
            else:
                print(f"[discovery] Filtered out (ineligible): {scheme.get('name')} — {reason}")
        except Exception as e:
            # On error, include scheme with default confidence
            print(f"[discovery] Error checking {scheme.get('name')}: {e}")
            scheme["eligibility_confirmed"] = True
            scheme["eligibility_confidence"] = 60
            eligible_cards.append(scheme)

    # Check bank account status for DBT schemes
    has_bank = profile.get("has_bank_account", True)
    if not has_bank:
        dbt_keywords = ["pm-kisan", "pm kisan", "ujjwala", "atal pension"]
        for scheme in eligible_cards:
            name_lower = scheme["name"].lower()
            if any(k in name_lower for k in dbt_keywords):
                scheme["warning_tag"] = "NO BANK ACCOUNT"
            
    # Sort by eligibility confidence descending
    eligible_cards.sort(key=lambda x: x.get("eligibility_confidence", 0), reverse=True)
    
    # ── ROOT CAUSE FIX 1: Cap results at MAX_SCHEMES ──
    state["scheme_cards"] = eligible_cards[:MAX_SCHEMES]
    state["current_step"] = "discovery_complete"
    
    print(f"[discovery] Final output: {len(state['scheme_cards'])} schemes")
    for s in state["scheme_cards"]:
        print(f"  -> {s.get('name')} (confidence: {s.get('confidence')}%)")
    
    return state
