/**
 * Advanced Search Utilities for Explore Page
 *
 * Supports prefix syntax (tech:react) and symbol shortcuts (@react)
 */

import type { Submission, Cohort, Track, Team } from "@/types";

export interface ParsedQuery {
  text: string;           // Plain text search terms
  techs: string[];        // tech: or @ filters
  cohorts: string[];      // cohort: or # filters
  prizes: string[];       // prize: or ! filters
  teams: string[];        // team: or ~ filters
  tracks: string[];       // track: filters
}

export interface EnrichedSubmission extends Submission {
  cohort?: Cohort;
  track?: Track;
  prizes: PrizeInfo[];
}

export interface PrizeInfo {
  type: "grand-prize" | "runner-up" | "track-winner" | "honorable";
  label: string;
}

// Symbol to prefix mapping
const SYMBOL_MAP: Record<string, string> = {
  "@": "tech:",
  "#": "cohort:",
  "!": "prize:",
  "~": "team:",
};

// All valid prefixes
const VALID_PREFIXES = ["tech:", "cohort:", "prize:", "team:", "track:"];

/**
 * Convert symbol shortcuts to prefix syntax
 * @example "@react" -> "tech:react"
 */
function normalizeSymbols(query: string): string {
  let normalized = query;

  for (const [symbol, prefix] of Object.entries(SYMBOL_MAP)) {
    // Match symbol followed by non-whitespace characters
    const regex = new RegExp(`${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\S+)`, "g");
    normalized = normalized.replace(regex, `${prefix}$1`);
  }

  return normalized;
}

/**
 * Parse a search query into structured filters
 * Supports both prefix (tech:react) and symbol (@react) syntax
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    text: "",
    techs: [],
    cohorts: [],
    prizes: [],
    teams: [],
    tracks: [],
  };

  if (!query.trim()) {
    return result;
  }

  // Normalize symbols to prefixes
  const normalized = normalizeSymbols(query);

  // Split by whitespace but preserve quoted strings
  const tokens = normalized.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  const textParts: string[] = [];

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();

    if (lowerToken.startsWith("tech:")) {
      const value = token.slice(5).replace(/^"|"$/g, "");
      if (value) result.techs.push(value.toLowerCase());
    } else if (lowerToken.startsWith("cohort:")) {
      const value = token.slice(7).replace(/^"|"$/g, "");
      if (value) result.cohorts.push(value.toLowerCase());
    } else if (lowerToken.startsWith("prize:")) {
      const value = token.slice(6).replace(/^"|"$/g, "");
      if (value) result.prizes.push(value.toLowerCase());
    } else if (lowerToken.startsWith("team:")) {
      const value = token.slice(5).replace(/^"|"$/g, "");
      if (value) result.teams.push(value.toLowerCase());
    } else if (lowerToken.startsWith("track:")) {
      const value = token.slice(6).replace(/^"|"$/g, "");
      if (value) result.tracks.push(value.toLowerCase());
    } else {
      // Plain text search term
      textParts.push(token.replace(/^"|"$/g, ""));
    }
  }

  result.text = textParts.join(" ").trim();

  return result;
}

/**
 * Build a search query string from parsed filters
 */
export function buildSearchQuery(parsed: ParsedQuery): string {
  const parts: string[] = [];

  for (const tech of parsed.techs) {
    parts.push(`tech:${tech.includes(" ") ? `"${tech}"` : tech}`);
  }
  for (const cohort of parsed.cohorts) {
    parts.push(`cohort:${cohort.includes(" ") ? `"${cohort}"` : cohort}`);
  }
  for (const prize of parsed.prizes) {
    parts.push(`prize:${prize.includes(" ") ? `"${prize}"` : prize}`);
  }
  for (const team of parsed.teams) {
    parts.push(`team:${team.includes(" ") ? `"${team}"` : team}`);
  }
  for (const track of parsed.tracks) {
    parts.push(`track:${track.includes(" ") ? `"${track}"` : track}`);
  }

  if (parsed.text) {
    parts.push(parsed.text);
  }

  return parts.join(" ");
}

/**
 * Check if a submission matches the parsed query
 */
