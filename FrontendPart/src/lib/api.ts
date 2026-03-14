import { CitizenProfile } from "./types";
/**
 * src/lib/api.ts — Centralized API client for the SahayAI FastAPI backend.
 */

const API_BASE = "http://localhost:5000";

// ── Types ──────────────────────────────────────────────────────────

export type ProfileData = CitizenProfile;

export interface SchemeCard {
  id: string;
  name: string;
  category: string;
  benefit_amount: number;
  benefit_description?: string;
  confidence: number;
  required_docs: string[];
  warning_tag?: string;
  eligibility_rules?: Record<string, unknown>;
  portal_url?: string;
}

export interface ProfileResponse {
  citizen_id: string;
  citizen_profile: Record<string, unknown>;
  scheme_cards: SchemeCard[];
}

export interface EligibilityResponse {
  eligibility_result: {
    matched: boolean;
    confidence: number;
    already_satisfied: string[];
    needs_verification: string[];
    follow_up_questions: string[];
    reason: string;
  };
  selected_scheme: Record<string, unknown>;
}

export interface ApplicationResponse {
  application_result: {
    reference_id: string;
    pdf_path: string;
    scheme_name: string;
    status: string;
  };
  audit_trail: Record<string, unknown>;
  benefit_score: number;
}

export interface FastApplyResponse {
  reference_id: string;
  scheme_name: string;
  narrator_text: string;
  benefit_amount: number;
  status: string;
  message: string;
  application_result: {
    reference_id: string;
    pdf_path: string;
    scheme_name: string;
    status: string;
  };
  audit_trail: Record<string, unknown>;
  benefit_score: number;
}

export interface SSEEvent {
  agent: string;
  step: number;
  status: "running" | "complete" | "error";
  message: string;
  result?: {
    scheme_cards: SchemeCard[];
    eligible_schemes: SchemeCard[];
    total_benefit: number;
  };
}

// ── API Methods ────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API error");
  }
  return res.json();
}

/** Submit citizen profile → returns citizen_id + discovered schemes. */
export async function submitProfile(data: ProfileData): Promise<ProfileResponse> {
  return post<ProfileResponse>("/api/profile", data);
}

/** Stub for selectScheme as requested by user */
export async function selectScheme(citizenId: string, schemeId: string): Promise<any> {
  // In a real app this would call /api/evaluate or similar
  return post<any>("/api/evaluate", { citizen_id: citizenId, scheme_id: schemeId });
}

/** Re-discover schemes for an existing citizen. */
export async function discoverSchemes(citizenId: string): Promise<ProfileResponse> {
  return post<ProfileResponse>("/api/schemes/discover", { citizen_id: citizenId });
}

/** Run deep eligibility check for a specific scheme. */
export async function checkEligibility(
  citizenId: string,
  schemeId: string,
  followUpAnswers: Record<string, unknown> = {}
): Promise<EligibilityResponse> {
  return post<EligibilityResponse>("/api/schemes/eligibility", {
    citizen_id: citizenId,
    scheme_id: schemeId,
    follow_up_answers: followUpAnswers,
  });
}

/** Check document vault status. */
export async function checkVault(citizenId: string, schemeId: string) {
  return post<Record<string, unknown>>("/api/vault/check", {
    citizen_id: citizenId,
    scheme_id: schemeId,
  });
}

/** Submit application for a scheme → PDF + narrator. */
export async function applyForScheme(
  citizenId: string,
  schemeId: string,
  profile: Record<string, unknown> = {},
  eligibilityResult: Record<string, unknown> = {}
): Promise<ApplicationResponse> {
  return post<ApplicationResponse>("/api/apply", {
    citizen_id: citizenId,
    scheme_id: schemeId,
    citizen_profile: profile,
    eligibility_result: eligibilityResult,
  });
}

/** Fast-track apply for pre-verified eligible scheme (skips eligibility). */
export async function fastApply(
  citizenId: string,
  schemeId: string,
  schemeData?: Record<string, any>
): Promise<FastApplyResponse> {
  return post<FastApplyResponse>(`/api/apply/${citizenId}/${schemeId}`, { scheme_data: schemeData });
}

/** Connect to SSE pipeline stream. Returns a cleanup function. */
export function connectSSE(
  citizenId: string,
  callbacks: {
    onEvent: (event: SSEEvent) => void;
    onError?: (error: Event) => void;
    onComplete?: () => void;
  }
): () => void {
  const es = new EventSource(`${API_BASE}/api/stream/${citizenId}`);

  es.onmessage = (e) => {
    try {
      const data: SSEEvent = JSON.parse(e.data);
      callbacks.onEvent(data);

      // Auto-close on final event
      if (data.step === 99 && data.status === "complete") {
        es.close();
        callbacks.onComplete?.();
      }
    } catch {
      // ignore parse errors
    }
  };

  es.onerror = (e) => {
    callbacks.onError?.(e);
    es.close();
  };

  return () => es.close();
}
