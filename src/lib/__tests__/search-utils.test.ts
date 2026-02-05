/**
 * Section 11: Search and Filter Tests
 *
 * Tests for search-utils.ts:
 * - parseSearchQuery: symbol/prefix parsing, quoted strings
 * - buildSearchQuery: reconstruct from parsed
 * - matchesQuery: submission matching logic
 * - hasActiveFilters, getFilterCount, removeFilter
 * - getFilterTypeColor, getFilterTypeLabel
 */

import { describe, it, expect } from "vitest";
import {
  parseSearchQuery,
  buildSearchQuery,
  matchesQuery,
  hasActiveFilters,
  getFilterCount,
  removeFilter,
  getFilterTypeColor,
  getFilterTypeLabel,
  type ParsedQuery,
  type EnrichedSubmission,
} from "../search-utils";

// -- helpers --

function emptyQuery(): ParsedQuery {
  return { text: "", techs: [], cohorts: [], prizes: [], teams: [], tracks: [] };
}

function makeSubmission(overrides: Partial<EnrichedSubmission> = {}): EnrichedSubmission {
  return {
    id: "sub-1",
    cohortId: "cohort-1",
    createdBy: "user-1",
    title: "AI Chat Bot",
    tagline: "Conversational AI for everyone",
    description: "A chatbot using GPT models to help users",
    techStack: ["React", "TypeScript", "OpenAI"],
    builtWithStory: false,
    screenshots: [],
    status: "submitted",
    createdAt: new Date(),
    updatedAt: new Date(),
    prizes: [],
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 11.1  parseSearchQuery
// ──────────────────────────────────────────────

describe("parseSearchQuery", () => {
  it("returns empty result for empty string", () => {
    expect(parseSearchQuery("")).toEqual(emptyQuery());
    expect(parseSearchQuery("   ")).toEqual(emptyQuery());
  });

  it("parses plain text search", () => {
    const result = parseSearchQuery("hello world");
    expect(result.text).toBe("hello world");
    expect(result.techs).toEqual([]);
  });

  it("parses tech prefix (tech:react)", () => {
    const result = parseSearchQuery("tech:react");
    expect(result.techs).toEqual(["react"]);
    expect(result.text).toBe("");
  });

  it("parses tech symbol (@react)", () => {
    const result = parseSearchQuery("@react");
    expect(result.techs).toEqual(["react"]);
  });

  it("parses cohort prefix (cohort:web3)", () => {
    const result = parseSearchQuery("cohort:web3");
    expect(result.cohorts).toEqual(["web3"]);
  });

  it("parses cohort symbol (#web3)", () => {
    const result = parseSearchQuery("#web3");
    expect(result.cohorts).toEqual(["web3"]);
  });

  it("parses prize prefix (prize:winner)", () => {
    const result = parseSearchQuery("prize:winner");
    expect(result.prizes).toEqual(["winner"]);
  });

  it("parses prize symbol (!winner)", () => {
    const result = parseSearchQuery("!winner");
    expect(result.prizes).toEqual(["winner"]);
  });

  it("parses team prefix (team:alpha)", () => {
    const result = parseSearchQuery("team:alpha");
    expect(result.teams).toEqual(["alpha"]);
  });

  it("parses team symbol (~alpha)", () => {
    const result = parseSearchQuery("~alpha");
    expect(result.teams).toEqual(["alpha"]);
  });

  it("parses track prefix (track:defi)", () => {
    const result = parseSearchQuery("track:defi");
    expect(result.tracks).toEqual(["defi"]);
  });

  it("handles multiple filters combined", () => {
    const result = parseSearchQuery("@react #buildathon !winner game");
    expect(result.techs).toEqual(["react"]);
    expect(result.cohorts).toEqual(["buildathon"]);
    expect(result.prizes).toEqual(["winner"]);
    expect(result.text).toBe("game");
  });

  it("handles multiple values for same filter type", () => {
    const result = parseSearchQuery("@react @typescript @node");
    expect(result.techs).toEqual(["react", "typescript", "node"]);
  });

  it("handles quoted strings in filters", () => {
    const result = parseSearchQuery('tech:"machine learning"');
    expect(result.techs).toEqual(["machine learning"]);
  });

  it("handles case insensitivity in prefixes", () => {
    const result = parseSearchQuery("Tech:React COHORT:Web3");
    expect(result.techs).toEqual(["react"]);
    expect(result.cohorts).toEqual(["web3"]);
  });

  it("ignores empty filter values", () => {
    const result = parseSearchQuery("tech: cohort:");
    expect(result.techs).toEqual([]);
    expect(result.cohorts).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// 11.1  buildSearchQuery
// ──────────────────────────────────────────────

describe("buildSearchQuery", () => {
  it("builds empty string from empty query", () => {
    expect(buildSearchQuery(emptyQuery())).toBe("");
  });

  it("builds text-only query", () => {
    const q = { ...emptyQuery(), text: "hello world" };
    expect(buildSearchQuery(q)).toBe("hello world");
  });

  it("builds query with single tech filter", () => {
    const q = { ...emptyQuery(), techs: ["react"] };
    expect(buildSearchQuery(q)).toBe("tech:react");
  });

  it("builds query with multiple filter types", () => {
    const q = {
      ...emptyQuery(),
      techs: ["react"],
      cohorts: ["buildathon"],
      text: "game",
    };
    const result = buildSearchQuery(q);
    expect(result).toContain("tech:react");
    expect(result).toContain("cohort:buildathon");
    expect(result).toContain("game");
  });

  it("quotes values containing spaces", () => {
    const q = { ...emptyQuery(), techs: ["machine learning"] };
    expect(buildSearchQuery(q)).toBe('tech:"machine learning"');
  });

  it("is inverse of parseSearchQuery for simple queries", () => {
    const original = "tech:react cohort:web3 hello";
    const parsed = parseSearchQuery(original);
    const rebuilt = buildSearchQuery(parsed);
    const reParsed = parseSearchQuery(rebuilt);

    expect(reParsed.techs).toEqual(parsed.techs);
    expect(reParsed.cohorts).toEqual(parsed.cohorts);
    expect(reParsed.text).toEqual(parsed.text);
  });
});

// ──────────────────────────────────────────────
// 11.1  matchesQuery
// ──────────────────────────────────────────────

describe("matchesQuery", () => {
  it("matches everything with empty query", () => {
    const sub = makeSubmission();
    expect(matchesQuery(sub, emptyQuery())).toBe(true);
  });

  // --- text search ---

  it("matches text in title", () => {
    const sub = makeSubmission({ title: "AI Chat Bot" });
    const q = { ...emptyQuery(), text: "chat" };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("matches text in description", () => {
    const sub = makeSubmission({ description: "A chatbot using GPT models" });
    const q = { ...emptyQuery(), text: "gpt" };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("matches text in tagline", () => {
    const sub = makeSubmission({ tagline: "Conversational AI for everyone" });
    const q = { ...emptyQuery(), text: "conversational" };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("rejects when text matches nothing", () => {
    const sub = makeSubmission();
    const q = { ...emptyQuery(), text: "blockchain" };
    expect(matchesQuery(sub, q)).toBe(false);
  });

  it("text search is case insensitive", () => {
    const sub = makeSubmission({ title: "AI Chat Bot" });
    const q = { ...emptyQuery(), text: "AI CHAT" };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  // --- tech filter ---

  it("matches tech in stack", () => {
    const sub = makeSubmission({ techStack: ["React", "TypeScript", "OpenAI"] });
    const q = { ...emptyQuery(), techs: ["react"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("matches partial tech name", () => {
    const sub = makeSubmission({ techStack: ["TypeScript"] });
    const q = { ...emptyQuery(), techs: ["type"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("rejects when tech not in stack", () => {
    const sub = makeSubmission({ techStack: ["React"] });
    const q = { ...emptyQuery(), techs: ["python"] };
    expect(matchesQuery(sub, q)).toBe(false);
  });

  it("matches any of multiple techs (OR within techs)", () => {
    const sub = makeSubmission({ techStack: ["React"] });
    const q = { ...emptyQuery(), techs: ["python", "react"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  // --- cohort filter ---

  it("matches cohort by name", () => {
    const sub = makeSubmission({
      cohort: {
        id: "c1",
        slug: "web3-2024",
        name: "Web3 Buildathon 2024",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        submissionDeadline: new Date(),
        judgingStart: new Date(),
        judgingEnd: new Date(),
        status: "active",
        isPublic: true,
        maxTeamSize: 5,
      },
    });
    const q = { ...emptyQuery(), cohorts: ["web3"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("matches cohort by slug", () => {
    const sub = makeSubmission({
      cohort: {
        id: "c1",
        slug: "buildathon-jan",
        name: "January Buildathon",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        submissionDeadline: new Date(),
        judgingStart: new Date(),
        judgingEnd: new Date(),
        status: "active",
        isPublic: true,
        maxTeamSize: 5,
      },
    });
    const q = { ...emptyQuery(), cohorts: ["buildathon-jan"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("rejects when cohort doesn't match", () => {
    const sub = makeSubmission({ cohort: undefined });
    const q = { ...emptyQuery(), cohorts: ["web3"] };
    expect(matchesQuery(sub, q)).toBe(false);
  });

  // --- prize filter ---

  it("matches !winner when status is winner", () => {
    const sub = makeSubmission({
      status: "winner",
      prizes: [{ type: "grand-prize", label: "Winner", source: "cohort" }],
    });
    const q = { ...emptyQuery(), prizes: ["winner"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("rejects !winner when status is not winner", () => {
    const sub = makeSubmission({ status: "submitted", prizes: [] });
    const q = { ...emptyQuery(), prizes: ["winner"] };
    expect(matchesQuery(sub, q)).toBe(false);
  });

  it("matches prize by type", () => {
    const sub = makeSubmission({
      status: "winner",
      prizes: [{ type: "track-winner", label: "DeFi Track Winner", source: "track" }],
    });
    const q = { ...emptyQuery(), prizes: ["track"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  it("matches prize by label", () => {
    const sub = makeSubmission({
      status: "winner",
      prizes: [{ type: "grand-prize", label: "1st Place", source: "cohort" }],
    });
    const q = { ...emptyQuery(), prizes: ["1st"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  // --- team filter ---

  it("matches team by name", () => {
    const sub = makeSubmission({
      team: {
        id: "t1",
        cohortId: "c1",
        name: "Alpha Wolves",
        slug: "alpha-wolves",
        members: [],
      },
    });
    const q = { ...emptyQuery(), teams: ["alpha"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  // --- track filter ---

  it("matches track by name", () => {
    const sub = makeSubmission({
      track: {
        id: "tr1",
        cohortId: "c1",
        name: "DeFi Track",
        description: "Decentralized finance projects",
      },
    });
    const q = { ...emptyQuery(), tracks: ["defi"] };
    expect(matchesQuery(sub, q)).toBe(true);
  });

  // --- combined filters (AND logic) ---

  it("AND logic: text + tech must both match", () => {
    const sub = makeSubmission({
      title: "AI Chat Bot",
      techStack: ["React", "OpenAI"],
    });

    // Both match
    const q1 = { ...emptyQuery(), text: "chat", techs: ["react"] };
    expect(matchesQuery(sub, q1)).toBe(true);

    // Text matches but tech doesn't
    const q2 = { ...emptyQuery(), text: "chat", techs: ["python"] };
    expect(matchesQuery(sub, q2)).toBe(false);

    // Tech matches but text doesn't
    const q3 = { ...emptyQuery(), text: "blockchain", techs: ["react"] };
    expect(matchesQuery(sub, q3)).toBe(false);
  });

  it("AND logic across all filter types", () => {
    const sub = makeSubmission({
      title: "DeFi Dashboard",
      techStack: ["React"],
      status: "winner",
      prizes: [{ type: "grand-prize", label: "Winner", source: "cohort" }],
      cohort: {
        id: "c1",
        slug: "web3",
        name: "Web3 Cohort",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        submissionDeadline: new Date(),
        judgingStart: new Date(),
        judgingEnd: new Date(),
        status: "active",
        isPublic: true,
        maxTeamSize: 5,
      },
    });

    const q = {
      text: "dashboard",
      techs: ["react"],
      cohorts: ["web3"],
      prizes: ["winner"],
      teams: [],
      tracks: [],
    };
    expect(matchesQuery(sub, q)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 11.1  hasActiveFilters / getFilterCount
// ──────────────────────────────────────────────

describe("hasActiveFilters", () => {
  it("returns false for empty query", () => {
    expect(hasActiveFilters(emptyQuery())).toBe(false);
  });

  it("returns true when text present", () => {
    expect(hasActiveFilters({ ...emptyQuery(), text: "hello" })).toBe(true);
  });

  it("returns true when any filter array has values", () => {
    expect(hasActiveFilters({ ...emptyQuery(), techs: ["react"] })).toBe(true);
    expect(hasActiveFilters({ ...emptyQuery(), cohorts: ["web3"] })).toBe(true);
    expect(hasActiveFilters({ ...emptyQuery(), prizes: ["winner"] })).toBe(true);
    expect(hasActiveFilters({ ...emptyQuery(), teams: ["alpha"] })).toBe(true);
    expect(hasActiveFilters({ ...emptyQuery(), tracks: ["defi"] })).toBe(true);
  });
});

describe("getFilterCount", () => {
  it("returns 0 for empty query", () => {
    expect(getFilterCount(emptyQuery())).toBe(0);
  });

  it("counts text as 1", () => {
    expect(getFilterCount({ ...emptyQuery(), text: "hello" })).toBe(1);
  });

  it("counts each filter array element", () => {
    const q = {
      ...emptyQuery(),
      techs: ["react", "node"],
      cohorts: ["web3"],
      text: "game",
    };
    expect(getFilterCount(q)).toBe(4); // 2 techs + 1 cohort + 1 text
  });
});

// ──────────────────────────────────────────────
// 11.1  removeFilter
// ──────────────────────────────────────────────

describe("removeFilter", () => {
  it("removes text filter", () => {
    const q = { ...emptyQuery(), text: "hello" };
    const result = removeFilter(q, "text", "hello");
    expect(result.text).toBe("");
  });

  it("removes specific tech filter", () => {
    const q = { ...emptyQuery(), techs: ["react", "node"] };
    const result = removeFilter(q, "techs", "react");
    expect(result.techs).toEqual(["node"]);
  });

  it("removes specific cohort filter", () => {
    const q = { ...emptyQuery(), cohorts: ["web3", "ai"] };
    const result = removeFilter(q, "cohorts", "web3");
    expect(result.cohorts).toEqual(["ai"]);
  });

  it("does not mutate original query", () => {
    const q = { ...emptyQuery(), techs: ["react", "node"] };
    removeFilter(q, "techs", "react");
    expect(q.techs).toEqual(["react", "node"]);
  });
});

// ──────────────────────────────────────────────
// 11.1  getFilterTypeColor / getFilterTypeLabel
// ──────────────────────────────────────────────

describe("getFilterTypeColor", () => {
  it("returns blue for techs", () => {
    expect(getFilterTypeColor("techs")).toContain("blue");
  });

  it("returns green for cohorts", () => {
    expect(getFilterTypeColor("cohorts")).toContain("green");
  });

  it("returns yellow for prizes", () => {
    expect(getFilterTypeColor("prizes")).toContain("yellow");
  });

  it("returns purple for teams", () => {
    expect(getFilterTypeColor("teams")).toContain("purple");
  });

  it("returns orange for tracks", () => {
    expect(getFilterTypeColor("tracks")).toContain("orange");
  });

  it("returns gray for text", () => {
    expect(getFilterTypeColor("text")).toContain("gray");
  });
});

describe("getFilterTypeLabel", () => {
  it("returns readable labels", () => {
    expect(getFilterTypeLabel("techs")).toBe("tech");
    expect(getFilterTypeLabel("cohorts")).toBe("cohort");
    expect(getFilterTypeLabel("prizes")).toBe("prize");
    expect(getFilterTypeLabel("teams")).toBe("team");
    expect(getFilterTypeLabel("tracks")).toBe("track");
    expect(getFilterTypeLabel("text")).toBe("search");
  });
});
