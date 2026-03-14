"""
agents/autofill_agent.py
Playwright-based agent that navigates to a government scheme portal,
detects form fields, maps citizen profile data, and fills the form.
"""

import time
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

from tools.form_field_mapper import map_fields_to_profile

# ─── Config ──────────────────────────────────────────────────────────────────
SCREENSHOTS_DIR = Path(__file__).parent.parent / "data" / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

CAPTCHA_INDICATORS = [
    "captcha", "recaptcha", "hcaptcha", "verify you are human",
    "otp", "one time password", "mobile verification", "send otp",
    "enter the text shown", "security code", "verification code",
]

# ─── Field Detection ─────────────────────────────────────────────────────────
DETECT_FIELDS_JS = """
() => {
    const fields = [];
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach((el, idx) => {
        // Skip hidden/submit/button inputs
        const type = (el.getAttribute('type') || '').toLowerCase();
        if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(type)) return;
        if (el.offsetParent === null && type !== 'checkbox' && type !== 'radio') return;
        
        // Try to find a label
        let label = '';
        
        // 1. Check for associated <label>
        const id = el.id;
        if (id) {
            const labelEl = document.querySelector(`label[for="${id}"]`);
            if (labelEl) label = labelEl.innerText.trim();
        }
        
        // 2. Check placeholder
        if (!label) label = el.getAttribute('placeholder') || '';
        
        // 3. Check aria-label
        if (!label) label = el.getAttribute('aria-label') || '';
        
        // 4. Check name attribute
        if (!label) label = el.getAttribute('name') || '';
        
        // 5. Check title
        if (!label) label = el.getAttribute('title') || '';
        
        // 6. Parent label wrapping the input
        if (!label) {
            const parent = el.closest('label');
            if (parent) {
                label = parent.innerText.replace(el.value || '', '').trim();
            }
        }
        
        // 7. Previous sibling text
        if (!label) {
            const prev = el.previousElementSibling;
            if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'TD')) {
                label = prev.innerText.trim();
            }
        }
        
        if (!label) return;  // can't identify this field
        
        // Build a unique CSS selector
        let selector = '';
        if (id) {
            selector = `#${CSS.escape(id)}`;
        } else if (el.name) {
            selector = `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
        } else {
            selector = `${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`;
        }
        
        fields.push({
            selector: selector,
            label: label.substring(0, 100),
            tag: el.tagName.toLowerCase(),
            type: type || el.tagName.toLowerCase(),
        });
    });
    
    return fields;
}
"""


async def run_autofill_agent(
    profile: dict,
    portal_url: str,
    citizen_id: str,
    scheme_id: str,
) -> dict:
    """
    Main entry point. Launches Playwright, navigates to portal_url,
    detects form fields, fills them with profile data, takes a screenshot.
    Returns a result dict for the API response.
    """
    screenshot_filename = f"{citizen_id}_{scheme_id}_{int(time.time())}.png"
    screenshot_path = SCREENSHOTS_DIR / screenshot_filename
    screenshot_url = f"/api/screenshots/{screenshot_filename}"

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
            ],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            locale="en-IN",
        )
        page = await context.new_page()

        # Remove webdriver detection flag
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        # ── Step 1: Navigate to portal ────────────────────────────────────
        try:
            await page.goto(portal_url, wait_until="domcontentloaded", timeout=30000)
        except PlaywrightTimeoutError:
            await browser.close()
            return {
                "success": False,
                "error": "Portal timed out after 30 seconds. The government site may be down.",
                "screenshot_url": None,
                "fields_filled": [],
                "fields_skipped": [],
                "portal_url": portal_url,
                "manual_url": portal_url,
            }
        except Exception as e:
            await browser.close()
            return {
                "success": False,
                "error": f"Failed to open portal: {str(e)}",
                "screenshot_url": None,
                "fields_filled": [],
                "fields_skipped": [],
                "portal_url": portal_url,
                "manual_url": portal_url,
            }

        # Give the page a moment to finish rendering JS
        await page.wait_for_timeout(2000)

        # ── Step 2: CAPTCHA / OTP detection ───────────────────────────────
        try:
            page_text = (await page.inner_text("body")).lower()
        except Exception:
            page_text = ""

        captcha_detected = any(ind in page_text for ind in CAPTCHA_INDICATORS)

        if captcha_detected:
            await page.screenshot(path=str(screenshot_path), full_page=False)
            await browser.close()
            return {
                "success": False,
                "error": "CAPTCHA or OTP detected. Please complete this step manually.",
                "captcha_detected": True,
                "screenshot_url": screenshot_url,
                "manual_url": portal_url,
                "fields_filled": [],
                "fields_skipped": [],
                "portal_url": portal_url,
            }

        # ── Step 3: Detect form fields ────────────────────────────────────
        try:
            detected_fields = await page.evaluate(DETECT_FIELDS_JS)
        except Exception as e:
            # Could not detect fields — take a screenshot anyway
            await page.screenshot(path=str(screenshot_path), full_page=False)
            await browser.close()
            return {
                "success": False,
                "error": f"Could not detect form fields: {str(e)}",
                "screenshot_url": screenshot_url,
                "fields_filled": [],
                "fields_skipped": [],
                "portal_url": portal_url,
                "manual_url": portal_url,
            }

        if not detected_fields:
            await page.screenshot(path=str(screenshot_path), full_page=False)
            await browser.close()
            return {
                "success": False,
                "error": "No fillable form fields detected on this page. The portal may require login first.",
                "screenshot_url": screenshot_url,
                "fields_filled": [],
                "fields_skipped": [],
                "portal_url": portal_url,
                "manual_url": portal_url,
            }

        # ── Step 4: Map profile → fields ──────────────────────────────────
        mapping = map_fields_to_profile(detected_fields, profile)
        fill_map = mapping["fill_map"]
        filled_labels = mapping["filled_labels"]
        skipped_labels = mapping["skipped_labels"]

        # ── Step 5: Fill the form ─────────────────────────────────────────
        actually_filled = []
        for selector, value in fill_map.items():
            try:
                el = page.locator(selector).first
                tag = await el.evaluate("el => el.tagName.toLowerCase()")

                if tag == "select":
                    # Try to select an option that matches the value
                    try:
                        await el.select_option(label=value, timeout=2000)
                    except Exception:
                        try:
                            await el.select_option(value=value, timeout=2000)
                        except Exception:
                            skipped_labels.append(f"{selector} (select option not found)")
                            continue
                else:
                    await el.click(timeout=2000)
                    await el.fill(value, timeout=2000)

                actually_filled.append(selector)
            except Exception as e:
                skipped_labels.append(f"{selector} (fill error: {str(e)[:50]})")

        # ── Step 6: Screenshot the filled form ────────────────────────────
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(screenshot_path), full_page=False)
        await browser.close()

    return {
        "success": True,
        "screenshot_url": screenshot_url,
        "fields_filled": filled_labels,
        "fields_skipped": skipped_labels,
        "total_detected": len(detected_fields),
        "total_filled": len(actually_filled),
        "portal_url": portal_url,
        "manual_url": portal_url,
    }
