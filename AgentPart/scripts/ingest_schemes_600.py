"""
ingest_schemes_600.py
Bulk ingest all 600 schemes from schemes_600.json into Supabase pgvector.

Run:
    cd CivicAI/AgentPart
    python scripts/ingest_schemes_600.py

What it does:
    1. Loads schemes_600.json
    2. Embeds each scheme using qwen3-embedding:4b via Ollama
    3. Upserts into Supabase `schemes` table
    4. Stores embeddings in Supabase pgvector `scheme_embeddings` table
    5. Saves individual JSON files to data/schemes/

Requirements:
    pip install ollama supabase python-dotenv
"""

import json
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

try:
    import ollama
except ImportError:
    print("ERROR: pip install ollama")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("ERROR: pip install supabase")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────

SCHEMES_JSON   = Path(__file__).parent.parent / "data" / "schemes_600.json"
SCHEMES_DIR    = Path(__file__).parent.parent / "data" / "schemes"
EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b")
SUPABASE_URL   = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY   = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")
BATCH_SIZE     = 10   # embed N schemes before upserting to Supabase
EMBED_DIM      = 1536 # truncate to match pgvector column dimension

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_embedding(text: str) -> list[float]:
    """Get embedding vector from Ollama qwen3-embedding:4b."""
    try:
        resp = ollama.embeddings(model=EMBEDDING_MODEL, prompt=text[:4000])
        vec = resp.get("embedding") or resp.get("embeddings", [])
        if isinstance(vec, list) and vec and isinstance(vec[0], list):
            vec = vec[0]
        vec = [float(x) for x in vec]
        # Truncate/pad to EMBED_DIM
        if len(vec) > EMBED_DIM:
            vec = vec[:EMBED_DIM]
        elif len(vec) < EMBED_DIM:
            vec = vec + [0.0] * (EMBED_DIM - len(vec))
        return vec
    except Exception as e:
        print(f"    [embed error] {e}")
        return [0.0] * EMBED_DIM


def scheme_to_embed_text(scheme: dict) -> str:
    """Build rich text for embedding — includes name, description, eligibility."""
    parts = [
        scheme.get("name", ""),
        scheme.get("benefit_description", "")[:200],
        scheme.get("eligibility_text", "")[:300],
        scheme.get("details", "")[:200],
        f"Category: {scheme.get('category', '')}",
        f"Level: {scheme.get('level', '')}",
    ]
    if scheme.get("state"):
        parts.append(f"State: {scheme['state']}")
    tags = scheme.get("tags", [])
    if tags:
        parts.append("Tags: " + ", ".join(tags[:5]))
    return " | ".join(p for p in parts if p.strip())


