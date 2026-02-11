import { cn } from "@/lib/utils";
import type { TractionMilestone, MilestoneType } from "@/types";
import {
  Rocket,
  DollarSign,
  Handshake,
  Newspaper,
  Trophy,
  Users,
  Check,
  Circle,
} from "lucide-react";

interface ProjectMilestonesProps {
  milestones: TractionMilestone[];
}

const MILESTONE_ICONS: Record<MilestoneType, React.ElementType> = {
  testnet_launch: Rocket,
  mainnet_launch: Rocket,
  first_100_users: Users,
  first_1000_users: Users,
  first_10000_users: Users,
  funding_raised: DollarSign,
  partnership: Handshake,
  media_feature: Newspaper,
  award: Trophy,
  other: Circle,
};

const MILESTONE_LABELS: Record<MilestoneType, string> = {
  testnet_launch: "Testnet Launch",
  mainnet_launch: "Mainnet Launch",
  first_100_users: "100 Users",
  first_1000_users: "1K Users",
  first_10000_users: "10K Users",
  funding_raised: "Funding",
  partnership: "Partnership",
  media_feature: "Media",
  award: "Award",
  other: "Milestone",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ProjectMilestones({ milestones }: ProjectMilestonesProps) {
  if (milestones.length === 0) return null;

  const sorted = [...milestones].sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  return (
    <section className="rounded-xl border p-5 space-y-4">
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
        Milestones
      </h3>
      <div className="relative">
        {sorted.map((milestone, index) => {
          const Icon = MILESTONE_ICONS[milestone.milestoneType] || Circle;
          const isLast = index === sorted.length - 1;

          return (
            <div key={milestone.id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
              )}

              {/* Dot */}
              <div
                className={cn(
                  "relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full",
                  milestone.verified
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {milestone.verified ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {MILESTONE_LABELS[milestone.milestoneType]}
                  </span>
                  {milestone.verified && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <p className="text-sm font-medium mt-0.5">{milestone.title}</p>
                {milestone.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {milestone.description}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {formatDate(milestone.achievedAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
