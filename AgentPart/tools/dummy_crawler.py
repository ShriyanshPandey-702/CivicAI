import asyncio
import uuid
import datetime
from playwright.async_api import async_playwright

async def run_dummy_crawler(citizen_profile: dict, scheme_id: str) -> dict:
    """
    Automates the dummy portal form filling with playwright.
    """
    # Use local loopback url pointing to the static files mounted on main.py
    portal_url = "http://localhost:5000/static/dummy_portal.html"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # Navigate to dummy portal
            await page.goto(portal_url)

            # Map the input locators and fill data
            await page.fill('input[name="full_name"]', str(citizen_profile.get("name", "")))
            await page.fill('input[name="age"]', str(citizen_profile.get("age", "")))
            
            # Select gender
            gender = str(citizen_profile.get("gender", ""))
            if gender.lower() in ("male", "female", "other"):
                await page.select_option('select[name="gender"]', value=gender.capitalize())
            else:
                await page.select_option('select[name="gender"]', value="Other")
                
            # Select state (use capitalized form, e.g. "Maharashtra")
            state_val = str(citizen_profile.get("state", ""))
            try:
                await page.select_option('select[name="state"]', label=state_val)
            except Exception:
                pass  # Ignore if state isn't in dropdown

            await page.fill('input[name="district"]', str(citizen_profile.get("district", "")))
            await page.fill('input[name="caste"]', str(citizen_profile.get("caste", "")))
            await page.fill('input[name="occupation"]', str(citizen_profile.get("occupation", "")))
            await page.fill('input[name="income"]', str(citizen_profile.get("income", "")))
            await page.fill('input[name="land_owned"]', str(citizen_profile.get("land_owned", citizen_profile.get("land_acres", ""))))

            bank_status = "Yes" if citizen_profile.get("has_bank_account", citizen_profile.get("bank_account", "") in ("Yes", True)) else "No"
            await page.select_option('select[name="bank_account"]', value=bank_status)
            
            await page.fill('input[name="aadhaar"]', str(citizen_profile.get("aadhaar", "XXXX XXXX XXXX")))

            # Submission delay for realism
            await asyncio.sleep(1)

            # Click submit button
            await page.click('button[type="submit"]')

            # Wait for success message
            success_locator = page.locator('#success-message')
            await success_locator.wait_for(state='visible', timeout=5000)

            message_text = await success_locator.inner_text()
            
            # Extract reference ID if present in text
            reference_id = None
            if "Reference ID:" in message_text:
                reference_id = message_text.split("Reference ID:")[1].strip()
            
            if not reference_id:
                reference_id = f"DEMO{uuid.uuid4().hex[:6].upper()}"

            return {
                "status": "submitted",
                "reference_id": reference_id,
                "message": message_text,
                "timestamp": datetime.datetime.now().isoformat()
            }

        except Exception as e:
            print(f"[run_dummy_crawler] Error during crawl: {e}")
            return {
                "status": "failed",
                "message": f"Error running the dummy crawler: {str(e)}",
            }
        finally:
            await browser.close()
