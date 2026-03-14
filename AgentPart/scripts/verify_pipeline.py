"""
SahayAI Pipeline Verification — 3 Steps (file output)
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

out = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "verify_output.txt"), "w", encoding="utf-8")

def log(msg):
    print(msg)
    out.write(msg + "\n")
    out.flush()

log("=" * 60)
log("STEP 1 — Test Ollama is responding")
log("=" * 60)
try:
    from tools.llm_client import llm_chat
    result = llm_chat('You are helpful.', 'Say hello', json_mode=True)
    log(f"OLLAMA RESPONSE: {result[:200]}")
    step1 = "PASS"
except Exception as e:
    log(f"OLLAMA ERROR: {e}")
    step1 = "FAIL"
log(f"STEP 1: {step1}")

log("")
log("=" * 60)
log("STEP 2 — Test JSON parsing")
log("=" * 60)
try:
    from tools.llm_client import llm_generate_json
    result = llm_generate_json(
        'Output only valid JSON. No thinking. No explanation.',
        'Return this exact JSON: {"matched": true, "confidence": 85, "already_satisfied": ["income"], "needs_verification": [], "questions": [], "reason": "test"}'
    )
    log(f"TYPE: {type(result)}")
    log(f"RESULT: {result}")
    if isinstance(result, dict):
        log("STEP 2: PASS")
        step2 = "PASS"
    else:
        log("STEP 2: FAIL — not a dict")
        step2 = "FAIL"
except Exception as e:
    log(f"JSON PARSE ERROR: {e}")
    log("STEP 2: FAIL")
    step2 = "FAIL"

log("")
log("=" * 60)
log("STEP 3 — Test full /analyze endpoint")
log("=" * 60)
try:
    import requests
    response = requests.post(
        'http://localhost:5000/analyze',
        json={
            'name': 'Savita Devi',
            'age': 42,
            'income': 68000,
            'caste': 'obc',
            'state': 'Maharashtra',
            'occupation': 'farmer',
            'family_size': 4,
            'land_acres': 1.8
        },
        timeout=180
    )
    data = response.json()
    log(f"STATUS: {response.status_code}")
    log(f"CITIZEN ID: {data.get('citizen_id')}")
    log(f"SCHEME COUNT: {len(data.get('scheme_cards', []))}")
    cards = data.get('scheme_cards', [])
    if cards:
        log(f"TOP SCHEME: {cards[0].get('name')}")
    log(f"ERROR: {data.get('error')}")
    if cards:
        log("STEP 3: PASS — pipeline working")
        step3 = "PASS"
    else:
        log("STEP 3: FAIL — no scheme cards returned")
        step3 = "FAIL"
except Exception as e:
    log(f"ENDPOINT ERROR: {e}")
    log("STEP 3: FAIL")
    step3 = "FAIL"

log("")
log("=" * 60)
log(f"RESULTS: Step1={step1}  Step2={step2}  Step3={step3}")
log("=" * 60)
out.close()
