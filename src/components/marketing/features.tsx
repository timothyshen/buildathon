import {
  Shield,
  Coins,
  Users,
  Layers,
  Zap,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "IP Protection",
    description: "Every submission is registered on Story Protocol, giving you verifiable ownership of your creation.",
  },
  {
    icon: Coins,
    title: "Earn Royalties",
    description: "Set your licensing terms. When others fork and monetize your work, you earn a share.",
  },
  {
    icon: Users,
    title: "Expert Judging",
    description: "Get feedback from industry experts and Story ecosystem leaders who evaluate your work.",
  },
  {
    icon: Layers,
    title: "Forkable Templates",
    description: "Your project becomes a starting point for others. Skip the blank canvas problem.",
  },
  {
    icon: Zap,
    title: "Quick Start",
    description: "Use existing templates to jumpstart your buildathon project and focus on what makes it unique.",
  },
  {
    icon: Globe,
    title: "Story Ecosystem",
    description: "Join a growing community of builders creating the future of programmable IP.",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Build with SWA.XYZ?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            More than a hackathon platform — a launchpad for programmable IP
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
