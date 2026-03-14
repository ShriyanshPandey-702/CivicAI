"""
tools/pdf_generator.py

Generates a pre-filled Unicode PDF application form.
Uses DejaVuSans TTF fonts for full Unicode support (fpdf2 v2.x):
  — em-dashes, ₹ rupee symbol, Hindi Devanagari, and all UTF-8 characters.
"""
import os
from fpdf import FPDF

# Font paths relative to project root (CivicAI/AgentPart/)
_SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_FONT_REGULAR = os.path.join(_SCRIPT_DIR, "data", "fonts", "DejaVuSans.ttf")
_FONT_BOLD    = os.path.join(_SCRIPT_DIR, "data", "fonts", "DejaVuSans-Bold.ttf")


class UnicodePDF(FPDF):
    """FPDF2 subclass with DejaVuSans for full Unicode (₹, —, Devanagari, etc.)"""

    def __init__(self):
        super().__init__()
        if not os.path.exists(_FONT_REGULAR):
            raise FileNotFoundError(
                f"[PDF] Font file not found at {_FONT_REGULAR}\n"
                "[PDF] Download from: https://dejavu-fonts.github.io/Download.html\n"
                "[PDF] Place DejaVuSans.ttf and DejaVuSans-Bold.ttf in data/fonts/"
            )
        # fpdf2 (v2.x): add_font with TTF — Unicode is automatic, NO uni= kwarg
        self.add_font("DejaVu", "", _FONT_REGULAR)
        bold_path = _FONT_BOLD if os.path.exists(_FONT_BOLD) else _FONT_REGULAR
        self.add_font("DejaVu", "B", bold_path)

    def set_unicode_font(self, size: int = 11, bold: bool = False, italic: bool = False):
        style = "B" if bold else ""
        self.set_font("DejaVu", style, size)


