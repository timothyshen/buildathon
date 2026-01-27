/**
 * Prize Utilities for Explore Page
 *
 * Determines and displays prize information for submissions
 */

import type { Submission, Cohort, Track } from "@/types";

export type PrizeBadgeType = "grand-prize" | "runner-up" | "track-winner" | "honorable";

export interface PrizeInfo {
  type: PrizeBadgeType;
  label: string;
  source: "cohort" | "track" | "special";
}

/**
 * Prize badge styling configuration - uses theme tokens from colors.ts
 * Import prizeBadgeColors from @/lib/utils/colors for the actual colors
 */
export { prizeBadgeColors as prizeBadgeStyles } from "@/lib/utils/colors";

/**
 * Check if a submission is a winner
 */
export function isWinner(submission: Submission): boolean {
  return submission.status === "winner";
}

/**
 * Determine if this is likely a grand prize winner
 * In mock data, we assume winner status + first submission = grand prize
 * In production, this would be tracked explicitly
 */
function isGrandPrize(submission: Submission, cohort?: Cohort): boolean {
  if (submission.status !== "winner") return false;

  // Check if cohort has prizes and this could be 1st place
  // This is a heuristic - in production you'd have explicit prize tracking
  if (cohort?.prizes && cohort.prizes.length > 0) {
    const firstPrize = cohort.prizes[0];
    return firstPrize.place === "1st" || firstPrize.place === "First";
  }

  return true; // Default winners to grand prize if no cohort data
}

/**
 * Check if submission won a track prize
 */
function hasTrackPrize(submission: Submission, track?: Track): boolean {
  if (submission.status !== "winner") return false;
  if (!track?.prizePool) return false;

  // If there's a track with a prize pool and submission is a winner,
  // assume it won the track prize
  return true;
}

/**
 * Get prize information for a submission
 */
export function getSubmissionPrizes(
  submission: Submission,
  cohort?: Cohort,
  track?: Track
): PrizeInfo[] {
  const prizes: PrizeInfo[] = [];

  if (!isWinner(submission)) {
    return prizes;
  }

  // Check for grand prize (cohort-level winner)
  if (isGrandPrize(submission, cohort)) {
    prizes.push({
      type: "grand-prize",
      label: "Winner",
      source: "cohort",
    });
  }

  // Check for track prize
  if (hasTrackPrize(submission, track) && track) {
    // Only add track winner if not already grand prize, or if different
    if (!prizes.some(p => p.type === "grand-prize")) {
      prizes.push({
        type: "track-winner",
        label: `${track.name} Winner`,
        source: "track",
      });
    }
  }

  // If winner but no specific prize determined, add honorable mention
  if (prizes.length === 0 && submission.status === "winner") {
    prizes.push({
      type: "honorable",
      label: "Award Winner",
      source: "special",
    });
  }

  return prizes;
}

/**
 * Get a display label for a prize place
 */
export function getPrizePlaceLabel(place: string): string {
  const placeMap: Record<string, string> = {
    "1st": "1st Place",
    "2nd": "2nd Place",
    "3rd": "3rd Place",
    "First": "1st Place",
    "Second": "2nd Place",
    "Third": "3rd Place",
  };

  return placeMap[place] || place;
}

/**
 * Get the primary prize for display (most important one)
 */
export function getPrimaryPrize(prizes: PrizeInfo[]): PrizeInfo | null {
  if (prizes.length === 0) return null;

  // Priority: grand-prize > runner-up > track-winner > honorable
  const priority: PrizeBadgeType[] = ["grand-prize", "runner-up", "track-winner", "honorable"];

  for (const type of priority) {
    const prize = prizes.find(p => p.type === type);
    if (prize) return prize;
  }

  return prizes[0];
}

/**
 * Format prize amount for display (without showing actual amount)
 */
export function formatPrizeLabel(prize: PrizeInfo): string {
  return prize.label;
}
