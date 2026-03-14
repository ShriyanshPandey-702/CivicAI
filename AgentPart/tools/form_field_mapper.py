"""
tools/form_field_mapper.py
Maps government form field labels (English + Hindi) to citizen profile keys.
"""

# ─── Label → Profile Key Map ────────────────────────────────────────────────
# Each key is a profile field name; the value is a list of form-label variants
# that might appear on a government portal.

FIELD_LABEL_MAP = {
    # Name variants
    "name": [
        "name", "full name", "applicant name", "naam", "pura naam",
        "applicant's name", "farmer name", "beneficiary name",
        "candidate name", "your name", "first name", "full_name",
    ],
    # Age / DOB
    "age": [
        "age", "aayu", "date of birth", "dob", "d.o.b", "birth date",
        "janm tithi", "age as on date", "umar",
    ],
    # Gender
    "gender": [
        "gender", "ling", "sex", "male/female", "male / female",
    ],
    # Mobile
    "mobile": [
        "mobile", "phone", "contact", "mobile no", "mobile number",
        "phone number", "contact number", "mo. no", "cell", "telephone",
    ],
    # Aadhaar
    "aadhaar": [
        "aadhaar", "aadhar", "uid", "uidai number", "aadhaar number",
        "aadhaar no", "aadhar card number", "aadhaar card", "uidai",
    ],
    # Income
    "income": [
        "income", "annual income", "varshik aay", "family income",
        "household income", "total income", "aay", "yearly income",
    ],
    # State
    "state": [
        "state", "rajya", "state name", "state of residence",
        "state / ut", "state/ut",
    ],
    # District
    "district": [
        "district", "zila", "jila", "district name",
    ],
    # Pincode
    "pincode": [
        "pincode", "pin code", "pin", "zip", "postal code", "zip code",
    ],
    # Caste / Category
    "caste": [
        "caste", "jati", "category", "social category",
        "sc/st/obc/general", "caste category", "varg",
    ],
    # Land
    "land_acres": [
        "land", "land area", "area of land", "land holding",
        "agricultural land", "land in acres", "bhumi", "zameen",
        "land size", "hectare",
    ],
    # Bank Account
    "bank_account": [
        "bank account", "account number", "bank a/c",
        "account no", "bank account number", "khata sankhya",
    ],
    # IFSC
    "ifsc": [
        "ifsc", "ifsc code", "bank ifsc", "ifsc_code",
    ],
    # Occupation
    "occupation": [
        "occupation", "vyavsay", "profession", "employment type",
        "employment", "job type", "work type",
    ],
    # Family Size
    "family_size": [
        "family size", "family members", "number of members",
        "parivar ka aakaar", "total members", "dependents",
    ],
    # Email
    "email": [
        "email", "email id", "e-mail", "email address", "mail",
    ],
    # Address
    "address": [
        "address", "pata", "full address", "residential address",
        "permanent address", "current address",
    ],
    # Father's Name
    "father_name": [
        "father's name", "father name", "pita ka naam",
        "guardian name", "guardian's name", "father/guardian name",
    ],
}


def normalize_label(label: str) -> str:
    """Lowercase, strip whitespace and trailing colons / asterisks."""
    return label.lower().strip().rstrip(":*").strip()


def map_fields_to_profile(detected_fields: list[dict], profile: dict) -> dict:
    """
    Given a list of detected fields [{"selector": "...", "label": "...", "tag": "input"}]
    and a citizen profile dict, return:
        {selector: value_to_fill, ...}
    Only returns fields that matched AND have a non-empty value in the profile.
    Also returns a list of skipped field labels.
    """
    fill_map = {}
    filled_labels = []
    skipped_labels = []

    for field in detected_fields:
        label = normalize_label(field.get("label", ""))
        selector = field.get("selector", "")
        if not label or not selector:
            continue

        matched_key = None
        for profile_key, variants in FIELD_LABEL_MAP.items():
            if any(variant in label for variant in variants):
                matched_key = profile_key
                break

        if matched_key:
            value = profile.get(matched_key)
            if value is not None and str(value).strip():
                fill_map[selector] = str(value)
                filled_labels.append(label)
            else:
                skipped_labels.append(f"{label} (no data in profile)")
        else:
            skipped_labels.append(f"{label} (unknown field)")

    return {
        "fill_map": fill_map,
        "filled_labels": filled_labels,
        "skipped_labels": skipped_labels,
    }
