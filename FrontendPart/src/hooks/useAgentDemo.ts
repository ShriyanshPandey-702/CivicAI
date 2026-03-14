import { useState, useEffect, useCallback } from 'react';
import type { AgentStep } from '@/lib/types';
import { INITIAL_AGENT_STEPS } from '@/lib/constants';

// Mock SSE data for demo
const MOCK_EVENTS = [
  { step: 1, status: 'running' as const, message: 'Loading CitizenProfile...', delay: 500 },
  { step: 1, status: 'running' as const, message: 'State: Maharashtra | Category: OBC', delay: 1000 },
  { step: 1, status: 'running' as const, message: 'Occupation: Farmer | Land: 3.2 acres', delay: 1500 },
  { step: 1, status: 'complete' as const, message: 'Profile parsed successfully', delay: 2000 },
  { step: 2, status: 'running' as const, message: 'Verifying Aadhaar card...', delay: 2500 },
  { step: 2, status: 'running' as const, message: 'Aadhaar verified ✓ | Extracting land records...', delay: 3500 },
  { step: 2, status: 'complete' as const, message: 'Documents verified: 3/5 uploaded', delay: 4500 },
  { step: 3, status: 'running' as const, message: 'Scanning 1,247 schemes across 58 ministries...', delay: 5000 },
  { step: 3, status: 'running' as const, message: 'Found 847 state schemes + 400 central schemes', delay: 6500 },
  { step: 3, status: 'running' as const, message: 'Applying pre-filters for Maharashtra, OBC, Farmer...', delay: 7500 },
  { step: 3, status: 'complete' as const, message: 'Discovered 42 potentially matching schemes', delay: 8500 },
  { step: 4, status: 'running' as const, message: 'Checking basic eligibility for 42 schemes...', delay: 9000 },
  { step: 4, status: 'running' as const, message: 'Income criteria: 28 schemes match', delay: 10000 },
  { step: 4, status: 'complete' as const, message: 'Basic eligibility: 22 schemes qualified', delay: 11000 },
  { step: 5, status: 'running' as const, message: 'Deep analysis: cross-referencing criteria...', delay: 11500 },
  { step: 5, status: 'running' as const, message: 'Land ownership verified for 8 agriculture schemes', delay: 12500 },
  { step: 5, status: 'complete' as const, message: 'Final eligible: 14 schemes worth ₹87,400/yr', delay: 13500 },
  { step: 6, status: 'running' as const, message: 'Preparing auto-fill data for top 5 schemes...', delay: 14000 },
  { step: 6, status: 'complete' as const, message: 'Application forms ready for 5 schemes', delay: 15500 },
  { step: 7, status: 'running' as const, message: 'Generating personalized summary in Marathi...', delay: 16000 },
  { step: 7, status: 'complete' as const, message: 'Analysis complete — 14 schemes, ₹87,400/yr total', delay: 17000 },
];

export function useAgentDemo() {
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_AGENT_STEPS.map(s => ({ ...s })));
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startDemo = useCallback(() => {
    setSteps(INITIAL_AGENT_STEPS.map(s => ({ ...s, logs: [] })));
    setTraceLogs([]);
    setIsRunning(true);
    setIsComplete(false);

    // Queue up steps from 2-7 as 'queued'
    setSteps(prev => prev.map((s, i) => ({
      ...s,
      status: i === 0 ? 'running' : 'queued',
      message: i === 0 ? 'Starting...' : 'Queued',
    })));

    MOCK_EVENTS.forEach((event) => {
      setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
        const agentName = INITIAL_AGENT_STEPS[event.step - 1].agent_name;
        
        setTraceLogs(prev => [...prev, `[${timestamp}] ${agentName}: ${event.message}`]);

        setSteps(prev => prev.map(s => {
          if (s.step === event.step) {
            return {
              ...s,
              status: event.status,
              message: event.message,
              logs: [...s.logs, event.message],
            };
          }
          // Set next step to queued/running
          if (event.status === 'complete' && s.step === event.step + 1 && s.step <= 7) {
            return { ...s, status: 'queued', message: 'Preparing...' };
          }
          return s;
        }));

        // Final event
        if (event.step === 7 && event.status === 'complete') {
          setIsRunning(false);
          setIsComplete(true);
        }
      }, event.delay);
    });
  }, []);

  return { steps, traceLogs, isRunning, isComplete, startDemo };
}
