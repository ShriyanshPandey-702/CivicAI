import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, FileText, CheckCircle, Clock, ArrowRight, Loader2, Upload, RefreshCw } from 'lucide-react';
import SchemeCard from '@/components/schemes/SchemeCard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { fastApply } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

const DashboardPage = () => {
  const {
    citizenId, citizenProfile, schemeCards, analysisComplete, analysisExpired,
    appliedSchemes, setCitizenId, addAppliedScheme
  } = useCitizen();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const hasSchemes = analysisComplete && schemeCards.length > 0;

  const handleApply = async (cid: string, schemeId: string, schemeData: any) => {
    try {
      const result = await fastApply(cid, schemeId, schemeData);
      const ref = result.reference_id || 'PENDING';
      toast.success(`Application generated! Ref: ${ref}`);

      addAppliedScheme({
        id: `app_${Date.now()}`,
        scheme_name: schemeData.name || result.scheme_name || 'Government Scheme',
        reference_id: ref,
        date: new Date().toISOString().split('T')[0],
        benefit_amount: schemeData.benefit_amount || result.benefit_amount || 0,
        status: 'Processing',
      });

      navigate('/dashboard/apply');
    } catch (e) {
      toast.error('Application generation failed');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !citizenId) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${citizenId}-${Math.random()}.${fileExt}`;
    const filePath = `${citizenId}/${fileName}`;
    
    const { error } = await supabase.storage.from('id_proofs').upload(filePath, file);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Document uploaded successfully!");
    }
    setUploading(false);
  };

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? 'dashboard.greeting.morning' : hour < 17 ? 'dashboard.greeting.afternoon' : 'dashboard.greeting.evening';
  const name = (citizenProfile?.name as string) || 'Citizen';

  useEffect(() => {
    if (user && !citizenId) {
      setCitizenId(user.id);
    }
  }, [user, citizenId, setCitizenId]);

  // Compute display values
  const totalBenefit = hasSchemes
    ? schemeCards.reduce((sum, s) => {
        const amt = typeof s.benefit_amount === 'number' ? s.benefit_amount : parseInt(String(s.benefit_amount)) || 0;
        return sum + amt;
      }, 0)
    : 0;

  const schemeCount = hasSchemes ? schemeCards.length : 0;
  const appliedCount = appliedSchemes.length;
  const pendingCount = appliedSchemes.filter(a => a.status !== 'Approved').length;

  const quickStats = [
    { label: t('dashboard.eligible_schemes'), value: String(schemeCount), icon: FileText, color: 'text-primary' },
    { label: t('dashboard.applied'), value: String(appliedCount), icon: CheckCircle, color: 'text-ashoka-green' },
    { label: t('dashboard.pending'), value: String(pendingCount), icon: Clock, color: 'text-warning' },
    { label: t('dashboard.total_benefits'), value: hasSchemes ? `₹${totalBenefit.toLocaleString('en-IN')}/yr` : '—', icon: Bot, color: 'text-india-blue' },
  ];

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mr-2" /> {t('dashboard.authenticating')}
        </div>
      </DashboardLayout>
    );
  }

  if (!citizenId || !citizenProfile || Object.keys(citizenProfile).length === 0) {
    return (
      <DashboardLayout>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">{t('dashboard.complete_profile')}</h2>
          <p className="text-muted-foreground mb-4">{t('dashboard.complete_profile_desc')}</p>
          <Link to="/register" className="btn-saffron inline-flex items-center gap-2 text-sm">
            {t('dashboard.create_profile')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {t(greetingKey)}, {name} 🙏
        </h1>
        <p className="text-muted-foreground mt-1">
          {hasSchemes ? (
            <>
              {t('dashboard.eligible_for')} <strong className="text-primary">{schemeCount} {t('dashboard.schemes')}</strong> {t('dashboard.worth')} <strong className="text-primary">₹{totalBenefit.toLocaleString('en-IN')}</strong> {t('dashboard.in_annual')}
            </>
          ) : (
            'Run AI Analysis to discover your eligible government schemes.'
          )}
        </p>
        <Link to="/dashboard/agent" className="btn-saffron mt-4 inline-flex items-center gap-2 text-sm">
          {t('dashboard.run_ai')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Analysis Expired Banner */}
      {analysisExpired && !hasSchemes && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              Your previous analysis expired.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Scheme data is no longer in memory. Click below to refresh your results.
            </p>
          </div>
          <Link to="/dashboard/agent" className="btn-saffron text-sm !px-4 !py-2 flex items-center gap-2 shrink-0">
            Run AI Analysis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickStats.map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recommended Schemes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">{t('dashboard.recommended')}</h2>
          {hasSchemes && (
            <Link to="/dashboard/schemes" className="text-sm text-secondary hover:underline">{t('dashboard.view_all')} {schemeCount} →</Link>
          )}
        </div>
        {hasSchemes ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schemeCards.slice(0, 3).map(scheme => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme as any}
                citizenId={citizenId ?? ''}
                onApply={(schemeId) => handleApply(citizenId!, schemeId, scheme)}
              />
            ))}
          </div>
        ) : (
          <div className="col-span-3 text-center text-muted-foreground py-10 border border-dashed border-border rounded-xl bg-card">
            <Bot className="w-10 h-10 mx-auto mb-3 text-primary/40" />
            <p className="font-body font-medium text-foreground mb-1">No schemes discovered yet</p>
            <p className="text-sm">Click <Link to="/dashboard/agent" className="text-primary underline">Run AI Analysis</Link> to discover schemes you're eligible for.</p>
          </div>
        )}
      </div>

      {/* Document Vault */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">{t('dashboard.doc_vault')}</h2>
          <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded-md">100% Secure</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t('dashboard.doc_vault_desc')}</p>
        
        <div className="flex items-center gap-4">
            <label className="btn-outline-blue cursor-pointer inline-flex items-center gap-2 text-sm disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? t('dashboard.uploading') : t('dashboard.upload_id')}
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
