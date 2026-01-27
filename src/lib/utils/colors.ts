/**
 * Centralized color utilities for consistent theming across the app
 * Uses CSS variables defined in globals.css
 */

import type { Submission, Cohort } from "@/types";
import type { PrizeBadgeType } from "@/lib/prize-utils";

/**
 * Status badge colors using theme tokens
 */
export function getSubmissionStatusColor(status: Submission["status"]): string {
  switch (status) {
    case "winner":
      return "bg-prize-grand text-prize-grand-foreground";
    case "submitted":
      return "bg-status-upcoming text-status-upcoming-foreground";
    case "under_review":
      return "bg-status-judging text-status-judging-foreground";
    case "accepted":
      return "bg-status-active text-status-active-foreground";
    case "draft":
    default:
      return "bg-status-draft text-status-draft-foreground";
  }
}

export function getCohortStatusColor(status: Cohort["status"]): string {
  switch (status) {
    case "active":
      return "bg-status-active text-status-active-foreground";
    case "upcoming":
      return "bg-status-upcoming text-status-upcoming-foreground";
    case "judging":
      return "bg-status-judging text-status-judging-foreground";
    case "completed":
      return "bg-status-completed text-status-completed-foreground";
    default:
      return "bg-status-draft text-status-draft-foreground";
  }
}

/**
 * Workshop status colors
 */
export function getWorkshopStatusColor(status: "draft" | "published" | "archived"): string {
  switch (status) {
    case "published":
      return "bg-status-active text-status-active-foreground";
    case "archived":
      return "bg-status-completed text-status-completed-foreground";
    case "draft":
    default:
      return "bg-status-draft text-status-draft-foreground";
  }
}

/**
 * Review status colors
 */
export function getReviewStatusColor(status: "pending" | "in_progress" | "completed"): string {
  switch (status) {
    case "pending":
      return "bg-status-pending text-status-pending-foreground";
    case "in_progress":
      return "bg-status-in-progress text-status-in-progress-foreground";
    case "completed":
      return "bg-status-completed text-status-completed-foreground";
    default:
      return "bg-status-draft text-status-draft-foreground";
  }
}

/**
 * Prize badge colors using theme tokens
 */
export const prizeBadgeColors: Record<
  PrizeBadgeType,
  { bg: string; text: string; border: string; line: string }
> = {
  "grand-prize": {
    bg: "bg-prize-grand",
    text: "text-prize-grand-foreground",
    border: "border-prize-grand-foreground/30",
    line: "bg-prize-grand-foreground",
  },
  "runner-up": {
    bg: "bg-prize-runner-up",
    text: "text-prize-runner-up-foreground",
    border: "border-prize-runner-up-foreground/30",
    line: "bg-prize-runner-up-foreground",
  },
  "track-winner": {
    bg: "bg-prize-track",
    text: "text-prize-track-foreground",
    border: "border-prize-track-foreground/30",
    line: "bg-prize-track-foreground",
  },
  "honorable": {
    bg: "bg-prize-honorable",
    text: "text-prize-honorable-foreground",
    border: "border-prize-honorable-foreground/30",
    line: "bg-prize-honorable-foreground",
  },
};

/**
 * Sponsor tier colors using theme tokens
 */
export function getSponsorTierColor(tier: "platinum" | "gold" | "silver" | string): string {
  switch (tier) {
    case "platinum":
      return "bg-tier-platinum text-tier-platinum-foreground";
    case "gold":
      return "bg-tier-gold text-tier-gold-foreground";
    case "silver":
      return "bg-tier-silver text-tier-silver-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Workshop category colors using theme tokens
 */
export function getWorkshopCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "technical":
    case "development":
    case "engineering":
      return "bg-category-technical text-category-technical-foreground";
    case "design":
    case "ux":
    case "ui":
      return "bg-category-design text-category-design-foreground";
    case "business":
    case "marketing":
    case "strategy":
      return "bg-category-business text-category-business-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Role badge colors - semantic colors for user roles
 */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-primary text-primary-foreground";
    case "sponsor":
    case "judge":
      return "bg-secondary text-secondary-foreground";
    case "participant":
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Success/Warning/Destructive semantic colors
 */
export const semanticColors = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  info: "bg-status-upcoming text-status-upcoming-foreground",
} as const;
