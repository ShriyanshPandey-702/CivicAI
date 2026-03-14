"""
tools/nsfdc_pdf_generator.py
Custom pre-filled PDF generator for NSFDC Term Loan formulations.
Supports 3 Activity Formats and 1 Affidavit Annexure.
"""

import os
from pathlib import Path
from fpdf import FPDF

# Paths
FONTS_DIR = Path(__file__).parent.parent / "data" / "fonts"
GENERATED_DIR = Path(__file__).parent.parent / "data" / "generated_pdfs"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def number_to_words(n: int) -> str:
    """Converts an integer (up to crores) to Indian English words."""
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    if n == 0:
        return "Zero"
    if n < 20:
        return ones[n]
    if n < 100:
        return tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")
    if n < 1000:
        return ones[n // 100] + " Hundred" + (" and " + number_to_words(n % 100) if n % 100 else "")
    if n < 100000:
        return number_to_words(n // 1000) + " Thousand" + (" " + number_to_words(n % 1000) if n % 1000 else "")
    if n < 10000000:
        return number_to_words(n // 100000) + " Lakh" + (" " + number_to_words(n % 100000) if n % 100000 else "")
    return number_to_words(n // 10000000) + " Crore" + (" " + number_to_words(n % 10000000) if n % 10000000 else "")


class NSFDCPdf(FPDF):
    def header(self):
        # 3px saffron stripe at top
        self.set_fill_color(255, 140, 0) # Saffron
        self.rect(0, 0, 210, 3, 'F')
        
    def footer(self):
        # 3px green stripe at bottom
        self.set_y(-3)
        self.set_fill_color(19, 136, 8) # Green
        self.rect(0, 294, 210, 3, 'F')


def _add_fonts(pdf: FPDF):
    """Add DejaVu fonts for Unicode support, fallback to core fonts."""
    regular_path = str(FONTS_DIR / "DejaVuSans.ttf")
    bold_path = str(FONTS_DIR / "DejaVuSans-Bold.ttf")
    if os.path.exists(regular_path) and os.path.exists(bold_path):
        pdf.add_font("DejaVu", "", regular_path)
        pdf.add_font("DejaVu", "B", bold_path)
    else:
        # Fallback to Helvetica if fonts not found
        pass


def _get_font_name(pdf: FPDF) -> str:
    """Return 'DejaVu' if loaded, else 'Helvetica'."""
    return "DejaVu" if "DejaVu" in pdf.fonts else "Helvetica"


def _draw_header(pdf: FPDF):
    """Draws the main corporation header."""
    font = _get_font_name(pdf)
    pdf.set_font(font, "B", 13)
    pdf.set_text_color(0, 0, 128) # Navy
    pdf.cell(0, 10, "NATIONAL SCHEDULED CASTES FINANCE & DEVELOPMENT CORPORATION, DELHI", ln=1, align="C")
    pdf.set_text_color(0, 0, 0) # Black
    pdf.ln(5)


def _draw_section_title(pdf: FPDF, title: str):
    """Draws a gray background section title block."""
    font = _get_font_name(pdf)
    pdf.set_font(font, "B", 11)
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(0, 8, f"  {title}", ln=1, fill=True)
    pdf.ln(2)


def _kv_line(pdf: FPDF, key: str, value: str, blank_length: int = 50):
    """Draws a key and its pre-filled value or a blank line."""
    font = _get_font_name(pdf)
    pdf.set_font(font, "", 11)
    pdf.cell(60, 8, f"{key}:")
    
    if value and str(value).strip():
        pdf.set_font(font, "B", 11)
        pdf.set_text_color(0, 0, 150) # Blue for pre-filled data
        pdf.cell(0, 8, str(value), ln=1)
        pdf.set_text_color(0, 0, 0)
    else:
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 8, "_" * blank_length, ln=1)
        pdf.set_text_color(0, 0, 0)


def _draw_blank_lines(pdf: FPDF, count: int = 3):
    """Draws empty dotted lines for manual filling."""
    for _ in range(count):
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 8, ".......................................................................................................................", ln=1)
    pdf.set_text_color(0, 0, 0)


def _draw_promoter_section(pdf: FPDF, profile: dict):
    _draw_section_title(pdf, "Section 1: Details of Promoter")
    _kv_line(pdf, "Name of the Applicant", profile.get("name"))
    _kv_line(pdf, "Age", profile.get("age"))
    _kv_line(pdf, "Residential Address / State", profile.get("state"))
    
    occ = str(profile.get("occupation", "")).title().replace("_", " ")
    _kv_line(pdf, "Present Occupation", occ)
    
    inc = profile.get("income")
    inc_str = f"Rs. {int(inc):,}" if inc else ""
    _kv_line(pdf, "Annual Family Income", inc_str)
    
    fam = profile.get("family_size")
    fam_str = f"{fam} members" if fam else ""
    _kv_line(pdf, "Family Size", fam_str)
    pdf.ln(4)


def _draw_means_of_finance_table(pdf: FPDF):
    _draw_section_title(pdf, "Section 4: Means of Finance")
    font = _get_font_name(pdf)
    
    # Table Header
    pdf.set_font(font, "B", 10)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(10, 8, "S.N.", border=1, fill=True)
    pdf.cell(110, 8, "Source of Finance", border=1, fill=True)
    pdf.cell(30, 8, "Per Unit (%)", border=1, fill=True, align="C")
    pdf.cell(40, 8, "Total Amount (Rs)", border=1, fill=True, align="R")
    pdf.ln()

    # Table Rows
    pdf.set_font(font, "", 10)
    rows = [
        "Promoter's Contribution",
        "Subsidy",
        "Margin Money Loan (SCA)",
        "Term Loan / Seed Capital (NSFDC)",
        "Banks",
        "Others, if any"
    ]
    for i, row in enumerate(rows, 1):
        # Alternating background
        fill = (i % 2 == 0)
        pdf.set_fill_color(250, 250, 250)
        
        pdf.cell(10, 8, str(i), border=1, fill=fill)
        pdf.cell(110, 8, row, border=1, fill=fill)
        pdf.cell(30, 8, "", border=1, fill=fill)
        pdf.cell(40, 8, "", border=1, fill=fill)
        pdf.ln()
    
    pdf.set_font(font, "B", 10)
    pdf.cell(120, 8, "TOTAL", border=1, align="R")
    pdf.cell(30, 8, "100%", border=1, align="C")
    pdf.cell(40, 8, "", border=1)
    pdf.ln(8)


# ─── Formats 1, 2, 3 Generators ──────────────────────────────────────────────

def _generate_format_1(pdf: FPDF, profile: dict):
    """FORMAT NO.1 — Financial Assistance for Non-Farming and Other Activities"""
    font = _get_font_name(pdf)
    pdf.set_font(font, "BU", 12)
    pdf.cell(0, 10, "FORMAT NO.1 — Non-Farming and Other Activities", ln=1, align="C")
    pdf.ln(5)

    _draw_promoter_section(pdf, profile)
    
    _draw_section_title(pdf, "Section 2: Proposed Activity")
    _kv_line(pdf, "Name of the Activity", "")
    _kv_line(pdf, "Location of Unit", "")
    _kv_line(pdf, "Relevant Experience/Skill", "")
    pdf.ln(4)
    
    _draw_section_title(pdf, "Section 3: Cost of Project")
    pdf.set_font(font, "", 10)
    items = [
        "Building", "Plant and Machinery", "Misc. Fixed Assets",
        "Preliminary & Pre-operative expenses", "Contingencies and cost escalation",
        "Others (registration, insurance etc.)", "Working Capital"
    ]
    for i, item in enumerate(items, 1):
        pdf.cell(10, 7, f"({i})", border=1)
        pdf.cell(110, 7, item, border=1)
        pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
        pdf.ln()
    pdf.set_font(font, "B", 10)
    pdf.cell(120, 7, "TOTAL COST OF PROJECT", border=1, align="R")
    pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
    pdf.ln(8)
    
    _draw_means_of_finance_table(pdf)
    
    _draw_section_title(pdf, "Section 5: Details of Profitability")
    _draw_blank_lines(pdf, 2)
    _draw_section_title(pdf, "Section 6: Technical Details")
    _draw_blank_lines(pdf, 2)
    _draw_section_title(pdf, "Section 7: Marketing Arrangements")
    _draw_blank_lines(pdf, 2)


def _generate_format_2(pdf: FPDF, profile: dict):
    """FORMAT NO.2 — Financial Assistance for Farming and Allied Activities"""
    font = _get_font_name(pdf)
    pdf.set_font(font, "BU", 12)
    pdf.cell(0, 10, "FORMAT NO.2 — Farming and Allied Activities", ln=1, align="C")
    pdf.ln(5)

    _draw_promoter_section(pdf, profile)
    
    _draw_section_title(pdf, "Section 2: Proposed Activity")
    _kv_line(pdf, "Activity Type", "Agriculture / Farming")
    _kv_line(pdf, "Land Ownership", profile.get("land_ownership"))
    land = profile.get("land_acres")
    _kv_line(pdf, "Land Size (Acres)", f"{land} Acres" if land else "")
    _kv_line(pdf, "Crop Type", profile.get("crop_type"))
    _kv_line(pdf, "Irrigation Details", profile.get("irrigation_type"))
    pdf.ln(4)
    
    _draw_section_title(pdf, "Section 3: Cost of Project")
    pdf.set_font(font, "B", 10)
    pdf.cell(0, 7, "PART-I: Land Based Activities", ln=1)
    pdf.set_font(font, "", 10)
    p1_items = ["Land value", "Cost of Land Development", "Provision for Irrigation",
                "Plant and Machinery", "Misc. Fixed Assets", "Preliminary expenses",
                "Contingencies", "Others", "Working Capital"]
    for i, item in enumerate(p1_items, 1):
        pdf.cell(10, 7, f"({i})", border=1)
        pdf.cell(110, 7, item, border=1)
        pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
        pdf.ln()
    pdf.set_font(font, "B", 10)
    pdf.cell(120, 7, "PART-I TOTAL", border=1, align="R")
    pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
    pdf.ln(5)
    
    pdf.cell(0, 7, "PART-II: Dairy", ln=1)
    pdf.set_font(font, "", 10)
    p2_items = ["Building", "Cost of Animals", "Misc. Fixed Assets", "Insurance", "Working Capital"]
    for i, item in enumerate(p2_items, 1):
        pdf.cell(10, 7, f"({i})", border=1)
        pdf.cell(110, 7, item, border=1)
        pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
        pdf.ln()
    pdf.set_font(font, "B", 10)
    pdf.cell(120, 7, "PART-II TOTAL", border=1, align="R")
    pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
    pdf.ln(5)
    
    pdf.cell(0, 7, "PART-III: Tractor and Agricultural Implements", ln=1)
    pdf.set_font(font, "", 10)
    p3_items = ["Cost of Tractor/Implements", "Misc. Attachments", "Others (Registration/Insurance)"]
    for i, item in enumerate(p3_items, 1):
        pdf.cell(10, 7, f"({i})", border=1)
        pdf.cell(110, 7, item, border=1)
        pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
        pdf.ln()
    pdf.set_font(font, "B", 10)
    pdf.cell(120, 7, "PART-III TOTAL", border=1, align="R")
    pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
    pdf.ln(5)
    
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(120, 8, "GRAND TOTAL COST OF PROJECT", border=1, align="R", fill=True)
    pdf.cell(70, 8, "Rs. ____________", border=1, align="R", fill=True)
    pdf.ln(8)
    
    # Needs a new page to not squash means of finance
    pdf.add_page()
    _draw_header(pdf)
    _draw_means_of_finance_table(pdf)
    
    _draw_section_title(pdf, "Section 5: Details of Profitability")
    _draw_blank_lines(pdf, 2)
    _draw_section_title(pdf, "Section 6: Technical Details")
    _draw_blank_lines(pdf, 2)
    _draw_section_title(pdf, "Section 7: Marketing Arrangements")
    _draw_blank_lines(pdf, 2)


def _generate_format_3(pdf: FPDF, profile: dict):
    """FORMAT NO.3 — Financial Assistance for Transport Activities"""
    font = _get_font_name(pdf)
    pdf.set_font(font, "BU", 12)
    pdf.cell(0, 10, "FORMAT NO.3 — Transport Activities", ln=1, align="C")
    pdf.ln(5)

    _draw_promoter_section(pdf, profile)
    
    _draw_section_title(pdf, "Section 2: Proposed Activity")
    _kv_line(pdf, "Type of Vehicle", "")
    _kv_line(pdf, "Route / Operating Area", "")
    _kv_line(pdf, "Driving License No.", "")
    pdf.ln(4)
    
    _draw_section_title(pdf, "Section 3: Cost of Project")
    pdf.set_font(font, "", 10)
    items = ["Cost of Vehicle (with quotations)", "Misc. Attachments", "Others (Transportation, registration, insurance)"]
    for i, item in enumerate(items, 1):
        pdf.cell(10, 7, f"({i})", border=1)
        pdf.cell(110, 7, item, border=1)
        pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
        pdf.ln()
    pdf.set_font(font, "B", 10)
    pdf.cell(120, 7, "TOTAL COST OF PROJECT", border=1, align="R")
    pdf.cell(70, 7, "Rs. ____________", border=1, align="R")
    pdf.ln(8)
    
    _draw_means_of_finance_table(pdf)
    
    _draw_section_title(pdf, "Section 5: Details of Profitability")
    _draw_blank_lines(pdf, 2)
    _draw_section_title(pdf, "Section 6: Technical Details")
    _draw_blank_lines(pdf, 2)
    _draw_section_title(pdf, "Section 7: Marketing Arrangements")
    _draw_blank_lines(pdf, 2)


def _generate_annexure_v(pdf: FPDF, profile: dict):
    """ANNEXURE-V — Affidavit (on Stamp Paper)"""
    pdf.add_page()
    font = _get_font_name(pdf)
    pdf.set_font(font, "B", 14)
    pdf.cell(0, 10, "ANNEXURE - V", ln=1, align="C")
    pdf.set_font(font, "B", 12)
    pdf.cell(0, 10, "AFFIDAVIT (To be executed on Non-Judicial Stamp Paper)", ln=1, align="C")
    pdf.ln(10)

    pdf.set_font(font, "", 11)
    
    name = profile.get("name", "_______________________")
    state = profile.get("state", "_______________________")
    
    # Map SC to Scheduled Caste etc
    caste_raw = str(profile.get("caste", "")).upper()
    if caste_raw == "SC":
        caste = "Scheduled Caste"
    elif caste_raw == "ST":
        caste = "Scheduled Tribe"
    elif caste_raw:
        caste = caste_raw
    else:
        caste = "Scheduled Caste"
        
    inc = profile.get("income", 0)
    try:
        inc_val = int(inc)
        inc_str = f"{inc_val:,}"
        inc_words = number_to_words(inc_val) + " Only"
    except (ValueError, TypeError):
        inc_str = "___________"
        inc_words = "________________________________"
        
    fam_size = profile.get("family_size", "____")

    text1 = f"I,  {name}  son/daughter/wife of  ________________________  residing at  ______________________________________________________  do hereby solemnly affirm and state on oath as follows:-"
    pdf.multi_cell(0, 8, text1)
    pdf.ln(4)
    
    text2 = f"1. I submit that I belong to  {caste}  category which comes under the Scheduled Castes/Tribes in the State of  {state}."
    pdf.multi_cell(0, 8, text2)
    pdf.ln(4)
    
    text3 = f"2. Further, I submit that I am not an Income Tax Assessee and that my Annual Family Income is Rs. {inc_str}/-(in words) {inc_words} from all sources. My family comprises of {fam_size} members. The details of which are as follows: _________________________________________________________________________."
    pdf.multi_cell(0, 8, text3)
    pdf.ln(4)
    
    text4 = "3. The above declaration is given by me for the purpose of obtaining loan under the scheme of State Channelising Agency (SCA) and National Scheduled Castes Finance and Development Corporation (NSFDC). In case any of the facts declared by me as above are found incorrect, I fully understand that I am liable for action in accordance with the Lending Policies of SCA & NSFDC."
    pdf.multi_cell(0, 8, text4)
    pdf.ln(15)
    
    pdf.set_font(font, "B", 11)
    pdf.cell(100, 8, "DEPONENT")
    pdf.cell(90, 8, "Identified by me", align="R", ln=1)
    pdf.ln(15)
    
    pdf.cell(100, 8, "SWORN TO, BEFORE ME")
    pdf.cell(90, 8, "Signature / Stamp", align="R", ln=1)
    pdf.ln(10)
    pdf.set_font(font, "", 11)
    pdf.cell(0, 8, "Place: __________________", ln=1)
    pdf.cell(0, 8, "Date:  __________________", ln=1)


# ─── Main Generator Function ─────────────────────────────────────────────────

def select_format(profile: dict) -> str:
    """Auto-selects the NSFDC format based on citizen occupation."""
    occ = str(profile.get("occupation", "")).lower()
    biz = str(profile.get("business_type", "")).lower()
    
    if "farm" in occ or "agri" in occ:
        return "FORMAT_2"
    elif "transport" in occ or "transport" in biz or "driver" in occ:
        return "FORMAT_3"
    else:
        return "FORMAT_1"


def generate_nsfdc_pdf(profile: dict, reference_id: str) -> str:
    """
    Generates the NSFDC Term Loan PDF based on profile occupation.
    Returns the URL/path to the generated PDF.
    """
    pdf = NSFDCPdf(orientation='P', unit='mm', format='A4')
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(True, margin=15)
    
    _add_fonts(pdf)
    
    pdf.add_page()
    _draw_header(pdf)
    
    fmt = select_format(profile)
    
    if fmt == "FORMAT_2":
        _generate_format_2(pdf, profile)
    elif fmt == "FORMAT_3":
        _generate_format_3(pdf, profile)
    else:
        _generate_format_1(pdf, profile)
        
    # Always attach the affidavit annexure
    _generate_annexure_v(pdf, profile)
    
    pdf_filename = f"{reference_id}_NSFDC.pdf"
    file_path = GENERATED_DIR / pdf_filename
    
    pdf.output(str(file_path))
    
    # Return relative URL for API
    return f"/api/application/{pdf_filename}"
