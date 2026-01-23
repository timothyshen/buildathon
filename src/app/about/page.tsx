import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About - SWA.XYZ",
  description: "Learn about SWA.XYZ and the Story Foundation's vision for programmable IP.",
};

export default function AboutPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            About SWA.XYZ
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Transforming hackathons into IP creation pipelines
          </p>
        </div>

        {/* Story Foundation Section */}
        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Story Foundation</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Story Protocol is building the infrastructure for programmable IP.
              It enables creators to register, license, and monetize their intellectual
              property on-chain with transparent, enforceable terms.
            </p>
            <p>
              The Story Foundation supports the growth of the Story ecosystem by funding
              development, fostering community, and running programs like SWA.XYZ that
              bring builders into the world of programmable IP.
            </p>
          </div>
        </section>

        {/* IP Vision Section */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Our Vision for IP</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              Traditional hackathons produce amazing projects that often disappear after
              the event ends. The code lives in forgotten repositories, the ideas never
              get built upon, and the creators move on without capturing the value of
              their work.
            </p>
            <p>
              SWA.XYZ changes this by making IP registration a mandatory part of the
              submission process. Every project becomes a registered asset with clear
              ownership and licensing terms.
            </p>
            <p>
              This creates a virtuous cycle: builders can fork successful projects and
              build on top of them, original creators earn royalties when their work is
              used, and the ecosystem grows with each buildathon.
            </p>
          </div>
        </section>

        {/* How We're Different Section */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">How We&apos;re Different</h2>
          <div className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-6">
                <h3 className="font-semibold text-red-500">Traditional Hackathons</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Projects end when the event ends</li>
                  <li>No ownership verification</li>
                  <li>Code sits unused in repos</li>
                  <li>Builders start from scratch</li>
                </ul>
              </div>
              <div className="rounded-lg border border-primary/50 bg-primary/5 p-6">
                <h3 className="font-semibold text-primary">SWA.XYZ Buildathons</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Projects become permanent IP assets</li>
                  <li>On-chain ownership proof</li>
                  <li>Forkable templates for others</li>
                  <li>Royalties for original creators</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto mt-20 max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to Build?</h2>
          <p className="mt-4 text-muted-foreground">
            Join the waitlist to be notified when our next buildathon launches.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/#waitlist">
                Join Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
