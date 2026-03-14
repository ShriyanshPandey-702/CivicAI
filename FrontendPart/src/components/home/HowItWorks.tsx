import { motion } from 'framer-motion';
import { UserCircle, Bot, CheckSquare } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      num: 1,
      icon: UserCircle,
      title: t('how.step1.title'),
      desc: t('how.step1.desc'),
      badge: t('how.step1.badge'),
    },
    {
      num: 2,
      icon: Bot,
      title: t('how.step2.title'),
      desc: t('how.step2.desc'),
      badge: t('how.step2.badge'),
    },
    {
      num: 3,
      icon: CheckSquare,
      title: t('how.step3.title'),
      desc: t('how.step3.desc'),
      badge: t('how.step3.badge'),
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t('how.title')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Dashed connector (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] border-t-2 border-dashed border-border" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-xl font-bold mx-auto mb-4 relative z-10">
                {step.num}
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <step.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-body font-semibold text-lg text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                <span className="inline-block bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">{step.badge}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
