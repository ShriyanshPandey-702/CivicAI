import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Filter, Bot, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchemeCard from '@/components/schemes/SchemeCard';
import { useCitizen } from '@/lib/CitizenContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { fastApply } from '@/lib/api';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Agriculture', 'Health', 'Education', 'Housing', 'Employment', 'Women', 'Finance'];

const SchemesPage = () => {
  const { schemeCards, citizenId, analysisComplete, analysisExpired, addAppliedScheme } = useCitizen();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

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

  const filtered = schemeCards.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeTab === 'All' || 
      (s as any).category?.toLowerCase().includes(activeTab.toLowerCase()) || 
      (s as any).department?.toLowerCase().includes(activeTab.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  if (!citizenId) {
    return (
      <DashboardLayout>
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto mt-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">{t('dashboard.complete_profile')}</h2>
          <p className="text-muted-foreground mb-4">{t('dashboard.complete_profile_desc')}</p>
          <Link to="/register" className="btn-saffron inline-flex items-center gap-2 text-sm">
            {t('dashboard.create_profile')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasSchemes) {
    return (
      <DashboardLayout>
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto mt-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {analysisExpired ? (
              <RefreshCw className="w-8 h-8 text-amber-500" />
            ) : (
              <Bot className="w-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            {analysisExpired ? 'Your previous analysis expired.' : 'Run AI Analysis First'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {analysisExpired
              ? 'Scheme data is no longer in memory. Click below to refresh your results.'
              : 'Discover your eligible government schemes by running the AI analysis agent.'}
          </p>
          <Link to="/dashboard/agent" className="btn-saffron inline-flex items-center gap-2 text-sm">
            Run AI Analysis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('dashboard.eligible_schemes')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {schemeCards.length} {t('dashboard.schemes_found')}
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 mb-6 gap-2 hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === cat 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((scheme) => (
          <SchemeCard 
            key={scheme.id} 
            scheme={scheme as any} 
            citizenId={citizenId ?? ''}
            onApply={(schemeId) => handleApply(citizenId!, schemeId, scheme)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12 border border-dashed border-border rounded-xl bg-card">
            <Filter className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-foreground">No schemes found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SchemesPage;