def scheme_to_db_row(scheme: dict) -> dict:
    """Convert scheme dict to Supabase table row (matches schema)."""
    return {
        "id":                   scheme["id"],
        "name":                 scheme["name"][:200],
        "slug":                 scheme["slug"][:100],
        "category":             scheme.get("category", "other")[:50],
        "level":                scheme.get("level", "Central")[:20],
        "state":                scheme.get("state"),
        "benefit_amount":       scheme.get("benefit_amount") or 0,
        "benefit_frequency":    scheme.get("benefit_frequency", "annual")[:20],
        "benefit_description":  scheme.get("benefit_description", "")[:500],
        "details":              scheme.get("details", "")[:1000],
        "eligibility_text":     scheme.get("eligibility_text", "")[:1000],
        "eligibility_criteria": json.dumps(scheme.get("eligibility_criteria", [])),
        "documents_required":   json.dumps(scheme.get("documents_required", [])),
        "application_url":      scheme.get("application_url", "")[:300],
        "tags":                 json.dumps(scheme.get("tags", [])),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("SahayAI — Scheme Ingestion Script (600 schemes)")
    print("=" * 60)

    # 1. Load schemes
    if not SCHEMES_JSON.exists():
        # Try alternate path
        alt = Path(__file__).parent.parent / "schemes_600.json"
        if alt.exists():
            schemes_path = alt
        else:
            print(f"ERROR: schemes_600.json not found at {SCHEMES_JSON}")
            print("Place schemes_600.json in data/ or project root.")
            sys.exit(1)
    else:
        schemes_path = SCHEMES_JSON

    with open(schemes_path, "r", encoding="utf-8") as f:
        schemes = json.load(f)
    print(f"Loaded {len(schemes)} schemes from {schemes_path}")

    # 2. Create output directory for individual JSON files
    SCHEMES_DIR.mkdir(parents=True, exist_ok=True)

    # 3. Connect to Supabase
    sb = None
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            sb = create_client(SUPABASE_URL, SUPABASE_KEY)
            print(f"Connected to Supabase: {SUPABASE_URL[:40]}...")
        except Exception as e:
            print(f"WARNING: Supabase connection failed: {e}")
            print("Will save JSON files only (no DB upsert).")
    else:
        print("WARNING: SUPABASE_URL/KEY not set — saving JSON files only.")

    # 4. Check Ollama
    try:
        models = [m["name"] for m in ollama.list().get("models", [])]
        if not any(EMBEDDING_MODEL.split(":")[0] in m for m in models):
            print(f"WARNING: Embedding model '{EMBEDDING_MODEL}' not found.")
            print(f"Available models: {models}")
            print("Embeddings will be zeroed — RAG will fall back to keyword search.")
            USE_EMBEDDINGS = False
        else:
            print(f"Embedding model: {EMBEDDING_MODEL} ✓")
            USE_EMBEDDINGS = True
    except Exception as e:
        print(f"WARNING: Ollama not available ({e}) — skipping embeddings.")
        USE_EMBEDDINGS = False

    # 5. Process schemes
    success_count = 0
    error_count = 0
    batch_db = []
    batch_embeddings = []

    print(f"\nProcessing {len(schemes)} schemes...")
    print("-" * 60)

    for i, scheme in enumerate(schemes):
        name = scheme.get("name", "Unknown")[:50]
        slug = scheme.get("slug", f"scheme-{i}")

        try:
            # Save individual JSON file
            json_path = SCHEMES_DIR / f"{slug}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(scheme, f, indent=2, ensure_ascii=False)

            # Prepare DB row
            db_row = scheme_to_db_row(scheme)
            batch_db.append(db_row)

            # Get embedding
            if USE_EMBEDDINGS:
                embed_text = scheme_to_embed_text(scheme)
                vector = get_embedding(embed_text)
                batch_embeddings.append({
                    "scheme_id": scheme["id"],
                    "embedding": vector,
                })

            success_count += 1

            # Progress
            if (i + 1) % 50 == 0 or i == len(schemes) - 1:
                print(f"  [{i+1:4d}/{len(schemes)}] Processed — {name}...")

            # Batch upsert to Supabase
            if sb and (len(batch_db) >= BATCH_SIZE or i == len(schemes) - 1):
                try:
                    sb.table("schemes").upsert(batch_db).execute()
                    batch_db = []
                except Exception as e:
                    print(f"    [DB batch error] {e}")
                    batch_db = []

                if USE_EMBEDDINGS and batch_embeddings:
                    try:
                        sb.table("scheme_embeddings").upsert(batch_embeddings).execute()
                        batch_embeddings = []
                    except Exception as e:
                        print(f"    [Embedding batch error] {e}")
                        batch_embeddings = []

        except Exception as e:
            print(f"  [ERROR] {name}: {e}")
            error_count += 1
            continue

    # 6. Summary
    print("\n" + "=" * 60)
    print("INGESTION COMPLETE")
    print("=" * 60)
    print(f"  ✅ Successfully processed : {success_count}")
    print(f"  ❌ Errors                 : {error_count}")
    print(f"  📁 JSON files saved to    : {SCHEMES_DIR}")
    if sb:
        print(f"  🗄️  Upserted to Supabase  : schemes + scheme_embeddings tables")
    print()

    # 7. Category breakdown
    from collections import Counter
    cats = Counter(s.get("category","other") for s in schemes)
    print("Category breakdown:")
    for cat, count in cats.most_common():
        print(f"  {cat:<20} {count:4d} schemes")


if __name__ == "__main__":
    main()