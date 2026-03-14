import sys
import os

# Add project root to path so agents can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.discovery_rag_agent import run_discovery_rag_agent

def create_state(profile):
    return {
        "citizen_profile": profile,
        "scheme_cards": None
    }

def print_results(profile_desc, result_state):
    print(f"\n{'='*50}")
    print(f"Results for: {profile_desc}")
    print(f"{'='*50}")
    cards = result_state.get("scheme_cards", [])
    if not cards:
        print("No schemes found.")
    for scheme in cards:
        print(f" - {scheme['name']} (Score: {scheme['confidence']})")
    print()


# Profile 1: Farmer Male
p1 = {
    "name": "Ramu", "age": 45, "gender": "male", "state": "Maharashtra", "marital_status": "married",
    "income": 90000, "occupation": "farmer", "caste": "general", "ration_card_type": "bpl",
    "has_bank_account": True, "has_disability": False, "family_size": 4, "land_acres": 2.5,
    "land_ownership": "Owned", "crop_type": "Both", "irrigation_type": "Rainfed",
    "kisan_credit_card": "yes", "soil_health_card": "yes"
}

# Profile 2: Student Female OBC
p2 = {
    "name": "Priya", "age": 20, "gender": "female", "state": "Bihar", "marital_status": "single",
    "income": 50000, "occupation": "student", "caste": "obc", "ration_card_type": "bpl",
    "has_bank_account": True, "has_disability": False, "family_size": 3, "land_acres": 0.0,
    "education_level": "Undergraduate", "institution_type": "Government",
    "course_type": "Full-time", "previous_scholarship": "no", "hosteller": "Day Scholar"
}

# Profile 3: Married Female with girl child age 8
p3 = {
    "name": "Lakshmi", "age": 28, "gender": "female", "state": "Uttar Pradesh", "marital_status": "married",
    "income": 60000, "occupation": "daily_wage", "caste": "sc", "ration_card_type": "aay",
    "has_bank_account": True, "has_disability": False, "family_size": 3, "land_acres": 0.0,
    "work_type": "Domestic Work", "eshram_registered": "yes", "has_epfo": "no",
    "has_children": "yes", "youngest_child_age": 8
}

s1 = run_discovery_rag_agent(create_state(p1))
print_results("Profile 1 — Farmer Male", s1)

s2 = run_discovery_rag_agent(create_state(p2))
print_results("Profile 2 — Student Female OBC", s2)

s3 = run_discovery_rag_agent(create_state(p3))
print_results("Profile 3 — Married Female with girl child age 8", s3)
