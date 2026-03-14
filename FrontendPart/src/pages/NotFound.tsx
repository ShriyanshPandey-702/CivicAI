import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import TricolorStrip from '@/components/layout/TricolorStrip';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TricolorStrip />
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated 404 */}
          <div className="relative mb-8">
            <span className="font-display text-[120px] md:text-[160px] font-bold text-muted/30 select-none leading-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The page <code className="bg-muted px-2 py-0.5 rounded text-sm text-foreground">{location.pathname}</code> doesn't exist. It might have been moved or removed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-saffron inline-flex items-center justify-center gap-2 text-sm">
              <Home className="w-4 h-4" /> Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline-blue inline-flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
