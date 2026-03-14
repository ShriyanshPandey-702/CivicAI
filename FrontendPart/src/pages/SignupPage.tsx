import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import TricolorStrip from '@/components/layout/TricolorStrip';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully!");
      // Send user to complete their citizen profile
      navigate('/register');
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
            <h1 className="font-display text-3xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign up to find schemes you deserve</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring pr-10" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-saffron w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {loading ? "Creating..." : "Sign Up"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-secondary font-medium hover:underline">Log in</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Join 48 lakh+ citizens already using CivicAI
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
