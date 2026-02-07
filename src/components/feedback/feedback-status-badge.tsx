"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedbackStatus } from "@/types";

const statusConfig: Record<FeedbackStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  planned: { label: "Planned", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  declined: { label: "Declined", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus;
  className?: string;
}

export function FeedbackStatusBadge({ status, className }: FeedbackStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge className={cn("border-0 text-[11px] font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
