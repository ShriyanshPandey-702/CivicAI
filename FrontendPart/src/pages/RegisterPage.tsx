import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  IndianRupee, 
  Users, 
  Briefcase, 
  ClipboardCheck, 
  ChevronRight, 
  ChevronLeft, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from "@/components/ui/table";
import TricolorStrip from '@/components/layout/TricolorStrip';
import AgentTracePanel from '@/components/agent/AgentTracePanel';
import { INDIAN_STATES } from '@/lib/constants';
import { submitProfile, connectSSE } from '@/lib/api';
import { useCitizen } from '@/lib/CitizenContext';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { CitizenProfile } from '@/lib/types';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Economic', icon: IndianRupee },
  { id: 3, title: 'Family', icon: Users },
  { id: 4, title: 'Occupation', icon: Briefcase },
  { id: 5, title: 'Review', icon: ClipboardCheck },
];

const RegisterPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCitizenId, setCitizenProfile, setSchemeCards } = useCitizen();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [showTrace, setShowTrace] = useState(false);
  
  const [formData, setFormData] = useState<CitizenProfile>({
    name: '',
    age: 0,
    gender: 'male',
    marital_status: 'single',
    state: '',
    preferred_language: 'English',
    income: 0,
    occupation: 'other',
    caste: 'general',
    ration_card_type: 'none',
    has_bank_account: false,
    has_disability: false,
    family_size: 1,
    land_acres: 0,
  });

  const updateField = (field: keyof CitizenProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleToggle = (field: keyof CitizenProfile) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setShowTrace(true);
    setTraceLogs([]);

    // Set up SSE listener
    // We don't have the citizen_id yet, but usually the backend returns it.
    // However, our SSE endpoint /api/stream/{citizen_id} needs a citizen_id.
    // In our main.py, submitProfile returns the citizen_id.
    
    try {
      const response = await submitProfile(formData);
      
      // Start listening to trace logs
      const cleanup = connectSSE(response.citizen_id, {
        onEvent: (event) => {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
          setTraceLogs(prev => [...prev, `[${timestamp}] ${event.agent}: ${event.message}`]);
        },
        onError: (err) => {
          console.error("SSE Error:", err);
          setError("Connection to agent stream lost.");
        }
      });

      // Give it some time to show the trace before redirecting
      setTimeout(() => {
        cleanup();
        setCitizenId(response.citizen_id);
        setCitizenProfile(formData);
        setSchemeCards(response.scheme_cards);
        toast.success("Profile registered successfully!");
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  };

  const renderStepIcon = (StepIcon: any, stepId: number) => {
    const isActive = currentStep === stepId;
    const isCompleted = currentStep > stepId;
    
    return (
      <div className={`flex flex-col items-center gap-1 relative z-10`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
          isActive ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : 
          isCompleted ? 'bg-ashoka-green border-ashoka-green text-white' : 
          'bg-background border-muted text-muted-foreground'
        }`}>
          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
        </div>
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {STEPS.find(s => s.id === stepId)?.title}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <TricolorStrip />
      
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/3 bg-primary relative flex-col justify-between p-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="relative z-10 space-y-6">
          <div 
            className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/')}
          >
            <img src="/logo.png" alt="SahayAI Logo" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold tracking-tight">SahayAI</h2>
            <p className="text-primary-foreground/70 font-medium mt-2">Empowering Citizens through AI</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Benefits, Guaranteed.</h3>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              Our AI agents search through 600+ government schemes to find the ones you are eligible for, with 95% accuracy.
            </p>
          </div>
          <div className="flex -space-x-3 overflow-hidden">
             {[1,2,3,4].map(i => (
               <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-primary bg-primary-foreground/20 flex items-center justify-center text-[10px]">
                 {i}k+
               </div>
             ))}
             <div className="flex items-center ml-4 text-xs font-medium text-primary-foreground/80">
               Joined by 10k+ citizens
             </div>
          </div>
        </div>
      </div>

      {/* Right panel - Scrollable Form */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 md:px-12">
          
          {/* Progress Header */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4 relative">
              <div className="absolute top-5 left-0 w-full h-0.5 bg-muted z-0" />
              <div 
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 z-0" 
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} 
              />
              {STEPS.map(step => (
                <div key={step.id}>{renderStepIcon(step.icon, step.id)}</div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showTrace ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Error Alert */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Step Content */}
                {currentStep === 1 && (
                  <Step1Personal formData={formData} updateField={updateField} />
                )}
                {currentStep === 2 && (
                  <Step2Economic formData={formData} updateField={updateField} onToggle={handleToggle} />
                )}
                {currentStep === 3 && (
                  <Step3Family formData={formData} updateField={updateField} onToggle={handleToggle} />
                )}
                {currentStep === 4 && (
                  <Step4Occupation formData={formData} updateField={updateField} onToggle={handleToggle} />
                )}
                {currentStep === 5 && (
                  <Step5Review formData={formData} loading={loading} />
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-8 border-t border-border mt-12">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1 || loading}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  
                  {currentStep < 5 ? (
                    <Button
                      onClick={nextStep}
                      disabled={loading}
                      className="btn-saffron gap-2"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="btn-saffron gap-2 px-8"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Find My Eligible Schemes
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4 py-8">
                  <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                  <h3 className="text-xl font-bold font-display">Running AI Analysis...</h3>
                  <p className="text-muted-foreground">Our agents are scouring 600+ schemes based on your profile.</p>
                </div>
                
                <AgentTracePanel logs={traceLogs} isRunning={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS FOR STEPS --- */

const Step1Personal = ({ formData, updateField }: any) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h2 className="text-2xl font-bold font-display">Personal Details</h2>
      <p className="text-muted-foreground">Let's start with your basic information.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={formData.name} 
          onChange={(e) => updateField('name', e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="e.g. Rahul Sharma"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input 
          id="age" 
          type="number" 
          min="1" 
          max="120"
          value={formData.age || ''} 
          onFocus={(e) => e.target.select()}
          onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={formData.gender} onValueChange={(val) => updateField('gender', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Marital Status</Label>
        <Select value={formData.marital_status} onValueChange={(val) => updateField('marital_status', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="married">Married</SelectItem>
            <SelectItem value="widowed">Widowed</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>State</Label>
        <Select value={formData.state} onValueChange={(val) => updateField('state', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {INDIAN_STATES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Preferred Language</Label>
        <Select value={formData.preferred_language} onValueChange={(val) => updateField('preferred_language', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali'].map(l => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

const Step2Economic = ({ formData, updateField, onToggle }: any) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h2 className="text-2xl font-bold font-display">Economic Details</h2>
      <p className="text-muted-foreground">Your financial profile helps us identify income-based schemes.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="income">Annual Income (₹)</Label>
        <Input 
          id="income" 
          type="number" 
          value={formData.income || ''} 
          onChange={(e) => updateField('income', parseInt(e.target.value) || 0)}
          placeholder="e.g. 150000"
        />
      </div>
      <div className="space-y-2">
        <Label>Occupation</Label>
        <Select value={formData.occupation} onValueChange={(val) => updateField('occupation', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Occupation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="farmer">Farmer</SelectItem>
            <SelectItem value="daily_wage">Daily Wage Worker</SelectItem>
            <SelectItem value="self_employed">Self Employed</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="unemployed">Unemployed</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Caste Category</Label>
        <Select value={formData.caste} onValueChange={(val) => updateField('caste', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Caste" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="obc">OBC</SelectItem>
            <SelectItem value="sc">SC (Scheduled Caste)</SelectItem>
            <SelectItem value="st">ST (Scheduled Tribe)</SelectItem>
            <SelectItem value="ews">EWS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Ration Card Type</Label>
        <Select value={formData.ration_card_type} onValueChange={(val) => updateField('ration_card_type', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Ration Card" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="bpl">BPL</SelectItem>
            <SelectItem value="aay">AAY (Antyodaya)</SelectItem>
            <SelectItem value="apl">APL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-col gap-3">
        <Label>Do you have a bank account?</Label>
        <div className="flex gap-2">
          {['Yes', 'No'].map(opt => (
            <Button
              key={opt}
              type="button"
              variant={formData.has_bank_account === (opt === 'Yes') ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => updateField('has_bank_account', opt === 'Yes')}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Do you have any disability?</Label>
        <div className="flex gap-2">
          {['Yes', 'No'].map(opt => (
            <Button
              key={opt}
              type="button"
              variant={formData.has_disability === (opt === 'Yes') ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => updateField('has_disability', opt === 'Yes')}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Step3Family = ({ formData, updateField }: any) => {
  const isFemaleMarried = formData.gender === 'female' && formData.marital_status === 'married';
  
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display">Family & Assets</h2>
        <p className="text-muted-foreground">More details about your household and assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="family_size">Family Size (Members)</Label>
          <Input 
            id="family_size" 
            type="number" 
            value={formData.family_size || ''} 
            onFocus={(e) => e.target.select()}
            onChange={(e) => updateField('family_size', parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="land_acres">Land Holdings (Acres)</Label>
          <Input 
            id="land_acres" 
            type="number" 
            step="0.1"
            value={formData.land_acres || 0} 
            onFocus={(e) => e.target.select()}
            onChange={(e) => updateField('land_acres', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* DISABILITY CONDITIONAL */}
      <AnimatePresence>
        {formData.has_disability && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-4"
          >
            <h3 className="font-semibold text-primary/80 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Disability Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disability Type</Label>
                <Select value={formData.disability_type} onValueChange={(val) => updateField('disability_type', val)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Visual', 'Hearing', 'Locomotor', 'Intellectual', 'Other'].map(t => (
                      <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Percentage</Label>
                <Select value={formData.disability_percentage} onValueChange={(val) => updateField('disability_percentage', val)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select %" />
                  </SelectTrigger>
                  <SelectContent>
                    {['40-60%', '61-80%', '81-100%'].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label>Do you have a disability certificate?</Label>
                <div className="flex gap-2">
                  {['Yes', 'No'].map(opt => (
                    <Button
                      key={opt}
                      size="sm"
                      variant={formData.disability_certificate === (opt === 'Yes') ? 'default' : 'outline'}
                      className="flex-1 bg-background text-foreground hover:bg-muted"
                      onClick={() => updateField('disability_certificate', opt === 'Yes')}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GENDER/MARITAL CONDITIONAL */}
      <AnimatePresence>
        {isFemaleMarried && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-pink-50 p-6 rounded-2xl border border-pink-100 space-y-4"
          >
            <h3 className="font-semibold text-pink-700 flex items-center gap-2">
              🌹 Additional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label>Do you have children?</Label>
                <div className="flex gap-2">
                  {['Yes', 'No'].map(opt => (
                    <Button
                      key={opt}
                      size="sm"
                      variant={formData.has_children === (opt === 'Yes') ? 'default' : 'outline'}
                      className="flex-1 bg-white text-pink-700 hover:bg-pink-100 border-pink-200"
                      onClick={() => updateField('has_children', opt === 'Yes')}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
              {formData.has_children && (
                <div className="space-y-2">
                  <Label>Age of youngest child</Label>
                  <Input 
                    type="number"
                    className="bg-white border-pink-200"
                    value={formData.youngest_child_age || ''}
                    onChange={(e) => updateField('youngest_child_age', parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Step4Occupation = ({ formData, updateField }: any) => {
  const occ = formData.occupation;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display">Occupation Details</h2>
        <p className="text-muted-foreground">Specific details about your work as a {occ.replace('_', ' ')}.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        {occ === 'farmer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Land Ownership</Label>
              <Select value={formData.land_ownership} onValueChange={(val) => updateField('land_ownership', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="owned">Owned</SelectItem>
                   <SelectItem value="leased">Leased</SelectItem>
                   <SelectItem value="sharecropper">Sharecropper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Crop Type</Label>
              <Select value={formData.crop_type} onValueChange={(val) => updateField('crop_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="kharif">Kharif</SelectItem>
                   <SelectItem value="rabi">Rabi</SelectItem>
                   <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Irrigation Type</Label>
              <Select value={formData.irrigation_type} onValueChange={(val) => updateField('irrigation_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="rainfed">Rainfed</SelectItem>
                   <SelectItem value="irrigated">Irrigated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Have Kisan Credit Card?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.kisan_credit_card === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('kisan_credit_card', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
             <div className="flex flex-col gap-3">
              <Label>Have Soil Health Card?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.soil_health_card === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('soil_health_card', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {occ === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Education Level</Label>
              <Select value={formData.education_level} onValueChange={(val) => updateField('education_level', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   {['Class 9-10', 'Class 11-12', 'Diploma', 'Undergraduate', 'Postgraduate'].map(e => <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 relative">
              <Label>Institution Type</Label>
              <Select value={formData.institution_type} onValueChange={(val) => updateField('institution_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="government">Government</SelectItem>
                   <SelectItem value="private_aided">Private Aided</SelectItem>
                   <SelectItem value="private_unaided">Private Unaided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 relative">
              <Label>Course Type</Label>
              <Select value={formData.course_type} onValueChange={(val) => updateField('course_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="full_time">Full-time</SelectItem>
                   <SelectItem value="part_time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2 relative">
              <Label>Day Scholar or Hosteller?</Label>
              <Select value={formData.hosteller} onValueChange={(val) => updateField('hosteller', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="day_scholar">Day Scholar</SelectItem>
                   <SelectItem value="hosteller">Hosteller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Received scholarship before?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.previous_scholarship === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('previous_scholarship', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {occ === 'daily_wage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Work Type</Label>
              <Select value={formData.work_type} onValueChange={(val) => updateField('work_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="construction">Construction</SelectItem>
                   <SelectItem value="domestic">Domestic Work</SelectItem>
                   <SelectItem value="agriculture">Agriculture</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Registered on E-Shram?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.eshram_registered === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('eshram_registered', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>EPFO Member?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.has_epfo === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('has_epfo', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {occ === 'self_employed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={formData.business_type} onValueChange={(val) => updateField('business_type', val)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="manufacturing">Manufacturing</SelectItem>
                   <SelectItem value="service">Service</SelectItem>
                   <SelectItem value="trade">Trade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Existing MUDRA Loan?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.existing_mudra_loan === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('existing_mudra_loan', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Udyam Registered?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.udyam_registered === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('udyam_registered', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {occ === 'unemployed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <Label>Registered as Job Seeker?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.job_seeker_registered === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('job_seeker_registered', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Seeking Skill Training?</Label>
              <div className="flex gap-2">
                {['Yes', 'No'].map(o => (
                  <Button key={o} variant={formData.seeking_skill_training === (o === 'Yes') ? 'default' : 'outline'} className="flex-1" onClick={() => updateField('seeking_skill_training', o === 'Yes')}>{o}</Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {occ === 'other' && (
          <div className="text-center py-8 text-muted-foreground italic">
            No extra fields required for this occupation.
          </div>
        )}
      </div>
    </div>
  );
};

const Step5Review = ({ formData }: any) => {
  const renderRow = (label: string, value: any) => (
    <TableRow key={label}>
      <TableCell className="font-medium text-muted-foreground w-1/3 py-2">{label}</TableCell>
      <TableCell className="py-2">{value === true ? 'Yes' : value === false ? 'No' : value || '—'}</TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display">Review & Submit</h2>
        <p className="text-muted-foreground">Please verify your details before finding schemes.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 bg-primary/5 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" /> Profile Summary
          </h3>
        </div>
        <Table>
          <TableBody>
            <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Personal Details</TableCell></TableRow>
            {renderRow('Full Name', formData.name)}
            {renderRow('Age', formData.age)}
            {renderRow('Gender', formData.gender)}
            {renderRow('State', formData.state)}
            
            <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Economic Details</TableCell></TableRow>
            {renderRow('Annual Income', `₹${formData.income.toLocaleString()}`)}
            {renderRow('Occupation', formData.occupation.replace('_', ' '))}
            {renderRow('Caste Category', formData.caste.toUpperCase())}
            {renderRow('Ration Card', formData.ration_card_type?.toUpperCase())}
            
            <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Occupation & Assets</TableCell></TableRow>
            {renderRow('Family Size', formData.family_size)}
            {renderRow('Land Area (Acres)', formData.land_acres)}
            
            {/* Conditional rows */}
            {formData.has_disability && (
              <>
                <TableRow className="bg-primary/5"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Disability Details</TableCell></TableRow>
                {renderRow('Type', formData.disability_type)}
                {renderRow('Percentage', formData.disability_percentage)}
              </>
            )}

            {formData.occupation === 'farmer' && (
               <>
                 <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Farmer Details</TableCell></TableRow>
                 {renderRow('Land Ownership', formData.land_ownership)}
                 {renderRow('Crop Type', formData.crop_type)}
                 {renderRow('Irrigation', formData.irrigation_type)}
               </>
            )}

            {formData.occupation === 'student' && (
               <>
                 <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Student Details</TableCell></TableRow>
                 {renderRow('Education', formData.education_level)}
                 {renderRow('Institution', formData.institution_type?.replace('_', ' '))}
                 {renderRow('Course', formData.course_type?.replace('_', ' '))}
               </>
            )}

            {formData.occupation === 'daily_wage' && (
               <>
                 <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Work Details</TableCell></TableRow>
                 {renderRow('Work Type', formData.work_type)}
                 {renderRow('E-Shram', formData.eshram_registered)}
                 {renderRow('EPFO', formData.has_epfo)}
               </>
            )}

            {formData.occupation === 'self_employed' && (
               <>
                 <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Business Details</TableCell></TableRow>
                 {renderRow('Business Type', formData.business_type)}
                 {renderRow('MUDRA Loan', formData.existing_mudra_loan)}
                 {renderRow('Udyam', formData.udyam_registered)}
               </>
            )}

            {formData.occupation === 'unemployed' && (
               <>
                 <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold py-1 px-4 text-[10px] uppercase tracking-wider">Unemployment Details</TableCell></TableRow>
                 {renderRow('Registered', formData.job_seeker_registered)}
                 {renderRow('Seeking Training', formData.seeking_skill_training)}
               </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RegisterPage;