def generate_application_pdf(profile: dict, scheme: dict, reference_id: str, eligibility_reasons: list = None) -> str:
    """
    Generates a pre-filled PDF application for the given scheme.
    Uses DejaVu fonts if available, otherwise falls back to core fonts safely.
    """
    pdf = FPDF()
    try:
        pdf = UnicodePDF()
    except Exception as e:
        print(f"[PDF Warning] Unicode fonts missing or failed: {e}. Falling back to core fonts.")
        pdf = FPDF()
        
        def safe_set_unicode_font(size=11, bold=False, italic=False):
            pdf.set_font("helvetica", "B" if bold else "", size)
        pdf.set_unicode_font_safe = safe_set_unicode_font
        
        # Override cell/multi_cell to strip unicode
        orig_cell = pdf.cell
        orig_multi = pdf.multi_cell
        pdf.cell = lambda w, h=0, txt="", *args, **kwargs: orig_cell(w, h, str(txt).encode("latin-1", "ignore").decode("latin-1"), *args, **kwargs)
        pdf.multi_cell = lambda w, h=0, txt="", *args, **kwargs: orig_multi(w, h, str(txt).encode("latin-1", "ignore").decode("latin-1"), *args, **kwargs)

    if not hasattr(pdf, "set_unicode_font_safe"):
        pdf.set_unicode_font_safe = pdf.set_unicode_font

    pdf.add_page()

    # ─── Header ──────────────────────────────────────────────────────────────
    pdf.set_fill_color(37, 99, 235)
    pdf.set_text_color(255, 255, 255)
    pdf.set_unicode_font(size=16, bold=True)
    pdf.cell(0, 15, "SahayAI \u2014 Government Scheme Application", new_x="LMARGIN", new_y="NEXT", align="C", fill=True)

    pdf.set_text_color(0, 0, 0)
    pdf.set_unicode_font(size=10)
    pdf.cell(0, 8, f"Reference ID: {reference_id}", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    # ─── Scheme Section ───────────────────────────────────────────────────────
    pdf.set_unicode_font(size=13, bold=True)
    pdf.cell(0, 10, f"Scheme: {scheme.get('name', '')}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_unicode_font(size=11)
    benefit_desc = scheme.get("benefit_description", "")
    if benefit_desc:
        pdf.multi_cell(190, 8, f"Benefit Summary: {benefit_desc}")
        pdf.ln(2)
        
    details = scheme.get("details") or scheme.get("description")
    if details:
        pdf.set_unicode_font(size=12, bold=True)
        pdf.cell(0, 8, "Detailed Benefits & Overview:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_unicode_font(size=10)
        pdf.multi_cell(190, 6, str(details))
        pdf.ln(4)

    # ─── Eligibility Confirmed ────────────────────────────────────────────────
    if eligibility_reasons:
        pdf.set_unicode_font(size=12, bold=True)
        pdf.cell(0, 8, "Eligibility Confirmed Based On:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_unicode_font(size=10)
        for reason in eligibility_reasons:
            if isinstance(reason, dict) and "criterion" in reason:
                text = reason["criterion"]
            else:
                text = str(reason)
            pdf.multi_cell(190, 6, f"\u2022  {text}")
        pdf.ln(5)

    # ─── Applicant Details ────────────────────────────────────────────────────
    pdf.set_unicode_font(size=13, bold=True)
    pdf.cell(0, 10, "Applicant Details", new_x="LMARGIN", new_y="NEXT")

    fields = [
        ("Full Name",      profile.get("name", "")),
        ("Age",            str(profile.get("age", ""))),
        ("Gender",         str(profile.get("gender", "")).capitalize()),
        ("State",          profile.get("state", "")),
        ("Annual Income",  f"\u20b9{profile.get('income', 0):,}"),
        ("Caste Category", str(profile.get("caste", "")).upper()),
        ("Occupation",     profile.get("occupation", "").replace("_", " ").title()),
        ("Family Size",    str(profile.get("family_size", ""))),
        ("Land Holdings",  f"{profile.get('land_acres', 0)} acres"),
        ("Ration Card",    str(profile.get("ration_card_type", "none")).upper()),
        ("Bank Account",   "Yes" if profile.get("has_bank_account") else "No"),
    ]

    for label, value in fields:
        pdf.set_unicode_font(size=10, bold=True)
        pdf.cell(60, 8, f"{label}:")
        pdf.set_unicode_font(size=10)
        pdf.cell(0, 8, str(value), new_x="LMARGIN", new_y="NEXT")

    # ─── Footer ───────────────────────────────────────────────────────────────
    # (Moved to the end, after new sections)

    # ─── Documents Required ───────────────────────────────────────────────────
    pdf.ln(5)
    pdf.set_unicode_font(size=13, bold=True)
    pdf.cell(0, 10, "Documents Required for Submission", new_x="LMARGIN", new_y="NEXT")
    
    docs = scheme.get("documents_required") or scheme.get("required_docs") or ["Aadhaar Card", "Bank Passbook", "Passport Size Photograph"]
    if isinstance(docs, str):
        docs = [docs]
        
    pdf.set_unicode_font(size=11)
    for doc in docs:
        pdf.multi_cell(190, 8, f"-  {str(doc).capitalize()}")

    # ─── Declaration ──────────────────────────────────────────────────────────
    pdf.ln(5)
    pdf.set_unicode_font(size=13, bold=True)
    pdf.cell(0, 10, "Declaration / \u0918\u094b\u0937\u0923\u093e", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_unicode_font(size=10, italic=True)
    declaration_text = (
        "I hereby declare that all the information furnished above is true, complete and correct "
        "to the best of my knowledge and belief. I understand that in the event of any information "
        "being found false or incorrect, my application may be rejected and I may be liable for "
        "legal action under applicable laws."
    )
    pdf.multi_cell(190, 6, declaration_text)

    # ─── Signature Block ──────────────────────────────────────────────────────
    pdf.ln(15)
    pdf.set_unicode_font(size=11, bold=True)
    
    # Place Date / Place on the left, Signature on the right
    y_before = pdf.get_y()
    pdf.cell(100, 8, "Date: __________________", new_x="RIGHT")
    pdf.cell(0, 8, "Signature / Thumb Impression: __________________", new_x="LMARGIN", new_y="NEXT", align="R")
    
    pdf.ln(2)
    pdf.cell(100, 8, "Place: __________________", new_x="RIGHT")
    pdf.cell(0, 8, f"Name: {profile.get('name', '')}", new_x="LMARGIN", new_y="NEXT", align="R")

    # ─── Footer ───────────────────────────────────────────────────────────────
    pdf.ln(15)
    pdf.set_unicode_font(size=8, italic=True)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, f"Generated automatically by SahayAI \u2014 Civic Intelligence Agent | Ref: {reference_id}", new_x="LMARGIN", new_y="NEXT", align="C")

    # ─── Save ─────────────────────────────────────────────────────────────────
    os.makedirs("data/generated_pdfs", exist_ok=True)
    path = f"data/generated_pdfs/{reference_id}.pdf"
    pdf.output(path)
    return path
