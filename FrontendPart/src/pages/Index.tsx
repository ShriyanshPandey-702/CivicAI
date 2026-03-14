import TricolorStrip from '@/components/layout/TricolorStrip';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import StatsBanner from '@/components/home/StatsBanner';
import HowItWorks from '@/components/home/HowItWorks';
import SchemeCategories from '@/components/home/SchemeCategories';
import Testimonials from '@/components/home/Testimonials';
import AIShowcase from '@/components/home/AIShowcase';
import ScrollToTop from '@/components/ui/ScrollToTop';

const Index = () => (
  <div className="min-h-screen bg-background">
    <TricolorStrip />
    <Navbar />
    <main>
      <HeroSection />
      <StatsBanner />
      <HowItWorks />
      <SchemeCategories />
      <Testimonials />
      <AIShowcase />
    </main>
    <Footer />
    <ScrollToTop />
  </div>
);

export default Index;
