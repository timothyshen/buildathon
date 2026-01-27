"use client";

import { Trophy, Award, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrizeBadgeType, PrizeInfo } from "@/lib/prize-utils";

// Prize badge configuration
const prizeBadgeConfig: Record<
  PrizeBadgeType,
  {
    Icon: typeof Trophy;
    bg: string;
    text: string;
    line: string;
    label: string;
  }
> = {
  "grand-prize": {
    Icon: Trophy,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    line: "bg-amber-500",
    label: "Winner",
  },
  "runner-up": {
    Icon: Medal,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    line: "bg-slate-400",
    label: "Runner-up",
  },
  "track-winner": {
    Icon: Award,
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    line: "bg-violet-500",
    label: "Track",
  },
  "honorable": {
    Icon: Star,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    line: "bg-blue-500",
    label: "Award",
  },
};

interface PrizeBadgeProps {
  prize: PrizeInfo;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function PrizeBadge({
  prize,
  size = "sm",
  showLabel = true,
  className,
}: PrizeBadgeProps) {
  const config = prizeBadgeConfig[prize.type];
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.bg,
        config.text,
        className
      )}
      title={prize.label}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {showLabel && config.label}
    </div>
  );
}

interface PrizeBadgesProps {
  prizes: PrizeInfo[];
  maxVisible?: number;
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
}

export function PrizeBadges({
  prizes,
  maxVisible = 3,
  size = "sm",
  showLabels = true,
  className,
}: PrizeBadgesProps) {
  if (!prizes || prizes.length === 0) return null;

  const visiblePrizes = prizes.slice(0, maxVisible);
  const remainingCount = prizes.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visiblePrizes.map((prize, index) => (
        <PrizeBadge
          key={index}
          prize={prize}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            "font-medium text-neutral-500 dark:text-neutral-400",
            size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
          )}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

// Export config for use in other components (like the card's top line)
export { prizeBadgeConfig };
export type { PrizeBadgeType };
