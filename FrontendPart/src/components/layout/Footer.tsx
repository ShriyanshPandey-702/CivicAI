import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="CivicAI Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display text-lg font-bold">CivicAI</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-sm mb-3 uppercase tracking-wider opacity-50">{t('footer.quick_links')}</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.home')}</Link>
              <Link to="/schemes" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.schemes')}</Link>
              <Link to="/how-it-works" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.how')}</Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-body font-semibold text-sm mb-3 uppercase tracking-wider opacity-50">{t('footer.categories')}</h4>
            <div className="space-y-2">
              {['Agriculture', 'Education', 'Health', 'Housing', 'Employment'].map(c => (
                <Link key={c} to="/schemes" className="block text-sm opacity-70 hover:opacity-100 transition-opacity">{c}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold text-sm mb-3 uppercase tracking-wider opacity-50">{t('footer.contact')}</h4>
            <div className="space-y-2 text-sm opacity-70">
              <p>Helpline: 1800-XXX-XXXX</p>
              <p>Email: support@civicai.gov.in</p>
              <p>Grievance Officer: grievance@civicai.gov.in</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-50">{t('footer.copyright')}</p>
          <p className="text-xs opacity-40 max-w-md text-center md:text-right">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
