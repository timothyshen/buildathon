import { Code, FileCheck, GitFork, Trophy } from "lucide-react";

const steps = [
  {
    icon: Code,
    title: "Build",
    description: "Join a buildathon and create your project using Story Protocol tools and templates.",
  },
  {
    icon: FileCheck,
    title: "Register",
    description: "Submit your project and register it as an IP asset on Story Protocol with programmable licensing.",
  },
  {
    icon: Trophy,
    title: "Win",
    description: "Get judged by experts, win prizes, and gain visibility in the Story ecosystem.",
  },
  {
    icon: GitFork,
    title: "Fork",
    description: "Your project becomes a forkable template. Others can build on your work and you earn royalties.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From hackathon to IP asset in four simple steps
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-border lg:block" />
                )}

                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <span className="mt-4 text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
