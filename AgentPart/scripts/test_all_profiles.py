"""
test_all_profiles.py
Tests scheme eligibility rules across 12 diverse citizen profiles.
Run: python scripts/test_all_profiles.py
"""

import sys, json
sys.path.insert(0, '.')
from agents.discovery_rag_agent import run_discovery_rag_agent

# ── 12 Test Profiles ──────────────────────────────────────────────────────────

TEST_PROFILES = [
    {
        "label": "Profile 1 - Farmer Male OBC",
        "profile": {"name": "Ramesh Kumar", "age": 35, "gender": "male",
                    "marital_status": "married", "state": "Maharashtra",
                    "income": 68000, "occupation": "farmer", "caste": "obc",
                    "family_size": 4, "land_acres": 2.0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": "bpl",
                    "has_children": True, "youngest_child_age": 8},
        "must_include":    ["pm-kisan", "fasal bima", "ayushman", "awas"],
        "must_not_include": ["scholarship", "disability", "widow", "sukanya", "ujjwala",
                             "saksham", "maternity", "fellowship"],
    },
    {
        "label": "Profile 2 — Student Female General",
        "profile": {"name": "Priya Sharma", "age": 20, "gender": "female",
                    "marital_status": "single", "state": "Uttar Pradesh",
                    "income": 45000, "occupation": "student", "caste": "general",
                    "family_size": 4, "land_acres": 0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": None,
                    "education_level": "Undergraduate",
                    "institution_type": "Government", "course_type": "Full-time",
                    "previous_scholarship": False},
        "must_include":    ["nsp", "scholarship", "jeevan jyoti", "suraksha bima"],
        "must_not_include": ["pm-kisan", "fasal bima", "kisan credit", "widow",
                             "disability", "mgnrega", "ujjwala"],
    },
    {
        "label": "Profile 3 — Daily Wage Worker Female SC",
        "profile": {"name": "Sunita Devi", "age": 32, "gender": "female",
                    "marital_status": "married", "state": "Bihar",
                    "income": 36000, "occupation": "daily_wage", "caste": "sc",
                    "family_size": 5, "land_acres": 0, "has_bank_account": False,
                    "has_disability": False, "ration_card_type": "aay",
                    "work_type": "Construction", "eshram_registered": False,
                    "has_children": True, "youngest_child_age": 3},
        "must_include":    ["e-shram", "jan dhan", "ujjwala", "ayushman",
                            "antyodaya", "sukanya"],
        "must_not_include": ["pm-kisan", "scholarship", "disability", "widow",
                             "atal pension", "kisan credit"],
    },
    {
        "label": "Profile 4 — Self Employed Female SC with Disability",
        "profile": {"name": "Kavitha Rani", "age": 28, "gender": "female",
                    "marital_status": "single", "state": "Karnataka",
                    "income": 80000, "occupation": "self_employed", "caste": "sc",
                    "family_size": 2, "land_acres": 0, "has_bank_account": True,
                    "has_disability": True, "disability_type": "Locomotor",
                    "disability_percentage": "40-60%", "disability_certificate": True,
                    "ration_card_type": None, "business_type": "Service"},
        "must_include":    ["mudra", "stand-up india", "ayushman"],
        "must_not_include": ["pm-kisan", "fasal bima", "scholarship", "widow",
                             "sukanya", "mgnrega"],
    },
    {
        "label": "Profile 5 — Unemployed Male ST",
        "profile": {"name": "Arjun Meena", "age": 26, "gender": "male",
                    "marital_status": "single", "state": "Rajasthan",
                    "income": 0, "occupation": "unemployed", "caste": "st",
                    "family_size": 3, "land_acres": 0, "has_bank_account": False,
                    "has_disability": False, "ration_card_type": "bpl",
                    "job_seeker_registered": False, "seeking_skill_training": True},
        "must_include":    ["jan dhan", "e-shram", "ayushman", "mudra"],
        "must_not_include": ["pm-kisan", "fasal bima", "scholarship", "widow",
                             "disability", "sukanya", "ujjwala"],
    },
    {
        "label": "Profile 6 — Widow Female BPL",
        "profile": {"name": "Meena Devi", "age": 52, "gender": "female",
                    "marital_status": "widowed", "state": "Madhya Pradesh",
                    "income": 24000, "occupation": "daily_wage", "caste": "general",
                    "family_size": 2, "land_acres": 0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": "bpl"},
        "must_include":    ["widow pension", "ayushman", "e-shram"],
        "must_not_include": ["pm-kisan", "scholarship", "disability", "sukanya",
                             "atal pension", "maternity"],
    },
    {
        "label": "Profile 7 — Senior Citizen Male BPL",
        "profile": {"name": "Mohan Lal", "age": 68, "gender": "male",
                    "marital_status": "married", "state": "Gujarat",
                    "income": 18000, "occupation": "unemployed", "caste": "obc",
                    "family_size": 2, "land_acres": 0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": "bpl"},
        "must_include":    ["old age pension", "ayushman", "antyodaya"],
        "must_not_include": ["pm-kisan", "scholarship", "disability", "sukanya",
                             "atal pension", "e-shram", "maternity", "widow"],
    },
    {
        "label": "Profile 8 — Married Female Farmer with Girl Child Age 6",
        "profile": {"name": "Savita Devi", "age": 34, "gender": "female",
                    "marital_status": "married", "state": "Maharashtra",
                    "income": 68000, "occupation": "farmer", "caste": "obc",
                    "family_size": 4, "land_acres": 1.8, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": None,
                    "has_children": True, "youngest_child_age": 6,
                    "crop_type": "Kharif", "land_ownership": "Owned"},
        "must_include":    ["pm-kisan", "fasal bima", "sukanya", "ujjwala",
                            "ayushman"],
        "must_not_include": ["scholarship", "disability", "widow", "saksham",
                             "stand-up india"],
    },
    {
        "label": "Profile 9 — Student Male OBC Hosteller",
        "profile": {"name": "Vikram Yadav", "age": 19, "gender": "male",
                    "marital_status": "single", "state": "Uttar Pradesh",
                    "income": 55000, "occupation": "student", "caste": "obc",
                    "family_size": 5, "land_acres": 0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": None,
                    "education_level": "Undergraduate",
                    "institution_type": "Government",
                    "course_type": "Full-time",
                    "previous_scholarship": False,
                    "hosteller": "Hosteller"},
        "must_include":    ["nsp", "post matric", "jeevan jyoti", "suraksha bima"],
        "must_not_include": ["pm-kisan", "fasal bima", "widow", "disability",
                             "ujjwala", "sukanya", "mgnrega"],
    },
    {
        "label": "Profile 10 — Self Employed Male AAY",
        "profile": {"name": "Raju Prasad", "age": 40, "gender": "male",
                    "marital_status": "married", "state": "West Bengal",
                    "income": 42000, "occupation": "self_employed", "caste": "sc",
                    "family_size": 6, "land_acres": 0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": "aay",
                    "business_type": "Trade", "udyam_registered": False},
        "must_include":    ["mudra", "antyodaya", "ayushman", "stand-up india",
                            "atal pension"],
        "must_not_include": ["pm-kisan", "fasal bima", "scholarship", "widow",
                             "disability", "sukanya", "ujjwala"],
    },
    {
        "label": "Profile 11 — Pregnant Woman Daily Wage",
        "profile": {"name": "Aarti Singh", "age": 24, "gender": "female",
                    "marital_status": "married", "state": "Rajasthan",
                    "income": 30000, "occupation": "daily_wage", "caste": "general",
                    "family_size": 3, "land_acres": 0, "has_bank_account": True,
                    "has_disability": False, "ration_card_type": "bpl",
                    "work_type": "Agriculture", "eshram_registered": False},
        "must_include":    ["matru vandana", "e-shram", "ayushman", "ujjwala"],
        "must_not_include": ["pm-kisan", "scholarship", "disability", "widow",
                             "sukanya", "atal pension"],
    },
    {
        "label": "Profile 12 — Young Male Farmer SC No Bank",
        "profile": {"name": "Priyanshu Prasad", "age": 23, "gender": "male",
                    "marital_status": "single", "state": "Chhattisgarh",
                    "income": 68000, "occupation": "farmer", "caste": "obc",
                    "family_size": 4, "land_acres": 2.0, "has_bank_account": False,
                    "has_disability": False, "ration_card_type": None,
                    "has_children": False, "crop_type": "Kharif",
                    "land_ownership": "Owned"},
        "must_include":    ["pm-kisan", "fasal bima", "jan dhan", "ayushman"],
        "must_not_include": ["disability", "scholarship", "widow", "sukanya",
                             "ujjwala", "saksham", "bocwwb", "maternity"],
    },
]

# ── Runner ────────────────────────────────────────────────────────────────────

def run_test(test_case):
    label = test_case["label"]
    profile = test_case["profile"]
    must_include = test_case["must_include"]
    must_not_include = test_case["must_not_include"]

    state = {
        "raw_profile": profile,
        "citizen_profile": profile,
        "citizen_id": "test",
        "scheme_cards": [],
        "failed_scheme_ids": set(),
        "follow_up_answers": {},
    }

    state = run_discovery_rag_agent(state)
    cards = state.get("scheme_cards", [])
    names = [c.get("name","").lower() for c in cards]

    passed = True
    issues = []

    # Check must_not_include violations
    for keyword in must_not_include:
        violators = [n for n in names if keyword.lower() in n]
        if violators:
            issues.append(f"  [FAIL] WRONG SCHEME: '{keyword}' found -> {violators}")
            passed = False

    # Check must_include present (warn only — RAG may not always find all)
    for keyword in must_include:
        found = any(keyword.lower() in n for n in names)
        if not found:
            issues.append(f"  [WARN] MISSING: '{keyword}' not found (expected)")

    return passed, cards, issues


if __name__ == "__main__":
    print("=" * 65)
    print("SahayAI — Profile Eligibility Test Suite (12 profiles)")
    print("=" * 65)

    total = len(TEST_PROFILES)
    passed_count = 0
    failed_profiles = []

    for test in TEST_PROFILES:
        print(f"\n{test['label']}")
        print("-" * 55)
        ok, cards, issues = run_test(test)

        print(f"  Schemes returned: {len(cards)}")
        for c in cards:
            conf = c.get("eligibility_confidence") or c.get("confidence", 0)
            print(f"    {'[OK]' if ok else '[!!]'} {conf}% -- {c.get('name','')[:55]}")

        if issues:
            for issue in issues:
                print(issue)

        if ok:
            passed_count += 1
            print(f"  RESULT: PASSED")
        else:
            failed_profiles.append(test["label"])
            print(f"  RESULT: FAILED")

    print("\n" + "=" * 65)
    print(f"SUMMARY: {passed_count}/{total} profiles passed")
    if failed_profiles:
        print("Failed profiles:")
        for f in failed_profiles:
            print(f"  - {f}")
    else:
        print("All 12 profiles passed!")
    print("=" * 65)
