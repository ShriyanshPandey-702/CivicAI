import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';
import { useTranslation } from '@/hooks/useTranslation';

const SchemeDetailsPage = () => {
  const { schemeId } = useParams<{ schemeId: string }>();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref');
  const { schemeCards, citizenProfile } = useCitizen();
  const { t } = useTranslation();

  const scheme = schemeCards.find(s => s.id === schemeId);
  const schemeName = scheme?.name || schemeId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Scheme';
  const benefit = scheme?.benefit_amount || 0;
  const benefitDesc = scheme?.benefit_description || '';

  return (
    <DashboardLayout>
      {/* Back link */}
      <Link to="/dashboard/agent" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to AI Agent
      </Link>

      {/* Status banner */}
      <div className="bg-ashoka-green/10 border border-ashoka-green/30 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-ashoka-green/20 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-ashoka-green" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              Application Submitted Successfully
            </h2>
            <p className="text-muted-foreground text-sm">
              Your application for <strong>{schemeName}</strong> has been generated and is ready for submission.
            </p>
            {refId && (
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Reference ID: </span>
                <span className="font-mono font-semibold text-primary">{refId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scheme info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Scheme Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheme</span>
              <span className="text-foreground font-medium text-right max-w-[60%]">{schemeName}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="text-foreground font-medium capitalize">{scheme?.category || 'General'}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Benefit Amount</span>
              <span className="text-foreground font-semibold">₹{benefit.toLocaleString('en-IN')}</span>
            </div>
            {benefitDesc && (
              <>
                <div className="border-t border-border" />
                <div>
                  <span className="text-muted-foreground block mb-1">Benefit Description</span>
                  <span className="text-foreground text-xs leading-relaxed">{benefitDesc}</span>
                </div>
              </>
            )}
            {scheme?.portal_url && (
              <>
                <div className="border-t border-border" />
                <a
                  href={scheme.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" /> Visit Official Portal
                </a>
              </>
            )}
          </div>
        </div>

        {/* Application status */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Application Status
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className="px-2.5 py-1 bg-ashoka-green/10 text-ashoka-green rounded-full text-xs font-semibold">
                PDF Generated
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applicant</span>
              <span className="text-foreground font-medium">{(citizenProfile?.name as string) || 'Citizen'}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applied On</span>
              <span className="text-foreground font-medium">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Next steps */}
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-primary mb-2">📋 Next Steps</p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Download and print the generated PDF application</li>
              <li>Attach required documents (Aadhaar, bank passbook, etc.)</li>
              <li>Visit your nearest Common Service Centre (CSC) or government office</li>
              <li>Submit the application with all documents</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <Link to="/dashboard/agent" className="btn-primary text-sm !px-5 !py-2.5">
          ← Back to AI Agent
        </Link>
        <Link to="/dashboard/schemes" className="btn-outline text-sm !px-5 !py-2.5 border border-border rounded-lg hover:bg-card transition-colors">
          View All Schemes
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default SchemeDetailsPage;
