# SahayAI (CivicAI) — Project Context & Handover

This document serves as the comprehensive context for the SahayAI project as of March 14, 2026. Read this before continuing development in a new environment.

---

## 🚀 1. Technology Stack
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + ShadCN UI
  - **Location**: `CivicAI/FrontendPart`
  - **Port**: 8080
  - **Key Libs**: Framer Motion (animations), Lucide React (icons), Sonner (toasts), Axios (API).
- **Backend**: FastAPI (Python 3.10+)
  - **Location**: `CivicAI/AgentPart`
  - **Port**: 5000
  - **Key Libs**: Pydantic v2, Uvicorn, SSE-Starlette (for agent traces).
- **Core AI Architecture**: 7-Agent Pipeline (Profile, Discovery, Deep Eligibility, Vault, Application, Narrator).
- **Database**: 
  - **Supabase**: Used for Auth, Storage (vault), and primary Postgres/pgvector.
  - **MOCK_DB**: Used in `AgentPart/main.py` for session-based persistence of profile and schemes (now mirrored in Frontend).

---

## 🏗️ 2. System Architecture (The "3-Phase Flow")
The project implements a deterministic eligibility-first discovery model.

### PHASE 1: Profile + Discovery (Automatic)
- **Trigger**: User submits the 5-step registration form.
- **Process**:
  1. `ProfileAgent` normalizes input into a structured `CitizenProfile`.
  2. `DiscoveryRAGAgent` searches 600+ schemes using vector similarity.
  3. **Deterministic Filter**: For every discovered scheme, the agent runs a `phase1_check` (Logic in `deep_eligibility_agent.py`) against core rules (Age, Income, Caste, State, Occupation).
  4. **Result**: Only schemes where `matched == True` are returned to the user.
- **Outcome**: The user *never* sees a scheme they are inherently ineligible for.

### PHASE 2: Fast-Track Application
- **Trigger**: User clicks "Apply Now" on a scheme card from the Dashboard.
- **Process**:
  1. Since eligibility was already confirmed in Phase 1, Phase 2 **skips eligibility verification**.
  2. `VaultAgent` checks for required documents.
  3. `ApplicationAgent` generates a pre-filled PDF.
  4. `NarratorAgent` provides a final success explanation.

---

## 💾 3. State Management & Persistence
- **Global Context**: Managed in `FrontendPart/src/lib/CitizenContext.tsx`.
- **LocalStorage Sync**: Both `citizenProfile` and `schemeCards` are synced to `localStorage`. This ensures the dashboard survives hard refreshes and avoids the "Complete Your Profile" loop.
- **Field Parity**: Frontend `CitizenProfile` (TS) and Backend `ProfileRequest` (Pydantic) are 1:1 synced. Boolean fields are strictly typed as `bool` to avoid truthy-string errors in Python.

---

## 📂 4. Critical Files
### Backend (`CivicAI/AgentPart/`)
- `main.py`: Main FastAPI entry point with CORS and SSE streaming.
- `agents/discovery_rag_agent.py`: Implements the 600+ scheme glob list and Phase 1 filtering.
- `agents/deep_eligibility_agent.py`: Contains `phase1_check` (Deterministic rules).
- `data/schemes/`: Folder containing 600+ JSON scheme definitions.

### Frontend (`CivicAI/FrontendPart/`)
- `src/pages/RegisterPage.tsx`: Massive 5-step form with conditional logic and real-time agent trace.
- `src/lib/CitizenContext.tsx`: The source of truth for user state and persistence.
- `src/pages/DashboardPage.tsx`: Displays verified schemes and total benefit summaries.
- `src/pages/SchemesPage.tsx`: Hardened list view with auto-fetch fallback.

---

## 🛠️ 5. Running the Project
1. **Start Backend**:
   ```bash
   cd CivicAI/AgentPart
   python main.py
   ```
2. **Start Frontend**:
   ```bash
   cd CivicAI/FrontendPart
   npm run dev
   ```
3. **Verify Health**: Visit `http://localhost:5000/health`.

---

## ⚠️ 6. Important Design Decisions
- **Input UX**: All registration inputs use `e.target.select()` on focus to prevent accidental data concatenation for numerical fields.
- **No Blank Screens**: `DashboardPage` and `SchemesPage` have guards that trigger data re-fetching if context is empty but `citizen_id` exists in storage.
- **Warning Tags**: `SchemeCard` renders a "Warning" badge if the backend returns specific blockers (e.g., "NO BANK ACCOUNT").

---

## 📝 7. Pending / Next Steps
- Implement full document OCR in the `VaultAgent`.
- Add more granular scheme rules to the `data/schemes/` JSON files.
- Extend the `NarratorAgent` to support multiple Indian languages (Hindi, Marathi, etc.).

---
*Created by Antigravity (Advanced Agentic Coding)*
