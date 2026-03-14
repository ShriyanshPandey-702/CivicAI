import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, Sun, Trash2, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
];

const SettingsPage = () => {
  const { citizenProfile, clearCitizen } = useCitizen();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang: language, setLang: setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  const handleClearData = () => {
    clearCitizen();
    toast.success("All local data cleared successfully");
    setIsClearDataModalOpen(false);
    navigate('/register');
  };

  const handleSignOut = async () => {
    await signOut();
    clearCitizen();
    navigate('/');
  };

  const renderLanguageOptions = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            setLanguage(lang.code as any);
            toast.success(`Language set to ${lang.label}`);
          }}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            language === lang.code
              ? 'border-primary bg-primary/5 text-primary font-medium shadow-sm'
              : 'border-border bg-card text-foreground hover:bg-muted'
          }`}
        >
          {lang.label}
          {language === lang.code && <CheckCircle className="w-4 h-4" />}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Display / Theme Settings */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Display & Theme</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === t.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                }`}
              >
                <t.icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Language Settings */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-2">Language Preference</h2>
          <p className="text-sm text-muted-foreground mb-4">Select your preferred language for the application.</p>
          {renderLanguageOptions()}
        </section>

        {/* Account Details */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Account</h2>
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Name</span>
                <span className="font-medium text-foreground">{citizenProfile?.name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">State</span>
                <span className="font-medium text-foreground">{citizenProfile?.state || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setIsClearDataModalOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <span className="block font-medium">Clear Dashboard Data</span>
                  <span className="text-xs opacity-80">Removes local profile and scheme data</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsSignoutModalOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* Clear Data Modal */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Clear Dashboard Data?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will remove your citizen profile and AI analysis results from this browser. You will need to re-register to see schemes again.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsClearDataModalOpen(false)} className="btn-outline-blue text-sm !py-2">Cancel</button>
              <button onClick={handleClearData} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm font-medium transition-colors">
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      {isSignoutModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Sign Out?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to sign out of SahayAI?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsSignoutModalOpen(false)} className="btn-outline-blue text-sm !py-2">Cancel</button>
              <button onClick={handleSignOut} className="btn-primary text-sm !py-2">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SettingsPage;
