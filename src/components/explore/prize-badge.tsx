import { Trophy, Medal, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { prizeBadgeColors } from "@/lib/utils/colors";
import type { PrizeBadgeType } from "@/lib/prize-utils";

interface PrizeBadgeProps {
  type: PrizeBadgeType;
  label?: string;
  size?: "sm" | "default";
  className?: string;
}

const prizeIcons: Record<PrizeBadgeType, typeof Trophy> = {
  "grand-prize": Trophy,
  "runner-up": Medal,
  "track-winner": Award,
  "honorable": Star,
};

const defaultLabels: Record<PrizeBadgeType, string> = {
  "grand-prize": "Winner",
  "runner-up": "Runner Up",
  "track-winner": "Track Winner",
  "honorable": "Honorable Mention",
};

export function PrizeBadge({
  type,
  label,
  size = "default",
  className,
}: PrizeBadgeProps) {
  const colors = prizeBadgeColors[type];
  const Icon = prizeIcons[type];
  const displayLabel = label || defaultLabels[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        colors.bg,
        colors.text,
        colors.border,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {displayLabel}
    </span>
  );
}
