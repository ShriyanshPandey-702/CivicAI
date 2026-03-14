import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import TricolorStrip from './TricolorStrip';

const LANGUAGES = [
  { code: 'en' as const, label: 'English' },
  { code: 'hi' as const, label: 'हिंदी' },
  { code: 'mr' as const, label: 'मराठी' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t } = useTranslation();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/schemes', label: t('nav.schemes') },
    { to: '/how-it-works', label: t('nav.how') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-[3px] left-0 right-0 z-40 bg-card border-b border-border" role="navigation">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="CivicAI Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold leading-tight text-foreground">CivicAI</span>
            <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">Government of India Initiative</span>
          </div>
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Lang + Theme + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              aria-label="Change language"
            >
              <Globe className="w-4 h-4" />
              <span>{LANGUAGES.find(l => l.code === lang)?.label}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${lang === l.code ? 'text-primary font-medium' : 'text-foreground'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/dashboard" className="btn-outline-blue text-sm !px-4 !py-2">
            {t('nav.dashboard')}
          </Link>
          <Link to="/register" className="btn-saffron text-sm !px-4 !py-2">
            {t('nav.getstarted')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t border-border">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-3 py-1 text-xs rounded ${lang === l.code ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-outline-blue text-sm !px-4 !py-2 flex-1 text-center">
              {t('nav.dashboard')}
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-saffron text-sm !px-4 !py-2 flex-1 text-center">
              {t('nav.getstarted')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
