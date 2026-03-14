import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)

profile = {
    "name": "Test User",
    "age": 30,
    "income": 50000,
    "caste": "general",
    "state": "Maharashtra",
    "occupation": "other",
    "family_size": 2,
    "land_acres": 0.0,
    "preferred_language": "English"
}

print("Attempting insert...")
try:
    result = supabase.table("citizen_profiles").insert(profile).execute()
    print(f"Result type: {type(result)}")
    print(f"Result attributes: {dir(result)}")
    print(f"Result data: {result.data}")
    if result.data:
        print(f"First row: {result.data[0]}")
        print(f"ID: {result.data[0].get('id')}")
    else:
        print("Data is empty!")
except Exception as e:
    print(f"Error: {e}")
