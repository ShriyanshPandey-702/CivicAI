import { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AgentStepCard from '@/components/agent/AgentStepCard';
import AgentTracePanel from '@/components/agent/AgentTracePanel';
import SchemeCard from '@/components/schemes/SchemeCard';
import { useAgentPipeline } from '@/hooks/useAgentPipeline';
import { useCitizen } from '@/lib/CitizenContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

const AgentPage = () => {
  const { citizenId, citizenProfile, setSchemeCards, setAnalysisComplete, addAppliedScheme } = useCitizen();
  const { steps, traceLogs, isRunning, isComplete, result, runPipeline, runFastApply } = useAgentPipeline();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeScheme, setActiveScheme] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ reference: string, narrator_text?: string, benefit_amount?: number } | null>(null);

  const handleStart = async () => {
    if (!citizenProfile) {
      toast.error("Complete your profile first");
      navigate('/register');
      return;
    }
    setApplyResult(null);
    setActiveScheme(null);
    await runPipeline(citizenProfile);

    // After pipeline completes, the result is available via the hook.
    // We need to push it to context in the effect below.
  };

  // Phase 2: Fast apply (eligibility already confirmed in discovery)
  const handleApply = async (schemeId: string) => {
    if (!citizenId) return;
    setActiveScheme(schemeId);
    setApplyResult(null);
    try {
      const res = await runFastApply(citizenId, schemeId);
      setApplyResult({ reference: res.reference, narrator_text: res.narrator_text, benefit_amount: res.benefit_amount });
      toast.success(`Application generated! Ref: ${res.reference}`);

      // Find the scheme data from localSchemeCards
      const schemeData = localSchemeCards.find(s => (s.id || (s as any).scheme_id) === schemeId);
      addAppliedScheme({
        id: `app_${Date.now()}`,
        scheme_name: schemeData?.name || (res as any).scheme_name || 'Government Scheme',
        reference_id: res.reference,
        date: new Date().toISOString().split('T')[0],
        benefit_amount: schemeData?.benefit_amount || res.benefit_amount || 0,
        status: 'Processing',
      });
    } catch (e) {
      toast.error('Application generation failed');
    }
  };

  const localSchemeCards = result?.scheme_cards ?? [];
  const totalBenefit = localSchemeCards.reduce((sum, c) => sum + (c.benefit_amount || 0), 0);

  // When pipeline completes, push results to global context
  // so Dashboard + SchemesPage can access them
  useEffect(() => {
    if (isComplete && result && localSchemeCards.length > 0) {
      setSchemeCards(localSchemeCards);
      setAnalysisComplete(true);
    }
  }, [isComplete, result]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('agent.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('agent.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && !activeScheme && (
            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium animate-pulse">
              ⚡ {t('agent.running')}
            </span>
          )}
          {isComplete && !activeScheme && (
            <span className="text-xs px-3 py-1 bg-ashoka-green/10 text-ashoka-green rounded-full font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Analysis Complete
            </span>
          )}
          <button
            onClick={handleStart}
            disabled={isRunning || !citizenId}
            className="btn-saffron text-sm !px-4 !py-2 disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning && !activeScheme ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {!citizenId ? t('agent.register_first') : "Run AI Analysis"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Step cards */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl p-6">
            {steps.map(step => (
              <AgentStepCard key={step.step} step={step} />
            ))}
          </div>
        </div>

        {/* Right: Trace terminal */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <AgentTracePanel logs={traceLogs} isRunning={isRunning} />
          </div>
        </div>
      </div>

      {/* Results section — shown only after analysis completes */}
      {isComplete && result && (
        <div className="mt-8">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            {applyResult ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-ashoka-green" />
                    Application Generated Successfully
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {applyResult.narrator_text || 'Your application has been generated and is ready for submission.'}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/dashboard/schemes/${activeScheme}?ref=${applyResult.reference}`)} 
                  className="btn-primary text-sm !px-4 !py-2"
                >
                  View Status (Ref: {applyResult.reference})
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-ashoka-green shrink-0" />
                <div>
                  <p className="font-body font-semibold text-foreground">
                    ✅ {localSchemeCards.length} Eligible Schemes Found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total estimated benefit: ₹{totalBenefit.toLocaleString('en-IN')}/yr. 
                    All schemes below have been verified for your eligibility. Click "Apply Now" to generate your application instantly.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {localSchemeCards.length === 0 ? (
              <div className="col-span-3 text-center text-muted-foreground py-8 border border-dashed border-border rounded-xl bg-card">
                No eligible schemes found for your profile. Try updating your profile with more details.
              </div>
            ) : (
              localSchemeCards.map(scheme => (
                <div key={scheme.id} className="relative">
                  {activeScheme === scheme.id && isRunning && (
                    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  )}
                  <SchemeCard
                    scheme={scheme as any}
                    citizenId={citizenId ?? ''}
                    onApply={() => handleApply(scheme.id || (scheme as any).scheme_id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AgentPage;
