import type { Cohort } from "@/types";

/**
 * Compute the effective cohort status from its dates.
 * The DB status field may be stale, so we derive from timeline dates.
 */
export function computeCohortStatus(cohort: Cohort): Cohort["status"] {
  const now = new Date();
  const start = new Date(cohort.startDate);
  const submissionDeadline = new Date(cohort.submissionDeadline);
  const judgingStart = new Date(cohort.judgingStart);
  const judgingEnd = new Date(cohort.judgingEnd);

  if (now < start) return "upcoming";
  if (now <= submissionDeadline) return "active";
  if (now < judgingEnd) return "judging";
  return "completed";
}
