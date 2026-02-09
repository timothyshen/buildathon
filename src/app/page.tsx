import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "SWA.XYZ - Build the Future of Programmable IP",
  description: "Join SWA.XYZ buildathons to build innovative projects on Story Protocol. Collaborate, compete, and create.",
};

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
