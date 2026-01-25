import { Trophy, Medal, Award, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { prizeBadgeStyles, type PrizeBadgeType } from "@/lib/prize-utils";

interface PrizeBadgeProps {
  type: PrizeBadgeType;
  label?: string;
  size?: "sm" | "default";
  className?: string;
}

const iconMap = {
  Trophy,
  Medal,
  Award,
  Star,
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
  const style = prizeBadgeStyles[type];
  const Icon = iconMap[style.icon as keyof typeof iconMap];
  const displayLabel = label || defaultLabels[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        style.bg,
        style.text,
        style.border,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {displayLabel}
    </span>
  );
}
