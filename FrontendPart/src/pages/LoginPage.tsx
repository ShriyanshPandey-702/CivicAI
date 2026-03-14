import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import TricolorStrip from '@/components/layout/TricolorStrip';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

const LoginPage = () => {
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      <TricolorStrip />
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary relative flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center mx-auto shadow-lg overflow-hidden p-1">
            <img src="/logo.png" alt="CivicAI Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <h2 className="font-display text-3xl font-bold">CivicAI</h2>
          <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
            "CivicAI helped me find 5 schemes I never knew about. Now I receive PM-KISAN benefits directly."
          </p>
          <p className="text-primary-foreground/60 text-xs">— Savita Devi, Nashik, Maharashtra</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t('login.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('login.subtitle')}</p>
          </div>

          {/* Method toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setLoginMethod('mobile')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${loginMethod === 'mobile' ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground'}`}
            >
              Mobile + OTP
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${loginMethod === 'email' ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground'}`}
            >
              {t('login.email')}
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleEmailLogin}>
            {loginMethod === 'mobile' ? (
              <>
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-foreground mb-1">{t('register.mobile')}</label>
                  <div className="flex">
                    <span className="bg-muted border border-r-0 border-border rounded-l-md px-3 flex items-center text-sm text-muted-foreground">+91</span>
                    <input id="mobile" type="tel" placeholder="9876543210" className="flex-1 border border-border rounded-r-md px-3 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <button type="button" className="w-full btn-outline-blue text-sm !py-2.5" onClick={() => toast.error("Mobile login coming soon!")}>
                  Send OTP
                </button>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-1">Enter OTP</label>
                  <div className="flex gap-2">
                    {[...Array(6)].map((_, i) => (
                      <input key={i} type="text" maxLength={1} className="w-10 h-10 text-center border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">{t('login.email')}</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">{t('login.password')}</label>
                  <div className="relative">
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Link to="/forgot-password" className="text-xs text-secondary hover:underline mt-1 inline-block">{t('login.forgot')}</Link>
                </div>
                <button type="submit" disabled={loading} className="btn-saffron w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                  {loading ? t('login.signing_in') : t('login.signin')} <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {loginMethod === 'mobile' && (
              <button type="button" onClick={() => toast.error("Mobile login coming soon!")} className="btn-saffron w-full flex items-center justify-center gap-2 text-sm">
                {t('login.signin')} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('login.new_user')} <Link to="/signup" className="text-secondary font-medium hover:underline">{t('login.create_account')}</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {t('login.join')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
