import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import LiveMarketsSection from '@/components/landing/LiveMarketsSection';
import TechStackSection from '@/components/landing/TechStackSection';
import ArchitectureSection from '@/components/landing/ArchitectureSection';
import PrivacySection from '@/components/landing/PrivacySection';
import EclipseSection from '@/components/landing/EclipseSection';
import CTASection from '@/components/landing/CTASection';

export default function Landing() {
  return (
    <div>
      <HeroSection />
      <LiveMarketsSection />
      <FeaturesSection />
      <EclipseSection />
      <HowItWorksSection />
      <PrivacySection />
      <ArchitectureSection />
      <ComparisonSection />
      <TechStackSection />
      <CTASection />
    </div>
  );
}

