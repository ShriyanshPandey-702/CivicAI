import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wheat, GraduationCap, Heart, Home, Briefcase, Users, Accessibility, UserCheck } from 'lucide-react';
import { SCHEME_CATEGORIES } from '@/lib/constants';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Wheat, GraduationCap, Heart, Home, Briefcase, Users, Accessibility, UserCheck,
};

const SchemeCategories = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Browse by Category</h2>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SCHEME_CATEGORIES.map((cat, i) => {
          const Icon = iconMap[cat.icon];
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/schemes?category=${cat.id}`}
                className="block bg-card border border-border rounded-xl p-6 text-center group hover:bg-secondary hover:border-secondary transition-colors"
              >
                {Icon && <Icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:text-secondary-foreground transition-colors" />}
                <h3 className="font-body font-semibold text-foreground group-hover:text-secondary-foreground text-sm mb-1 transition-colors">{cat.label}</h3>
                <span className="text-xs text-muted-foreground group-hover:text-secondary-foreground/70 transition-colors">{cat.count} schemes</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Link to="/schemes" className="text-sm font-medium text-secondary hover:underline">
          View All Categories →
        </Link>
      </div>
    </div>
  </section>
);

export default SchemeCategories;
