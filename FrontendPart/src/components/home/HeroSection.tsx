import { motion } from 'framer-motion';
import { ArrowRight, Shield, FileText, Globe, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="lg:col-span-3 space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              🇮🇳 {t('hero.eyebrow')}
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight">
              {t('hero.headline')}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              {t('hero.subtext')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-saffron text-base flex items-center justify-center gap-2">
                {t('hero.cta.primary')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/schemes" className="btn-outline-blue text-base flex items-center justify-center">
                {t('hero.cta.secondary')}
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-ashoka-green" /> {t('hero.aadhaar')}</span>
              <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-india-blue" /> {t('hero.scheme_count')}</span>
              <span className="flex items-center gap-1"><Globe className="w-4 h-4 text-primary" /> {t('hero.languages')}</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-ashoka-green" /> {t('hero.beneficiaries')}</span>
            </div>
          </motion.div>

          {/* Right: Animated scheme card stack */}
          <motion.div
            className="lg:col-span-2 relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative w-full max-w-sm mx-auto">
              {/* Card 3 (back) */}
              <div className="card-scheme p-4 absolute top-6 left-4 right-[-8px] opacity-40 rotate-3">
                <div className="h-20" />
              </div>
              {/* Card 2 (mid) */}
              <div className="card-scheme p-4 absolute top-3 left-2 right-[-4px] opacity-60 rotate-1">
                <div className="h-20" />
              </div>
              {/* Card 1 (front) */}
              <div className="card-scheme p-5 relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs font-medium text-india-blue bg-india-blue/10 px-2 py-0.5 rounded">PM-KISAN-001</div>
                  <div className="text-xs text-ashoka-green font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {t('scheme.eligible')}
                  </div>
                </div>
                <h3 className="font-body font-semibold text-foreground mb-1">PM-KISAN Samman Nidhi</h3>
                <p className="text-xs text-muted-foreground mb-3">₹6,000/year · 3 installments</p>
                <div className="text-xs text-muted-foreground">Ministry of Agriculture & Farmers Welfare</div>
              </div>

              {/* Agent active pill */}
              <motion.div
                className="absolute -top-3 -right-3 z-20 bg-ashoka-green text-accent-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse-dot" />
                Agent Active
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
