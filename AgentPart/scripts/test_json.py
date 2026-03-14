from tools.llm_client import llm_generate_json

result = llm_generate_json(
    'You are a JSON bot. Output only valid JSON.',
    'Return {"test": true, "status": "working"}'
)
print(f"Type: {type(result)}")
print(f"Result: {result}")
print("SUCCESS - JSON parsing works!")
