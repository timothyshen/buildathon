/**
 * Status color utilities for consistent styling across the app
 */

import type { Submission, Cohort } from "@/types";

/**
 * Get CSS classes for submission status badges
 */
export function getSubmissionStatusColor(status: Submission["status"]): string {
  switch (status) {
    case "winner":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "under_review":
      return "bg-purple-100 text-purple-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get CSS classes for cohort status badges
 */
export function getCohortStatusColor(status: Cohort["status"]): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "judging":
      return "bg-purple-100 text-purple-800";
    case "completed":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

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
