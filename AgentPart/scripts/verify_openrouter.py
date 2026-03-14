from tools.llm_client import llm_chat, llm_generate_json

print("="*30)
print("TEST 1: llm_chat")
try:
    r = llm_chat("You are helpful.", "Reply with exactly: OPENROUTER_WORKING")
    print(f"RESPONSE: {r}")
except Exception as e:
    print(f"LLM ERROR (expected if 429): {e}")

print("\n" + "="*30)
print("TEST 2: llm_generate_json")
try:
    r = llm_generate_json("JSON API", "Return {\"success\": true}")
    print(f"TYPE: {type(r)}")
    print(f"RESULT: {r}")
except Exception as e:
    print(f"JSON ERROR (expected if 429): {e}")
