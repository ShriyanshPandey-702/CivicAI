import TricolorStrip from '@/components/layout/TricolorStrip';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SCHEME_CATEGORIES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wheat, GraduationCap, Heart, Home, Briefcase, Users, Accessibility, UserCheck, ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Wheat, GraduationCap, Heart, Home, Briefcase, Users, Accessibility, UserCheck,
};

const PublicSchemesPage = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filteredCats = query
    ? SCHEME_CATEGORIES.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : SCHEME_CATEGORIES;

  return (
    <div className="min-h-screen bg-background">
      <TricolorStrip />
      <Navbar />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero header */}
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              {t('nav.schemes')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('hero.subtext')}
            </p>

            {/* Search bar */}
            <div className="mt-6 max-w-md mx-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </motion.div>

          {/* Category grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredCats.map((cat, i) => {
              const Icon = iconMap[cat.icon];
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to="/register"
                    className="block bg-card border border-border rounded-xl p-6 text-center group hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                  >
                    {Icon && <Icon className="w-10 h-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />}
                    <div className="font-display text-3xl font-bold text-primary mb-1">{cat.count}</div>
                    <div className="text-sm font-medium text-foreground">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('dashboard.schemes_found')}</div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-12 bg-card border border-border rounded-2xl p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              {t('dashboard.complete_profile')}
            </h2>
            <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
              {t('dashboard.complete_profile_desc')}
            </p>
            <Link to="/register" className="btn-saffron inline-flex items-center gap-2">
              {t('hero.cta.primary')} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicSchemesPage;
