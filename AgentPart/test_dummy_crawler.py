import asyncio
import json

from tools.dummy_crawler import run_dummy_crawler

async def main():
    profile = {
        "name": "Savita",
        "age": 42,
        "gender": "Female",
        "income": 68000,
        "state": "Maharashtra",
        "district": "Nashik",
        "caste": "OBC",
        "occupation": "Farmer",
        "land_owned": "1.8 acres",
        "bank_account": "Yes",
        "aadhaar": "XXXX XXXX XXXX"
    }
    
    print("Testing Dummy Crawler. Please ensure main.py is running on port 5000...")
    result = await run_dummy_crawler(profile, "pm_kisan")
    print("\nResult:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
