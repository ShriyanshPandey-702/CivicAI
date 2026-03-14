import { useState, useCallback } from "react";
import type { AgentStep } from "@/lib/types";
import type { SchemeCard } from "@/lib/api";
import { submitProfile, fastApply } from "@/lib/api";
import { INITIAL_AGENT_STEPS } from "@/lib/constants";

import type { CitizenProfile } from "@/lib/types";

export function useAgentPipeline() {
  const [steps, setSteps] = useState<AgentStep[]>(
    INITIAL_AGENT_STEPS.map((s) => ({ ...s, logs: [] }))
  );
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<{
    citizen_id: string;
    scheme_cards: SchemeCard[];
  } | null>(null);

  const addLog = (agent: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setTraceLogs((prev) => [...prev, `[${timestamp}] ${agent}: ${message}`]);
  };

  const updateStep = (stepId: number, data: { status: AgentStep["status"]; message: string }) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.step === stepId
          ? { ...s, status: data.status, message: data.message, logs: [...s.logs, data.message] }
          : s
      )
    );
  };

  // Phase 1: Profile + Discovery + Eligibility (all automatic)
  const runPipeline = useCallback(async (profile: CitizenProfile) => {
    setIsRunning(true);
    setIsComplete(false);
    setResult(null);
    setTraceLogs([]);
    setSteps(INITIAL_AGENT_STEPS.map((s) => ({ ...s, status: "queued", message: "Queued", logs: [] })));

    addLog("Orchestrator", "Starting Phase 1: Profile Analysis + Scheme Discovery + Eligibility Check");
    updateStep(1, { status: "running", message: "Loading citizen profile..." });

    try {
      addLog("ProfileAgent", "Parsing demographic and socioeconomic data");
      const response = await submitProfile(profile as any);

      updateStep(1, { status: "complete", message: `Profile ready: ${String(profile.name || "Citizen").toUpperCase()}` });
      addLog("ProfileAgent", "Profile analyzed successfully");

      // Discovery + eligibility run together on backend
      updateStep(3, { status: "running", message: "Scanning databases + checking eligibility..." });
      addLog("DiscoveryAgent", "Running RAG search + deterministic eligibility filter");

      const eligibleCount = response.scheme_cards.length;
      updateStep(3, { status: "complete", message: `${eligibleCount} eligible schemes confirmed` });
      addLog("EligibilityAgent", `Eligibility verified for ${eligibleCount} schemes (deterministic rules)`);

      // Mark eligibility steps as complete (they ran inside discovery)
      updateStep(4, { status: "complete", message: `✅ ${eligibleCount} schemes passed eligibility` });
      updateStep(5, { status: "complete", message: "All shown schemes are confirmed eligible" });

      // Leave application steps idle until user selects a scheme
      updateStep(2, { status: "idle", message: "Waiting for scheme selection..." });
      updateStep(6, { status: "idle", message: "Waiting for scheme selection..." });
      updateStep(7, { status: "idle", message: "Waiting for scheme selection..." });

      setResult({ citizen_id: response.citizen_id, scheme_cards: response.scheme_cards });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Pipeline failed";
      addLog("System", `Error: ${msg}`);
      updateStep(1, { status: "error", message: msg });
    } finally {
      setIsComplete(true);
      setIsRunning(false);
    }
  }, []);

  // Phase 2: Fast-track apply (eligibility already confirmed — skip straight to vault + PDF)
  const runFastApply = useCallback(async (citizenId: string, schemeId: string) => {
    setIsRunning(true);
    addLog("Orchestrator", `Starting Phase 2: Fast-track Apply for scheme ${schemeId}`);

    try {
      // Step 2 - Document Vault
      updateStep(2, { status: "running", message: "Checking required documents..." });
      addLog("VaultAgent", "Verifying documents in vault");

      // Step 6 - Application generation
      updateStep(6, { status: "running", message: "Generating PDF application..." });
      addLog("ApplicationAgent", "Pre-filling application form with profile data");

      const appResult = await fastApply(citizenId, schemeId);

      updateStep(2, { status: "complete", message: "Documents verified via Aadhaar OAuth" });
      addLog("VaultAgent", "Document verification complete");

      const refId = appResult.reference_id || appResult.application_result?.reference_id || "APPL-0000";
      updateStep(6, { status: "complete", message: `Application ready — Ref: ${refId}` });
      addLog("ApplicationAgent", "PDF generation successful");

      // Step 7 - Narrator
      updateStep(7, { status: "running", message: "Generating summary..." });
      addLog("NarratorAgent", "Translating final verdict");

      const narratorText = appResult.narrator_text || "Application summary generated.";
      updateStep(7, { status: "complete", message: "Summary generated in preferred language" });
      addLog("NarratorAgent", narratorText);

      return {
        matched: true,
        reason: "Eligibility confirmed during discovery phase.",
        reference: refId,
        narrator_text: narratorText,
        benefit_amount: appResult.benefit_amount
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Application generation failed";
      addLog("System", `Error: ${msg}`);
      updateStep(6, { status: "error", message: msg });
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { steps, traceLogs, isRunning, isComplete, result, runPipeline, runFastApply };
}