export function matchesQuery(
  submission: EnrichedSubmission,
  query: ParsedQuery
): boolean {
  // Text search - matches title, description, or tagline
  if (query.text) {
    const searchText = query.text.toLowerCase();
    const titleMatch = submission.title.toLowerCase().includes(searchText);
    const descMatch = submission.description.toLowerCase().includes(searchText);
    const taglineMatch = submission.tagline?.toLowerCase().includes(searchText) || false;

    if (!titleMatch && !descMatch && !taglineMatch) {
      return false;
    }
  }

  // Tech filter - must match at least one tech in stack
  if (query.techs.length > 0) {
    const techStackLower = submission.techStack.map(t => t.toLowerCase());
    const hasMatchingTech = query.techs.some(tech =>
      techStackLower.some(t => t.includes(tech))
    );
    if (!hasMatchingTech) {
      return false;
    }
  }

  // Cohort filter - match cohort name
  if (query.cohorts.length > 0) {
    const cohortName = submission.cohort?.name?.toLowerCase() || "";
    const cohortSlug = submission.cohort?.slug?.toLowerCase() || "";
    const hasMatchingCohort = query.cohorts.some(c =>
      cohortName.includes(c) || cohortSlug.includes(c)
    );
    if (!hasMatchingCohort) {
      return false;
    }
  }

  // Prize filter - match prize type or winner status
  if (query.prizes.length > 0) {
    const isWinner = submission.status === "winner";
    const prizeTypes = submission.prizes.map(p => p.type.toLowerCase());
    const prizeLabels = submission.prizes.map(p => p.label.toLowerCase());

    const hasMatchingPrize = query.prizes.some(prize => {
      // Check for "winner" keyword
      if (prize === "winner" && isWinner) return true;
      // Check prize types
      if (prizeTypes.some(t => t.includes(prize))) return true;
      // Check prize labels (e.g., "1st", "first", "track")
      if (prizeLabels.some(l => l.includes(prize))) return true;
      return false;
    });

    if (!hasMatchingPrize) {
      return false;
    }
  }

  // Team filter - match team name
  if (query.teams.length > 0) {
    const teamName = submission.team?.name?.toLowerCase() || "";
    const hasMatchingTeam = query.teams.some(t => teamName.includes(t));
    if (!hasMatchingTeam) {
      return false;
    }
  }

  // Track filter - match track name
  if (query.tracks.length > 0) {
    const trackName = submission.track?.name?.toLowerCase() || "";
    const hasMatchingTrack = query.tracks.some(t => trackName.includes(t));
    if (!hasMatchingTrack) {
      return false;
    }
  }

  return true;
}

/**
 * Check if the parsed query has any active filters
 */
export function hasActiveFilters(query: ParsedQuery): boolean {
  return (
    query.text.length > 0 ||
    query.techs.length > 0 ||
    query.cohorts.length > 0 ||
    query.prizes.length > 0 ||
    query.teams.length > 0 ||
    query.tracks.length > 0
  );
}

/**
 * Get the total count of active filters
 */
export function getFilterCount(query: ParsedQuery): number {
  return (
    query.techs.length +
    query.cohorts.length +
    query.prizes.length +
    query.teams.length +
    query.tracks.length +
    (query.text ? 1 : 0)
  );
}

/**
 * Remove a specific filter from the parsed query
 */
export function removeFilter(
  query: ParsedQuery,
  type: keyof ParsedQuery,
  value: string
): ParsedQuery {
  const newQuery = { ...query };

  if (type === "text") {
    newQuery.text = "";
  } else {
    const array = newQuery[type] as string[];
    newQuery[type] = array.filter(v => v !== value) as never;
  }

  return newQuery;
}

/**
 * Get filter type color for UI display
 */
export function getFilterTypeColor(type: keyof ParsedQuery): string {
  switch (type) {
    case "techs":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "cohorts":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "prizes":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "teams":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "tracks":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "text":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get filter type label for UI display
 */
export function getFilterTypeLabel(type: keyof ParsedQuery): string {
  switch (type) {
    case "techs":
      return "tech";
    case "cohorts":
      return "cohort";
    case "prizes":
      return "prize";
    case "teams":
      return "team";
    case "tracks":
      return "track";
    case "text":
      return "search";
    default:
      return type;
  }
}
