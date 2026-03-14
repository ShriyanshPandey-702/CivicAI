/**
 * src/lib/CitizenContext.tsx — React context for sharing citizen_id,
 * profile data, scheme results, applied schemes, and notification state
 * across all dashboard pages.
 *
 * IMPORTANT: Full schemeCards are stored in React state ONLY (in-memory).
 * Only a slim summary is persisted to localStorage to avoid quota errors.
 * Applied schemes are persisted to localStorage (they are small).
 */
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { SchemeCard } from "./api";
import type { CitizenProfile } from "./types";

/** Slim version stored in localStorage */
interface SchemeCardSummary {
  id: string;
  name: string;
  benefit_amount: number;
  confidence: number;
  eligibility_confirmed?: boolean;
}

/** Tracks a submitted application */
export interface AppliedScheme {
  id: string;
  scheme_name: string;
  reference_id: string;
  date: string;
  benefit_amount: number;
  status: string;
}

interface CitizenState {
  citizenId: string | null;
  citizenProfile: CitizenProfile | null;
  schemeCards: SchemeCard[];
  analysisComplete: boolean;
  analysisExpired: boolean;
  appliedSchemes: AppliedScheme[];
  notificationCount: number;
}

interface CitizenContextType extends CitizenState {
  setCitizenId: (id: string) => void;
  setCitizenProfile: (p: CitizenProfile) => void;
  setSchemeCards: (cards: SchemeCard[]) => void;
  setAnalysisComplete: (val: boolean) => void;
  addAppliedScheme: (app: AppliedScheme) => void;
  setNotificationCount: (n: number) => void;
  clearCitizen: () => void;
}

function slimCards(cards: SchemeCard[]): SchemeCardSummary[] {
  return cards.map(c => ({
    id: c.id,
    name: c.name,
    benefit_amount: c.benefit_amount,
    confidence: c.confidence,
    eligibility_confirmed: (c as any).eligibility_confirmed,
  }));
}

const CitizenContext = createContext<CitizenContextType | null>(null);

export function CitizenProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CitizenState>(() => {
    try {
      const storedId = localStorage.getItem('citizen_id');
      const storedProfile = localStorage.getItem('citizen_profile');
      const storedAnalysis = localStorage.getItem('analysis_complete') === 'true';
      const storedSummary = localStorage.getItem('scheme_cards_summary');
      const storedApplied = localStorage.getItem('applied_schemes');

      const summaryCards: SchemeCardSummary[] = storedSummary ? JSON.parse(storedSummary) : [];
      const analysisExpired = storedAnalysis && summaryCards.length > 0;

      const appliedSchemes: AppliedScheme[] = storedApplied ? JSON.parse(storedApplied) : [];

      // Compute initial notification count based on state
      let notificationCount = 0;
      if (!storedId) notificationCount += 1;  // "Complete your profile"
      if (storedId && !storedAnalysis) notificationCount += 1; // "Run AI Analysis"
      if (analysisExpired) notificationCount += 1; // "Analysis expired"

      return {
        citizenId: storedId,
        citizenProfile: storedProfile ? JSON.parse(storedProfile) : null,
        schemeCards: [],
        analysisComplete: storedAnalysis,
        analysisExpired: !!analysisExpired,
        appliedSchemes,
        notificationCount,
      };
    } catch (e) {
      console.error("Failed to restore citizen state:", e);
      return {
        citizenId: null, citizenProfile: null, schemeCards: [],
        analysisComplete: false, analysisExpired: false,
        appliedSchemes: [], notificationCount: 1,
      };
    }
  });

  const setCitizenId = useCallback((id: string) => {
    localStorage.setItem('citizen_id', id);
    setState((prev) => ({ ...prev, citizenId: id }));
  }, []);

  const setCitizenProfile = useCallback((p: CitizenProfile) => {
    localStorage.setItem('citizen_profile', JSON.stringify(p));
    setState((prev) => ({ ...prev, citizenProfile: p }));
  }, []);

  const setSchemeCards = useCallback((cards: SchemeCard[]) => {
    try {
      localStorage.setItem('scheme_cards_summary', JSON.stringify(slimCards(cards)));
    } catch (e) {
      console.warn("Could not save scheme summary to localStorage:", e);
    }
    setState((prev) => ({ ...prev, schemeCards: cards, analysisExpired: false }));
  }, []);

  const setAnalysisComplete = useCallback((val: boolean) => {
    localStorage.setItem('analysis_complete', String(val));
    setState((prev) => ({
      ...prev,
      analysisComplete: val,
      analysisExpired: false,
      notificationCount: 0, // Clear notifications after analysis
    }));
  }, []);

  const addAppliedScheme = useCallback((app: AppliedScheme) => {
    setState((prev) => {
      const updated = [app, ...prev.appliedSchemes];
      try {
        localStorage.setItem('applied_schemes', JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save applied schemes:", e);
      }
      return { ...prev, appliedSchemes: updated };
    });
  }, []);

  const setNotificationCount = useCallback((n: number) => {
    setState((prev) => ({ ...prev, notificationCount: n }));
  }, []);

  const clearCitizen = useCallback(() => {
    localStorage.removeItem('citizen_id');
    localStorage.removeItem('citizen_profile');
    localStorage.removeItem('scheme_cards_summary');
    localStorage.removeItem('analysis_complete');
    localStorage.removeItem('applied_schemes');
    localStorage.removeItem('scheme_cards');
    localStorage.removeItem('last_applied_scheme');
    localStorage.removeItem('unread_notification_count');
    setState({
      citizenId: null, citizenProfile: null, schemeCards: [],
      analysisComplete: false, analysisExpired: false,
      appliedSchemes: [], notificationCount: 1,
    });
  }, []);

  return (
    <CitizenContext.Provider
      value={{
        ...state,
        setCitizenId,
        setCitizenProfile,
        setSchemeCards,
        setAnalysisComplete,
        addAppliedScheme,
        setNotificationCount,
        clearCitizen,
      }}
    >
      {children}
    </CitizenContext.Provider>
  );
}

export function useCitizen() {
  const ctx = useContext(CitizenContext);
  if (!ctx) throw new Error("useCitizen must be used within <CitizenProvider>");
  return ctx;
}
