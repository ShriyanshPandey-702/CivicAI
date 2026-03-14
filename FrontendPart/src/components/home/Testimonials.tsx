import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Savita Devi',
    location: 'Nashik, Maharashtra',
    quote: 'CivicAI helped me find 5 schemes I never knew existed. I am now receiving PM-KISAN benefits directly in my bank account.',
    schemes: 'PM-KISAN + PMFBY',
  },
  {
    name: 'Rajesh Kumar',
    location: 'Varanasi, Uttar Pradesh',
    quote: 'The AI agent scanned all schemes in just 40 seconds and told me exactly which documents I needed. Very helpful!',
    schemes: 'PM-MUDRA + Skill India',
  },
  {
    name: 'Lakshmi Bai',
    location: 'Anantapur, Andhra Pradesh',
    quote: 'I am 65 years old and could not go to the office. CivicAI helped me apply for pension scheme from my phone.',
    schemes: 'IGNOAPS + Ayushman Bharat',
  },
];

const Testimonials = () => (
  <section className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">What citizens say</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            className="bg-background border border-border rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-display text-primary font-bold">
                {t.name[0]}
              </div>
              <div>
                <div className="font-body font-semibold text-sm text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.location}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.quote}"</p>
            <span className="inline-block bg-ashoka-green/10 text-ashoka-green text-xs px-3 py-1 rounded-full font-medium">
              {t.schemes}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
