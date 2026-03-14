import TricolorStrip from '@/components/layout/TricolorStrip';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, User, FileSearch, Search, CheckSquare, Layers, FileEdit, MessageSquare, Shield, Lock, Server } from 'lucide-react';

const agentSteps = [
  { icon: User, name: 'Profile Agent', desc: 'Parses citizen profile data including demographics, location, and occupation details.', time: '~2s' },
  { icon: FileSearch, name: 'Document Verifier', desc: 'Verifies uploaded documents and extracts key fields using AI-powered OCR.', time: '~3s' },
  { icon: Search, name: 'Scheme Discovery', desc: 'Scans 1,200+ schemes across 58 ministries and state databases.', time: '~4s' },
  { icon: CheckSquare, name: 'Eligibility Checker', desc: 'Checks basic eligibility criteria like income, age, and category.', time: '~3s' },
  { icon: Layers, name: 'Deep Eligibility', desc: 'Cross-references complex criteria for final eligibility determination.', time: '~3s' },
  { icon: FileEdit, name: 'Application Filler', desc: 'Pre-fills application forms using verified profile and document data.', time: '~2s' },
  { icon: MessageSquare, name: 'Narrator Agent', desc: 'Generates a personalized summary in your preferred language.', time: '~1s' },
];

const faqs = [
  { q: 'Is CivicAI free to use?', a: 'Yes, CivicAI is completely free for all Indian citizens.' },
  { q: 'Is my Aadhaar data safe?', a: 'Yes, we follow UIDAI guidelines and do not store biometric data. All data is encrypted.' },
  { q: 'How many schemes does CivicAI cover?', a: 'We cover 1,200+ central and state government welfare schemes across all categories.' },
  { q: 'Can I apply for schemes through CivicAI?', a: 'CivicAI helps you discover eligible schemes and pre-fills applications. Final submission happens on official portals.' },
  { q: 'Which languages are supported?', a: 'Currently English, Hindi, and Marathi. More languages coming soon.' },
  { q: 'How accurate is the AI matching?', a: 'Our 7-agent pipeline achieves 94% accuracy in eligibility matching.' },
];

const HowItWorksPage = () => (
  <div className="min-h-screen bg-background">
    <TricolorStrip />
    <Navbar />
    <main className="pt-28 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <motion.div className="text-center mb-16 max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">How CivicAI Works</h1>
          <p className="text-lg text-muted-foreground">Our 7-agent AI pipeline discovers, matches, and helps you apply for government welfare schemes — all in under 60 seconds.</p>
        </motion.div>

        {/* Agent steps */}
        <div className="max-w-3xl mx-auto space-y-6 mb-20">
          {agentSteps.map((step, i) => (
            <motion.div
              key={i}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-display font-bold">
                {i + 1}
              </div>
              <div className="bg-card border border-border rounded-xl p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <step.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-body font-semibold text-foreground">{step.name}</h3>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{step.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 mb-20 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">Your data stays safe</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Aadhaar-grade Security', desc: 'AES-256 encryption at rest and in transit' },
              { icon: Lock, title: 'No Data Selling', desc: 'We never share or sell your personal data' },
              { icon: Server, title: 'Indian Servers', desc: 'All data stored on servers within India' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-body font-semibold text-sm text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-card border border-border rounded-xl p-4 group">
                <summary className="font-body font-semibold text-sm text-foreground cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/register" className="btn-saffron inline-flex items-center gap-2 text-base">
            Try it now — it takes 2 minutes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default HowItWorksPage;
