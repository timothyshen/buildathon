"use client";

import { Trophy, Award, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { prizeBadgeColors } from "@/lib/utils/colors";
import type { PrizeBadgeType, PrizeInfo } from "@/lib/prize-utils";

// Prize badge icons and labels (colors come from centralized colors.ts)
const prizeBadgeIcons: Record<PrizeBadgeType, { Icon: typeof Trophy; label: string }> = {
  "grand-prize": { Icon: Trophy, label: "Winner" },
  "runner-up": { Icon: Medal, label: "Runner-up" },
  "track-winner": { Icon: Award, label: "Track" },
  "honorable": { Icon: Star, label: "Award" },
};

// Combined config for backward compatibility
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
    ...prizeBadgeIcons["grand-prize"],
    ...prizeBadgeColors["grand-prize"],
  },
  "runner-up": {
    ...prizeBadgeIcons["runner-up"],
    ...prizeBadgeColors["runner-up"],
  },
  "track-winner": {
    ...prizeBadgeIcons["track-winner"],
    ...prizeBadgeColors["track-winner"],
  },
  "honorable": {
    ...prizeBadgeIcons["honorable"],
    ...prizeBadgeColors["honorable"],
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
            "font-medium text-muted-foreground",
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
