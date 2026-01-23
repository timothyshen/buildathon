import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { CTASection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <CTASection />
    </>
  );
}
