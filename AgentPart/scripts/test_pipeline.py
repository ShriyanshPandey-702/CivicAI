"""
scripts/test_pipeline.py
"""
import json
import requests
import sys

BASE_URL = "http://localhost:5000"

def run_tests():
    print("=== SahayAI Agent Tests ===")
    print("Testing against local endpoints...")

    try:
        requests.get(f"{BASE_URL}/health")
    except requests.ConnectionError:
        print("ERROR: Flask app is not running. Please run `python main.py` first.")
        sys.exit(1)
        
    savita_data = {
        "name": "Savita Devi",
        "age": 42,
        "income": 68000,
        "caste": "obc",
        "state": "Maharashtra",
        "occupation": "farmer",
        "family_size": 4,
        "land_acres": 1.8
    }

    # Test 1 & 2: Profile & Discovery via /analyze Initial
    print("\n--- Test 1 & 2: Profile + Discovery (/analyze) ---")
    res1 = requests.post(f"{BASE_URL}/analyze", json=savita_data)
    if res1.status_code == 200:
        data1 = res1.json()
        citizen_id = data1.get("citizen_id")
        citizen_profile = data1.get("citizen_profile")
        scheme_cards = data1.get("scheme_cards")
        
        if citizen_id and citizen_profile and isinstance(scheme_cards, list) and len(scheme_cards) > 0:
            print("PASS: Profile Agent created citizen_id:", citizen_id)
            print("PASS: Discovery Agent found", len(scheme_cards), "schemes.")
            pm_kisan_card = next((s for s in scheme_cards if "PM-KISAN" in s["name"]), None)
            if pm_kisan_card:
                print("PASS: PM-KISAN found in results.")
            else:
                print("FAIL: PM-KISAN not found in top cards.")
        else:
            print("FAIL: Missing expected response fields in /analyze:", data1.keys())
    else:
        print("FAIL: /analyze returned status", res1.status_code)

    if not citizen_id:
        print("Cannot continue without citizen_id. Exiting.")
        return

    # To test Deep Eligibility, we must fetch a scheme ID.
    # We will fetch PM-KISAN scheme from the database explicitly if not in cards for tests.
    import os
    from supabase import create_client
    from dotenv import load_dotenv

    load_dotenv()
    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    )
    
    scheme_res = supabase.table("schemes").select("id").eq("name", "PM-KISAN").execute()
    scheme_id = scheme_res.data[0]["id"] if scheme_res.data else None

    # Test 3: Deep Eligibility Phase
    print("\n--- Test 3: Deep Eligibility Phase ---")
    if not scheme_id:
        print("FAIL: PM-KISAN scheme not found in db.")
    else:
        req_data = {
            "citizen_profile": citizen_profile,
            "citizen_id": citizen_id,
            "selected_scheme_id": scheme_id
        }
        res3 = requests.post(f"{BASE_URL}/analyze", json=req_data)
        if res3.status_code == 200:
            data3 = res3.json()
            elig = data3.get("eligibility_result", {})
            if "already_satisfied" in elig and "questions" in elig:
                print("PASS: Deep Eligibility returned", len(elig.get("questions", [])), "questions.")
            else:
                print("FAIL: Deep Eligibility missing expected fields:", elig)
        else:
            print("FAIL: Deep Eligibility returned status", res3.status_code)

    # Test 4: Vault check
    print("\n--- Test 4: Vault Agent Check ---")
    res4 = requests.post(f"{BASE_URL}/vault/check", json={
        "citizen_id": citizen_id,
        "scheme_id": scheme_id
    })
    
    if res4.status_code == 200:
        vault_res = res4.json()
        if "missing" in vault_res and len(vault_res["missing"]) > 0:
            print("PASS: Vault Agent identified missing docs:", vault_res["missing"])
        else:
            print("FAIL/WARNING: Vault Agent response unexpected:", vault_res)
    else:
        print("FAIL: /vault/check returned status", res4.status_code)
        
    # We won't test full /submit to avoid generating real PDFs & DB inserts every time the test script is run,
    # or we can test it and clean up. For now, passing 1-4 is solid.
    print("\n--- Summary ---")
    print("If all tests printed PASS, the LangGraph pipeline is cleanly wired and executing on Ollama.")

if __name__ == "__main__":
    run_tests()
