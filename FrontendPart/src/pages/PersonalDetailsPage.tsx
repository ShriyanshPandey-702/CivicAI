import { User, ArrowRight, Edit, UserCheck, Banknote, Users, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';
import { useTranslation } from '@/hooks/useTranslation';

const CASTE_DISPLAY: Record<string, string> = {
  general: 'General',
  obc: 'OBC',
  sc: 'SC (Scheduled Caste)',
  st: 'ST (Scheduled Tribe)',
  ews: 'EWS',
};

const OCCUPATION_DISPLAY: Record<string, string> = {
  farmer: 'Farmer',
  daily_wage: 'Daily Wage Worker',
  self_employed: 'Self Employed',
  student: 'Student',
  unemployed: 'Unemployed',
  other: 'Other',
};

const RATION_DISPLAY: Record<string, string> = {
  none: 'None',
  bpl: 'BPL',
  aay: 'AAY (Antyodaya)',
  apl: 'APL',
};

const PersonalDetailsPage = () => {
  const { citizenProfile, citizenId } = useCitizen();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!citizenId || !citizenProfile) {
    return (
      <DashboardLayout>
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto mt-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">{t('dashboard.complete_profile')}</h2>
          <p className="text-muted-foreground mb-6">{t('dashboard.complete_profile_desc')}</p>
          <Link to="/register" className="btn-saffron inline-flex items-center gap-2 text-sm">
            {t('dashboard.create_profile')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const p = citizenProfile as any;

  // Map fields correctly from citizenProfile which uses the same keys as RegisterPage
  const sections = [
    {
      title: "Personal Information",
      icon: <UserCheck className="w-5 h-5 text-primary" />,
      fields: [
        { label: "Full Name", value: p.name },
        { label: "Age", value: p.age },
        { label: "Gender", value: p.gender ? String(p.gender).charAt(0).toUpperCase() + String(p.gender).slice(1) : undefined },
        { label: "Category", value: CASTE_DISPLAY[String(p.caste || "").toLowerCase()] || p.caste },
        { label: "Marital Status", value: p.marital_status ? String(p.marital_status).charAt(0).toUpperCase() + String(p.marital_status).slice(1) : undefined },
        { label: "State", value: p.state },
        { label: "Language", value: p.preferred_language },
      ]
    },
    {
      title: "Economic Status",
      icon: <Banknote className="w-5 h-5 text-ashoka-green" />,
      fields: [
        { label: "Annual Income", value: p.income != null ? `₹${parseInt(String(p.income || 0)).toLocaleString('en-IN')}` : undefined },
        { label: "Ration Card", value: RATION_DISPLAY[String(p.ration_card_type || "").toLowerCase()] || p.ration_card_type },
        { label: "Bank Account", value: p.has_bank_account === true ? 'Yes' : p.has_bank_account === false ? 'No' : undefined },
      ]
    },
    {
      title: "Family & Assets",
      icon: <Users className="w-5 h-5 text-saffron" />,
      fields: [
        { label: "Family Size", value: p.family_size },
        { label: "Land Holdings", value: p.land_acres != null ? `${p.land_acres} acres` : undefined },
        { label: "Has Disability", value: p.has_disability === true ? 'Yes' : p.has_disability === false ? 'No' : undefined },
      ]
    },
    {
      title: "Occupation",
      icon: <Briefcase className="w-5 h-5 text-india-blue" />,
      fields: [
        { label: "Primary Occupation", value: OCCUPATION_DISPLAY[String(p.occupation || "").toLowerCase()] || p.occupation },
        ...(p.occupation === 'farmer' ? [
          { label: "Land Ownership", value: p.land_ownership ? String(p.land_ownership).charAt(0).toUpperCase() + String(p.land_ownership).slice(1) : undefined },
          { label: "Crop Type", value: p.crop_type ? String(p.crop_type).charAt(0).toUpperCase() + String(p.crop_type).slice(1) : undefined },
          { label: "Kisan Credit Card", value: p.kisan_credit_card === true ? 'Yes' : p.kisan_credit_card === false ? 'No' : undefined },
        ] : []),
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Personal Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your profile information used for AI scheme matching.
          </p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="btn-outline-blue text-sm !px-4 !py-2 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4 border-b border-border pb-3">
              {section.icon} {section.title}
            </h3>
            <div className="space-y-3">
              {section.fields.map((field, fIdx) => (
                <div key={fIdx} className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">{field.label}</span>
                  <span className="text-sm font-medium text-foreground">
                    {field.value === undefined || field.value === null || field.value === "" || field.value === 0
                      ? "—"
                      : String(field.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {p.has_disability && (
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
           <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              Disability Details
           </h3>
           <div className="space-y-2">
             {p.disability_type && (
               <div className="flex justify-between items-center py-1">
                 <span className="text-sm text-muted-foreground">Type</span>
                 <span className="text-sm font-medium text-foreground capitalize">{p.disability_type}</span>
               </div>
             )}
             {p.disability_percentage && (
               <div className="flex justify-between items-center py-1">
                 <span className="text-sm text-muted-foreground">Percentage</span>
                 <span className="text-sm font-medium text-foreground">{p.disability_percentage}</span>
               </div>
             )}
             {p.disability_certificate != null && (
               <div className="flex justify-between items-center py-1">
                 <span className="text-sm text-muted-foreground">Certificate</span>
                 <span className="text-sm font-medium text-foreground">{p.disability_certificate ? 'Yes' : 'No'}</span>
               </div>
             )}
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PersonalDetailsPage;
