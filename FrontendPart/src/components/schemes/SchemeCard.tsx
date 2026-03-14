import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Globe, Loader2, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SchemeRecord } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface SchemeCardProps {
  scheme: SchemeRecord;
  eligible?: boolean;
  citizenId?: string;
  onApply?: (schemeId: string) => void;
}

const API_BASE = 'http://localhost:5000';

const SchemeCard = ({ scheme, eligible = true, citizenId, onApply }: SchemeCardProps) => {
  const { t } = useTranslation();
  const criteria = scheme.eligibility_criteria || [];
  const allMet = criteria.length > 0 ? criteria.every(c => c.met === true) : true;
  const isEligible = eligible && allMet;
  
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const hasPortalUrl = !!(scheme.portal_url || (scheme as any).application_url);

  const handleAutoFill = async () => {
    if (!citizenId) {
      toast.error('Complete your profile first');
      return;
    }
    setAutoFillLoading(true);
    try {
      const formData = new FormData();
      formData.append('citizen_id', citizenId);
      formData.append('scheme_id', scheme.id || scheme.scheme_id || '');
      
      const res = await fetch(`${API_BASE}/api/autofill`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.detail || 'Auto-fill failed');
        return;
      }
      
      setAutoFillResult(data);
      setShowModal(true);
      
      if (data.success) {
        toast.success(`Auto-filled ${data.total_filled} fields!`);
      } else if (data.captcha_detected) {
        toast.warning('CAPTCHA detected — manual completion required');
      } else {
        toast.error(data.error || 'Could not auto-fill');
      }
    } catch (err) {
      toast.error('Network error: could not reach the auto-fill agent');
    } finally {
      setAutoFillLoading(false);
    }
  };

  return (
    <>
      <div className={`card-scheme ${!isEligible ? 'card-scheme-ineligible' : ''} p-5`}>
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-medium text-india-blue bg-india-blue/10 px-2 py-0.5 rounded">
            {scheme.scheme_id || scheme.id?.substring(0, 10).toUpperCase() || "SCHEME"}
          </span>
          <div className="flex items-center gap-2">
            {(scheme as any).eligibility_confidence && (
              <span className="text-xs text-ashoka-green font-medium">
                ✅ {(scheme as any).eligibility_confidence}% match
              </span>
            )}
             {isEligible ? (
               <span className="text-xs text-ashoka-green font-medium flex items-center gap-1">
                 <CheckCircle className="w-3 h-3" /> {t('scheme.eligible')}
               </span>
             ) : (
               <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                 <XCircle className="w-3 h-3" /> {t('scheme.not_eligible')}
               </span>
             )}
             {(scheme as any).warning_tag && (
               <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded border border-warning/20 font-bold uppercase ml-2">
                 ⚠️ {(scheme as any).warning_tag}
               </span>
             )}
           </div>
         </div>

        <h3 className="font-body font-semibold text-foreground mb-1 text-sm">{scheme.name}</h3>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {Number(scheme.benefit_amount) > 0 && (
            <span>💰 ₹{Number(scheme.benefit_amount).toLocaleString('en-IN')}/{scheme.benefit_frequency === 'annual' ? 'yr' : scheme.benefit_frequency || 'yr'}</span>
          )}
          {Number(scheme.beneficiary_count) > 0 && (
            <span>👥 {(Number(scheme.beneficiary_count) / 1000000).toFixed(1)}M beneficiaries</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-4">{scheme.ministry || scheme.category}</p>

        <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
          {scheme.portal_url ? (
            <a href={scheme.portal_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-secondary hover:underline flex items-center gap-1">
              {t('scheme.view_details')} <ArrowRight className="w-3 h-3 inline" />
            </a>
          ) : (
            <span className="text-xs font-medium text-muted-foreground"></span>
          )}
          
          <div className="flex items-center gap-2">
            {/* Auto-Fill Portal Button */}
            {isEligible && hasPortalUrl && (
              <button
                onClick={handleAutoFill}
                disabled={autoFillLoading}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-india-blue/10 text-india-blue hover:bg-india-blue/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {autoFillLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Filling...
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    Auto-Fill
                  </>
                )}
              </button>
            )}
            
            {/* Apply Now Button */}
            {isEligible && (
              <button
                onClick={() => onApply?.(scheme.id || scheme.scheme_id)}
                className="text-xs font-medium text-primary flex items-center gap-1 hover:underline focus:outline-none"
              >
                {t('scheme.apply_now')} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* ── Auto-Fill Result Modal ─────────────────────────────────────── */}
      {showModal && autoFillResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Auto-Fill Result</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{scheme.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Status Banner */}
              {autoFillResult.success ? (
                <div className="bg-ashoka-green/10 text-ashoka-green border border-ashoka-green/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Form Filled Successfully!</p>
                    <p className="text-xs opacity-80">{autoFillResult.total_filled} of {autoFillResult.total_detected} fields filled automatically.</p>
                  </div>
                </div>
              ) : autoFillResult.captcha_detected ? (
                <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">CAPTCHA / OTP Detected</p>
                    <p className="text-xs opacity-80">Please complete verification manually on the portal.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                  <XCircle className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Auto-Fill Failed</p>
                    <p className="text-xs opacity-80">{autoFillResult.error}</p>
                  </div>
                </div>
              )}
              
              {/* Screenshot */}
              {autoFillResult.screenshot_url && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">Portal Screenshot</div>
                  <img 
                    src={`${API_BASE}${autoFillResult.screenshot_url}`} 
                    alt="Portal screenshot" 
                    className="w-full" 
                  />
                </div>
              )}
              
              {/* Fields Filled */}
              {autoFillResult.fields_filled?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">✅ Fields Filled</h4>
                  <div className="flex flex-wrap gap-2">
                    {autoFillResult.fields_filled.map((f: string, i: number) => (
                      <span key={i} className="text-xs bg-ashoka-green/10 text-ashoka-green px-2 py-1 rounded-md font-medium capitalize">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Fields Skipped */}
              {autoFillResult.fields_skipped?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">⚠️ Fields Skipped</h4>
                  <div className="flex flex-wrap gap-2">
                    {autoFillResult.fields_skipped.map((f: string, i: number) => (
                      <span key={i} className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md font-medium capitalize">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-border bg-muted/50">
              <p className="text-xs text-muted-foreground">Review the filled form before submitting manually.</p>
              <a 
                href={autoFillResult.manual_url || autoFillResult.portal_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Portal Manually
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchemeCard;
