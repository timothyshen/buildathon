/**
 * Status color and label utilities for consistent styling across the app
 * Color utilities are re-exported from @/lib/utils/colors for backward compatibility
 */

import type { Submission, Cohort } from "@/types";

// Re-export color utilities from centralized colors module
export {
  getSubmissionStatusColor,
  getCohortStatusColor,
  getReviewStatusColor,
  getSponsorTierColor,
  getWorkshopCategoryColor,
  getRoleBadgeColor,
  semanticColors,
} from "./colors";

/**
 * Get human-readable label for submission status
 */
export function getSubmissionStatusLabel(status: Submission["status"]): string {
  switch (status) {
    case "winner":
      return "Winner";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "accepted":
      return "Accepted";
    case "draft":
    default:
      return "Draft";
  }
}

/**
 * Get human-readable label for cohort status
 */
export function getCohortStatusLabel(status: Cohort["status"]): string {
  switch (status) {
    case "active":
      return "Live Now";
    case "upcoming":
      return "Coming Soon";
    case "judging":
      return "Judging";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}
