"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedbackCategory } from "@/types";

const categoryConfig: Record<FeedbackCategory, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  feature_request: { label: "Feature Request", variant: "default" },
  bug_report: { label: "Bug Report", variant: "destructive" },
  improvement: { label: "Improvement", variant: "secondary" },
};

interface FeedbackCategoryBadgeProps {
  category: FeedbackCategory;
  className?: string;
}

export function FeedbackCategoryBadge({ category, className }: FeedbackCategoryBadgeProps) {
  const config = categoryConfig[category];
  return (
    <Badge variant={config.variant} className={cn("text-[11px] font-medium", className)}>
      {config.label}
    </Badge>
  );
}
