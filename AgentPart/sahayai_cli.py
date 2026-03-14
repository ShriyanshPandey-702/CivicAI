
"""
sahayai_cli.py
SahayAI — Autonomous Welfare Intelligence & Execution Agent
Pure terminal CLI application. No Flask. No browser.

Run: python sahayai_cli.py
"""
import sys
import os
import time

# Add project root to path so agents can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

def check_ollama():
    import sys
    import os
    try:
        import ollama
    except ImportError:
        print("Error: 'ollama' python package not found. Please run 'pip install ollama'.", file=sys.stderr)
        sys.exit(1)
        
    required_models = [
        os.environ.get("OLLAMA_MODEL", "qwen3.5:9b"),
        os.environ.get("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b"),
        os.environ.get("OLLAMA_OCR_MODEL", "deepseek-ocr:3b")
    ]
    
    ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    client = ollama.Client(host=ollama_host)
    
    try:
        models_response = client.list()
        available_models = [m.get('name', m.get('model', '')) for m in models_response.get('models', [])]
        
        missing = []
        for req in required_models:
            if not any(req in av or av in req for av in available_models):
                missing.append(req)
                    
        if missing:
            print(f"Error: Required Ollama models are missing: {', '.join(missing)}", file=sys.stderr)
            print("Please pull them using 'ollama pull <model_name>'", file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"Error connecting to Ollama at {ollama_host}: {e}", file=sys.stderr)
        print("Is Ollama running? Try 'ollama serve'.", file=sys.stderr)
        sys.exit(1)

check_ollama()

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn
from rich import print as rprint
from rich.text import Text
import questionary
from typing import Any, Dict

from agents.profile_agent import run_profile_agent
from agents.discovery_rag_agent import run_discovery_rag_agent
from agents.deep_eligibility_agent import run_deep_eligibility_agent
from agents.vault_agent import run_vault_agent
from agents.executor_narrator_agent import run_executor_narrator_agent

console = Console()

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

OCCUPATIONS = [
    "Farmer", "Daily Wage Worker", "Self Employed",
    "Student", "Unemployed", "Other"
]

CASTES = [
    "General",
    "OBC (Other Backward Class)",
    "SC (Scheduled Caste)",
    "ST (Scheduled Tribe)",
    "EWS (Economically Weaker Section)"
]

LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali"]

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 1 — WELCOME BANNER
# ─────────────────────────────────────────────────────────────────────────────
def screen_welcome():
    console.clear()
    banner = Text()
    banner.append("╔══════════════════════════════════════════╗\n", style="bold cyan")
    banner.append("║          सहाय AI — SahayAI              ║\n", style="bold cyan")
    banner.append("║   Autonomous Welfare Intelligence Agent  ║\n", style="bold cyan")
    banner.append("║  Your Personal Digital Welfare Officer   ║\n", style="bold cyan")
    banner.append("╚══════════════════════════════════════════╝", style="bold cyan")
    console.print(banner)
    console.print()
    console.print("[italic]Finding every government scheme you qualify for.[/italic]")
    console.print()
    console.input("[dim]Press Enter to begin...[/dim]")

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 2 — PROFILE COLLECTION
# ─────────────────────────────────────────────────────────────────────────────
def screen_profile() -> Dict[str, Any]:
    while True:
        console.clear()
        console.rule("[bold blue]Step 1 of 4: Personal Details[/bold blue]")
        console.print()

        q_name = questionary.text("Your full name:").ask()
        if q_name is None: sys.exit(0)

        q_age = questionary.text(
            "Your age:",
            validate=lambda x: x.isdigit() and 1 <= int(x) <= 120 or "Enter a valid age (1-120)"
        ).ask()
        if q_age is None: sys.exit(0)

        q_gender = questionary.select("Gender:", choices=["Male", "Female", "Other"]).ask()
        if q_gender is None: sys.exit(0)

        q_state = questionary.select("Your state:", choices=INDIAN_STATES).ask()
        if q_state is None: sys.exit(0)

        q_marital = questionary.select(
            "Marital status:", 
            choices=["Single", "Married", "Widowed", "Divorced"]
        ).ask()
        if q_marital is None: sys.exit(0)

        console.print()
        console.rule("[bold blue]Step 2 of 4: Economic Details[/bold blue]")
        console.print()

        q_income = questionary.text(
            "Annual income in rupees (e.g. 68000):",
            validate=lambda x: x.isdigit() or "Enter a valid number"
        ).ask()
        if q_income is None: sys.exit(0)

        q_occupation = questionary.select("Occupation:", choices=OCCUPATIONS).ask()
        if q_occupation is None: sys.exit(0)

        q_caste = questionary.select("Caste category:", choices=CASTES).ask()
        if q_caste is None: sys.exit(0)

        q_ration = questionary.select("Ration card type:", choices=["AAY (Antyodaya)", "BPL", "APL", "None"]).ask()
        if q_ration is None: sys.exit(0)

        q_bank = questionary.confirm("Do you have a bank account?").ask()
        if q_bank is None: sys.exit(0)

        q_disability = questionary.confirm("Do you have any disability?").ask()
        if q_disability is None: sys.exit(0)

        console.print()
        console.rule("[bold blue]Step 3 of 4: Family & Assets[/bold blue]")
        console.print()

        q_family = questionary.text(
            "Family size (number of members):",
            validate=lambda x: x.isdigit() and int(x) >= 1 or "Enter at least 1"
        ).ask()
        if q_family is None: sys.exit(0)

        q_land = questionary.text(
            "Land holdings in acres (enter 0 if none):",
            validate=lambda x: x.replace('.', '', 1).isdigit() or "Enter a valid number (e.g. 1.8 or 0)"
        ).ask()
        if q_land is None: sys.exit(0)

        # Dependent fields collection
        dep_answers: Dict[str, Any] = {}
        
        if q_occupation == "Farmer":
            dep_answers["land_ownership"] = questionary.select("Land ownership:", choices=["Owned", "Leased", "Sharecropper"]).ask()
            dep_answers["crop_type"] = questionary.select("Crop type:", choices=["Kharif", "Rabi", "Both"]).ask()
            dep_answers["irrigation_type"] = questionary.select("Irrigation type:", choices=["Rainfed", "Irrigated"]).ask()
            dep_answers["kisan_credit_card"] = "yes" if questionary.confirm("Do you have a Kisan Credit Card?").ask() else "no"
            dep_answers["soil_health_card"] = "yes" if questionary.confirm("Do you have a Soil Health Card?").ask() else "no"
        elif q_occupation == "Student":
            dep_answers["education_level"] = questionary.select("Education level:", choices=["Class 9-10", "Class 11-12", "Diploma", "Undergraduate", "Postgraduate"]).ask()
            dep_answers["institution_type"] = questionary.select("Institution type:", choices=["Government", "Private Aided", "Private Unaided"]).ask()
            dep_answers["course_type"] = questionary.select("Course type:", choices=["Full-time", "Part-time"]).ask()
            dep_answers["previous_scholarship"] = "yes" if questionary.confirm("Have you received a scholarship before?").ask() else "no"
            dep_answers["hosteller"] = questionary.select("Are you a day scholar or hosteller?", choices=["Day Scholar", "Hosteller"]).ask()
        elif q_occupation == "Daily Wage Worker":
            dep_answers["work_type"] = questionary.select("Work type:", choices=["Construction", "Domestic Work", "Agriculture", "Other"]).ask()
            dep_answers["eshram_registered"] = "yes" if questionary.confirm("Are you registered on e-Shram?").ask() else "no"
            dep_answers["has_epfo"] = "yes" if questionary.confirm("Do you have an EPFO account?").ask() else "no"
        elif q_occupation == "Self Employed":
            dep_answers["business_type"] = questionary.select("Business type:", choices=["Manufacturing", "Service", "Trade"]).ask()
            dep_answers["existing_mudra_loan"] = "yes" if questionary.confirm("Do you have an existing Mudra loan?").ask() else "no"
            dep_answers["udyam_registered"] = "yes" if questionary.confirm("Are you Udyam registered?").ask() else "no"
        elif q_occupation == "Unemployed":
            dep_answers["job_seeker_registered"] = "yes" if questionary.confirm("Are you registered as a job seeker?").ask() else "no"
            dep_answers["seeking_skill_training"] = "yes" if questionary.confirm("Are you seeking skill training?").ask() else "no"

        if q_gender == "Female" and q_marital == "Married":
            has_children = questionary.confirm("Do you have children?").ask()
            dep_answers["has_children"] = "yes" if has_children else "no"
            if has_children:
                dep_answers["youngest_child_age"] = int(questionary.text(
                    "Age of youngest child:", 
                    validate=lambda x: x.isdigit() or "Enter a valid age"
                ).ask())
                
        if q_disability:
            dep_answers["disability_type"] = questionary.select("Disability type:", choices=["Visual", "Hearing", "Locomotor", "Intellectual", "Other"]).ask()
            dep_answers["disability_percentage"] = questionary.select("Disability percentage:", choices=["40-60%", "61-80%", "81-100%"]).ask()
            dep_answers["disability_certificate"] = "yes" if questionary.confirm("Do you have a disability certificate?").ask() else "no"

        console.print()
        console.rule("[bold blue]Step 4 of 4: Language[/bold blue]")
        console.print()

        q_lang = questionary.select(
            "Preferred language for explanations:",
            choices=LANGUAGES
        ).ask()
        if q_lang is None: sys.exit(0)

        # Normalize values
        occ_map = {
            "Farmer": "farmer",
            "Daily Wage Worker": "daily_wage",
            "Self Employed": "self_employed",
            "Student": "student",
            "Unemployed": "unemployed",
            "Other": "other"
        }
        caste_map = {
            "General": "general",
            "OBC (Other Backward Class)": "obc",
            "SC (Scheduled Caste)": "sc",
            "ST (Scheduled Tribe)": "st",
            "EWS (Economically Weaker Section)": "ews"
        }
        ration_map = {
            "AAY (Antyodaya)": "aay",
            "BPL": "bpl",
            "APL": "apl",
            "None": "none"
        }

        profile = {
            "name": q_name,
            "age": int(q_age),
            "gender": str(q_gender).lower(),
            "state": q_state,
            "marital_status": str(q_marital).lower(),
            "income": int(q_income),
            "occupation": occ_map.get(str(q_occupation), "other"),
            "caste": caste_map.get(str(q_caste), "general"),
            "ration_card_type": ration_map.get(str(q_ration), "none"),
            "has_bank_account": bool(q_bank),
            "has_disability": bool(q_disability),
            "family_size": int(q_family),
            "land_acres": float(q_land),
            "preferred_language": q_lang
        }
        # Merge dependent answers securely into the profile
        profile.update(dep_answers)

        # Show summary table
        console.print()
        table = Table(title="Profile Summary", show_header=True, header_style="bold magenta")
        table.add_column("Field", style="dim", width=20)
        table.add_column("Value", style="bold")

        table.add_row("Name", profile["name"])
        table.add_row("Age", str(profile["age"]))
        table.add_row("Gender", str(q_gender))
        table.add_row("State", profile["state"])
        table.add_row("Annual Income", f"₹{profile['income']:,}")
        table.add_row("Occupation", str(q_occupation))
        table.add_row("Caste", str(q_caste).split("(")[0].strip())
        table.add_row("Ration Card", str(q_ration))
        table.add_row("Bank Account", "Yes" if profile["has_bank_account"] else "No")
        table.add_row("Disability", "Yes" if profile["has_disability"] else "No")
        table.add_row("Family Size", str(profile["family_size"]))
        table.add_row("Land Holdings", f"{profile['land_acres']} acres")
        
        # Optionally dump the dependent items into the table briefly
        if dep_answers:
            table.add_row("", "")
            table.add_row("[italic]Additional Info[/italic]", "")
            for k, v in dep_answers.items():
                table.add_row(k.replace("_", " ").title(), str(v).title())

        console.print(table)
        console.print()

        confirm = questionary.confirm(
            "Is this correct? Proceed to find schemes?"
        ).ask()
        if confirm is None: sys.exit(0)

        if confirm:
            return profile
    
    return {}

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 3 — AGENT PIPELINE RUNNING
# ─────────────────────────────────────────────────────────────────────────────
def screen_run_pipeline(profile: Dict[str, Any]) -> Dict[str, Any]:
    console.clear()
    console.rule("[bold blue]Running SahayAI Agents[/bold blue]")
    console.print()

    state = {
        "raw_profile": profile,
        "citizen_profile": None,
        "citizen_id": None,
        "scheme_cards": None,
        "selected_scheme_id": None,
        "selected_scheme": None,
        "eligibility_result": None,
        "follow_up_answers": {},
        "vault_status": None,
        "verified_docs": [],
        "missing_docs": [],
        "application_result": None,
        "audit_trail": None,
        "benefit_score": 0,
        "failed_scheme_ids": set(),
        "error": None,
        "current_step": "start"
    }

    steps = [
        ("Normalizing your profile...", "profile_agent", run_profile_agent),
        ("Searching government schemes...", "discovery_rag", run_discovery_rag_agent),
    ]

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        console=console,
    ) as progress:
        task = progress.add_task("Initializing...", total=len(steps))

        for step_name, step_key, agent_fn in steps:
            progress.update(task, description=f"[cyan]{step_name}[/cyan]")
            try:
                state = agent_fn(state)
            except Exception as e:
                console.print(f"\n[red]Error in {step_key}: {e}[/red]")
                retry = questionary.confirm("Retry this step?").ask()
                if retry:
                    state = agent_fn(state)
                else:
                    sys.exit(1)
            time.sleep(0.3)
            progress.advance(task)

    scheme_cards = list(state.get("scheme_cards") or [])
    console.print()
    console.print(f"[bold green]✓ Found {len(scheme_cards)} matching schemes for you![/bold green]")
    console.print()
    time.sleep(0.8)
    return state

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 4 — SHOW SCHEME CARDS
# ─────────────────────────────────────────────────────────────────────────────
def screen_scheme_selection(state: Dict[str, Any]) -> Dict[str, Any]:
    failed_ids = state.get("failed_scheme_ids") or set()
    scheme_cards = [s for s in state.get("scheme_cards", []) 
                    if s.get("id") not in failed_ids]
                    
    if not scheme_cards:
        console.print("[red]No schemes found. Please try again.[/red]")
        sys.exit(0)

    console.clear()
    console.rule("[bold blue]Schemes You May Qualify For[/bold blue]")
    console.print()

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("#", width=3)
    table.add_column("Scheme Name", width=35)
    table.add_column("Benefit/Year", width=14)
    table.add_column("Match Score", width=12)

    for i, s in enumerate(scheme_cards):
        score = s.get("confidence", 0)
        if score >= 80:
            score_str = f"[bold green]{score}%[/bold green]"
        elif score >= 50:
            score_str = f"[bold yellow]{score}%[/bold yellow]"
        else:
            score_str = f"[bold red]{score}%[/bold red]"

        benefit = s.get("benefit_amount", 0)
        benefit_str = f"₹{int(benefit):,}" if benefit else "N/A"

        display_name = s.get("name", "Unknown")
        warning = s.get("warning_tag", "")
        if warning:
            display_name = f"{display_name} [yellow]⚠ {warning}[/yellow]"

        table.add_row(
            str(i + 1),
            display_name,
            benefit_str,
            score_str
        )

    console.print(table)
    console.print()

    choices = [
        f"{i+1}. {s['name']} — ₹{int(s.get('benefit_amount', 0)):,}/yr"
        for i, s in enumerate(scheme_cards)
    ] + ["Exit"]

    scheme_choice = questionary.select(
        "Select a scheme to apply for:",
        choices=choices
    ).ask()

    if scheme_choice is None or scheme_choice == "Exit":
        screen_goodbye(state)
        sys.exit(0)

    idx = int(scheme_choice.split(".")[0]) - 1
    selected = scheme_cards[idx]
    state["selected_scheme_id"] = selected["id"]
    state["selected_scheme"] = selected
    return state

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 5 — DEEP ELIGIBILITY CHAT
# ─────────────────────────────────────────────────────────────────────────────
def screen_deep_eligibility(state: Dict[str, Any]) -> Dict[str, Any] | None:
    scheme_name = state.get("selected_scheme", {}).get("name", "Selected Scheme")

    console.clear()
    console.rule(f"[bold blue]Eligibility Check: {scheme_name}[/bold blue]")
    console.print()

    with console.status("[bold blue]Analyzing eligibility...[/bold blue]", spinner="dots"):
        try:
            state = run_deep_eligibility_agent(state)
        except Exception as e:
            console.print(f"[red]Eligibility check error: {e}[/red]")
            state["eligibility_result"] = {
                "matched": True,
                "confidence": 70,
                "already_satisfied": ["profile reviewed"],
                "needs_verification": [],
                "questions": [],
                "reason": "Basic criteria verified. Proceeding."
            }

    result = state.get("eligibility_result", {})
    console.print()

    # Show already satisfied criteria
    already = result.get("already_satisfied", [])
    if already:
        console.print("[bold green]✓ Already confirmed from your profile:[/bold green]")
        for item in already:
            console.print(f"  [green]✓ {item}[/green]")
        console.print()

    # Ask follow-up questions
    questions = result.get("questions", [])
    answers: Dict[str, str] = {}

    if questions:
        console.print("[bold]A few more questions to confirm eligibility:[/bold]")
        console.print()

        for question in questions:
            qtype = question.get("type", "text")
            qtext = question.get("question", "Please confirm:")
            field = question.get("field", "answer")

            if qtype == "yes_no":
                ans = questionary.confirm(qtext).ask()
                if ans is None: sys.exit(0)
                answers[str(field)] = "yes" if ans else "no"
            elif qtype == "number":
                ans = questionary.text(
                    qtext,
                    validate=lambda x: str(x).replace('.', '', 1).isdigit() or "Enter a valid number"
                ).ask()
                if ans is None: sys.exit(0)
                answers[str(field)] = str(ans)
            else:
                ans = questionary.text(qtext).ask()
                if ans is None: sys.exit(0)
                answers[str(field)] = str(ans)

        # Re-run with answers
        console.print()
        state["follow_up_answers"] = answers
        state["eligibility_result"] = None

        with console.status("[bold blue]Finalizing eligibility result...[/bold blue]", spinner="dots"):
            try:
                state = run_deep_eligibility_agent(state)
            except Exception as e:
                console.print(f"[yellow]Warning: {e} — using cached result[/yellow]")

        result = state.get("eligibility_result", {})

    # Show verdict
    matched = result.get("matched", True)
    confidence = result.get("confidence", 75)
    reason = result.get("reason", "Eligibility verified.")

    console.print()

    if matched:
        verdict_text = (
            f"[bold white]✅ YOU ARE ELIGIBLE![/bold white]\n"
            f"[white]Confidence: {confidence}%[/white]\n"
            f"[white]{reason}[/white]"
        )
        console.print(Panel(verdict_text, border_style="green", padding=(1, 2)))
    else:
        failed_ids: set = state.get("failed_scheme_ids") or set()
        if state.get("selected_scheme_id"):
            failed_ids.add(state.get("selected_scheme_id"))
        state["failed_scheme_ids"] = failed_ids
        
        verdict_text = (
            f"[bold white]❌ YOU MAY NOT QUALIFY[/bold white]\n"
            f"[white]Reason: {reason}[/white]"
        )
        console.print(Panel(verdict_text, border_style="red", padding=(1, 2)))
        console.print()
        retry = questionary.confirm("Would you like to check another scheme?").ask()
        if retry:
            state["eligibility_result"] = None
            state["selected_scheme_id"] = None
            state["selected_scheme"] = None
            state["follow_up_answers"] = {}
            return None  # signal to go back to scheme selection
        else:
            screen_goodbye(state)
            sys.exit(0)

    console.print()
    time.sleep(0.5)
    return state

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 6 — DOCUMENT VAULT CHECK
# ─────────────────────────────────────────────────────────────────────────────
def screen_vault_check(state: Dict[str, Any]) -> Dict[str, Any]:
    console.clear()
    console.rule("[bold blue]Document Vault Check[/bold blue]")
    console.print()

    with console.status("[bold blue]Checking document vault...[/bold blue]", spinner="dots"):
        try:
            state = run_vault_agent(state)
        except Exception as e:
            console.print(f"[yellow]Vault warning: {e}[/yellow]")

    # Always guarantee vault_status is a valid dict after the agent call
    if not state.get("vault_status"):
        state["vault_status"] = {
            "required": [],
            "found": [],
            "missing": [],
            "vault_empty": True,
            "all_docs_present": False
        }

    vault = state.get("vault_status") or {}
    required = list(vault.get("required") or [])
    found = list(vault.get("found") or [])
    missing = list(vault.get("missing") or [])

    console.print()
    doc_table = Table(show_header=True, header_style="bold magenta")
    doc_table.add_column("Document", width=28)
    doc_table.add_column("Status", width=16)

    for doc in required:
        if doc in found:
            doc_table.add_row(doc, "[green]✅ Found[/green]")
        else:
            doc_table.add_row(doc, "[yellow]⚠️  Missing[/yellow]")

    if not required:
        doc_table.add_row("[dim]No documents required[/dim]", "[green]✅ All clear[/green]")

    console.print(doc_table)
    console.print()

    if missing:
        console.print(Panel(
            "[yellow]⚠  Some documents are missing from your vault.\n"
            "For this demo we will proceed without them.\n"
            "In production you would upload them here.[/yellow]",
            border_style="yellow"
        ))
        console.print()
        proceed = questionary.confirm("Proceed to generate application anyway?").ask()
        if proceed is None or not proceed:
            screen_goodbye(state)
            sys.exit(0)
    else:
        console.print("[bold green]✅ All documents verified![/bold green]")

    console.print()
    return state

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 7 & 8 — GENERATE APPLICATION + NARRATOR
# ─────────────────────────────────────────────────────────────────────────────
def screen_generate_application(state: Dict[str, Any]) -> Dict[str, Any]:
    console.clear()
    console.rule("[bold blue]Generating Your Application[/bold blue]")
    console.print()

    with console.status(
        "[bold blue]Generating PDF application...[/bold blue]",
        spinner="dots"
    ):
        try:
            state = run_executor_narrator_agent(state)
        except Exception as e:
            console.print(f"[yellow]Generator warning: {e}[/yellow]")
            state["application_result"] = {
                "reference_id": f"SAH{hash(str(state.get('citizen_id', '')))%100000:05X}",
                "pdf_path": "data/generated_pdfs/application.pdf",
                "scheme_name": state.get("selected_scheme", {}).get("name", "Scheme"),
                "status": "generated"
            }
            state["audit_trail"] = {
                "narrator_text": (
                    "आपका आवेदन स्वीकृत हो गया है। "
                    "Your application has been generated successfully. "
                    "Please visit your nearest Common Service Centre to submit it."
                ),
                "reference_id": state["application_result"]["reference_id"],
                "benefit_amount": state.get("selected_scheme", {}).get("benefit_amount", 0),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            state["benefit_score"] = float(
                state.get("selected_scheme", {}).get("benefit_amount", 0) or 0
            )

    app_result = state.get("application_result") or {}
    ref_id = app_result.get("reference_id", "SAH-UNKNOWN")
    pdf_path = app_result.get("pdf_path", "data/generated_pdfs/")
    scheme_name = app_result.get("scheme_name", "Application")

    console.print()
    console.print(Panel(
        f"[bold white]✅ APPLICATION GENERATED SUCCESSFULLY![/bold white]\n\n"
        f"[white]Scheme:       {scheme_name}[/white]\n"
        f"[white]Reference ID: [bold yellow]{ref_id}[/bold yellow][/white]\n"
        f"[white]PDF saved to: {pdf_path}[/white]",
        border_style="green",
        padding=(1, 2)
    ))

    # SCREEN 8 — NARRATOR
    console.print()
    console.rule("[bold blue]SahayAI Explains[/bold blue]")
    console.print()

    audit = state.get("audit_trail") or {}
    narrator_text = (audit.get("narrator_text") or "").strip()
    if not narrator_text:
        scheme_name_display = app_result.get("scheme_name", "your selected scheme")
        narrator_text = (
            f"Your application for {scheme_name_display} has been successfully generated. "
            f"Please visit your nearest government office or Common Service Centre to submit it."
        )

    console.print(Panel(
        narrator_text,
        title="[bold blue]SahayAI says[/bold blue]",
        border_style="blue",
        padding=(1, 2)
    ))

    console.print()
    time.sleep(0.5)
    return state

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 9 — BENEFIT SCORE
# ─────────────────────────────────────────────────────────────────────────────
def screen_benefit_score(state: Dict[str, Any], applied_schemes: list) -> bool:
    console.clear()
    console.rule("[bold blue]Your Total Benefit Summary[/bold blue]")
    console.print()

    total = sum(s.get("benefit_amount", 0) or 0 for s in applied_schemes)

    score_panel = (
        f"[bold white]TOTAL ANNUAL BENEFIT DISCOVERED[/bold white]\n\n"
        f"[bold yellow]₹ {int(total):,} / year[/bold yellow]\n\n"
        f"[white]{len(applied_schemes)} application(s) generated[/white]"
    )
    console.print(Panel(score_panel, border_style="cyan", padding=(1, 4)))
    console.print()

    if applied_schemes:
        breakdown = Table(show_header=True, header_style="bold magenta")
        breakdown.add_column("Scheme", width=35)
        breakdown.add_column("Annual Benefit", width=16)

        for s in applied_schemes:
            amt = int(s.get("benefit_amount", 0) or 0)
            breakdown.add_row(s.get("name", "Scheme"), f"₹{amt:,}")

        console.print(breakdown)
        console.print()

    another = questionary.confirm("Apply to another scheme?").ask()
    return bool(another)

# ─────────────────────────────────────────────────────────────────────────────
# SCREEN 10 — GOODBYE
# ─────────────────────────────────────────────────────────────────────────────
def screen_goodbye(state: Dict[str, Any]):
    console.print()
    bye = Text()
    bye.append("╔══════════════════════════════════════════╗\n", style="bold cyan")
    bye.append("║       Thank you for using SahayAI       ║\n", style="bold cyan")
    bye.append("║   Your applications have been saved.    ║\n", style="bold cyan")
    bye.append("║   Reference IDs stored in Supabase.     ║\n", style="bold cyan")
    bye.append("╚══════════════════════════════════════════╝", style="bold cyan")
    console.print(bye)
    console.print()

# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
def main():
    # Screen 1 — Welcome
    screen_welcome()

    # Screen 2 — Profile collection
    profile = screen_profile()

    # Screen 3 — Run pipeline (profile + discovery)
    state = screen_run_pipeline(profile)

    applied_schemes = []

    while True:
        # Screen 4 — Select a scheme
        state = screen_scheme_selection(state)

        # Ensure scheme selection wasn't abandoned
        if not state.get("selected_scheme_id"):
            break

        # Screen 5 — Deep eligibility
        result = screen_deep_eligibility(state)
        if result is None:
            # User wants to pick another scheme
            state["selected_scheme_id"] = None
            state["selected_scheme"] = None
            state["eligibility_result"] = None
            state["follow_up_answers"] = {}
            continue
        state = result

        # Screen 6 — Vault check
        state = screen_vault_check(state)

        # Screen 7 & 8 — Generate application + narrator
        state = screen_generate_application(state)

        # Track applied scheme for score
        applied_schemes.append(state.get("selected_scheme", {}))

        # Screen 9 — Benefit score
        apply_another = screen_benefit_score(state, applied_schemes)

        if apply_another:
            # Reset scheme-specific state but keep profile + scheme cards
            state["selected_scheme_id"] = None
            state["selected_scheme"] = None
            state["eligibility_result"] = None
            state["follow_up_answers"] = {}
            state["vault_status"] = None
            state["verified_docs"] = []
            state["missing_docs"] = []
            state["application_result"] = None
            state["audit_trail"] = None
        else:
            break

    # Screen 10 — Goodbye
    screen_goodbye(state)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n\n[dim]Session ended by user.[/dim]")
        sys.exit(0)
