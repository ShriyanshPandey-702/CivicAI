import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const AIShowcase = () => (
  <section className="py-20 bg-secondary text-secondary-foreground">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-5"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold">Watch AI work in real time</h2>
          <p className="text-secondary-foreground/80 leading-relaxed">
            Our 7-agent pipeline processes your profile, verifies documents, discovers eligible schemes, checks deep eligibility criteria, and prepares application forms — all visible in a live trace panel.
          </p>
          <Link to="/register" className="btn-saffron inline-flex items-center gap-2">
            Try it free <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="terminal-window p-5 text-xs leading-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="w-3 h-3 rounded-full bg-ashoka-green" />
              <span className="ml-2 text-muted-foreground font-mono text-[10px]">AGENT TRACE</span>
            </div>
            <div className="space-y-1 font-mono">
              <div><span className="text-muted-foreground">[12:43:01]</span> ProfileAgent</div>
              <div className="pl-4">{`> State: Maharashtra`}</div>
              <div className="pl-4">{`> Category: OBC`}</div>
              <div className="pl-4">{`> Occupation: Farmer`}</div>
              <div className="pl-4">{`> Land: 3.2 acres`}</div>
              <div className="mt-2"><span className="text-muted-foreground">[12:43:03]</span> SchemeDiscovery</div>
              <div className="pl-4">{`> Querying scheme database...`}</div>
              <div className="pl-4">{`> Found 847 state schemes`}</div>
              <div className="pl-4">{`> Found 400 central schemes`}</div>
              <div className="pl-4">{`> ████████░░ 78% complete`}</div>
              <div className="mt-2">[LIVE] <span className="animate-blink">▌</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default AIShowcase;
