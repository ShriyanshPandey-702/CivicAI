import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const stats = [
  { value: '1,200+', key: 'stats.schemes' },
  { value: '₹2.4L Cr', key: 'stats.benefits' },
  { value: '48L+', key: 'stats.citizens' },
  { value: '7', key: 'stats.agents' },
];

const StatsBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-primary py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.key}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="stat-number text-primary-foreground">{stat.value}</div>
              <div className="text-primary-foreground/80 text-sm mt-1">{t(stat.key)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBanner;
