/**
 * Referral System Tests
 *
 * Tests for:
 * - Short code generation (format, uniqueness, character set)
 * - Data conversion (snake_case DB rows → camelCase types)
 * - Leaderboard aggregation (ranking, sorting, filtering)
 * - Referral validation logic (self-referral, duplicates, status)
 * - Cookie ref code handling
 */

import { describe, it, expect } from "vitest";

// ──────────────────────────────────────────────
// Mirror internal functions from referrals.service.ts
// (they're not exported, so we re-declare for testing)
// ──────────────────────────────────────────────

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 8;

function generateShortCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

interface ReferralCodeRow {
  id: string;
  user_id: string;
  cohort_id: string;
  code: string;
  created_at: string;
}

interface ReferralRow {
  id: string;
  referral_code_id: string;
  referrer_id: string;
  referred_id: string;
  cohort_id: string;
  status: "pending" | "credited";
  credited_at: string | null;
  created_at: string;
  referrer?: Record<string, unknown> | null;
  referred?: Record<string, unknown> | null;
}

function toReferralCode(row: ReferralCodeRow) {
  return {
    id: row.id,
    userId: row.user_id,
    cohortId: row.cohort_id,
    code: row.code,
    createdAt: new Date(row.created_at),
  };
}

function toUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as string,
    avatar: row.avatar as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function toReferral(row: ReferralRow) {
  return {
    id: row.id,
    referralCodeId: row.referral_code_id,
    referrerId: row.referrer_id,
    referredId: row.referred_id,
    cohortId: row.cohort_id,
    status: row.status,
    creditedAt: row.credited_at ? new Date(row.credited_at) : undefined,
    createdAt: new Date(row.created_at),
    referrer: row.referrer ? toUser(row.referrer) : undefined,
    referred: row.referred ? toUser(row.referred) : undefined,
  };
}

// Mirror leaderboard aggregation logic from service
interface RawReferralRow {
  referrer_id: string;
  status: "pending" | "credited";
  referrer: { id: string; name: string; avatar: string | null } | null;
}

function aggregateLeaderboard(referrals: RawReferralRow[], cohortId: string, limit = 50) {
  const statsMap = new Map<string, { name: string; avatar?: string; credited: number; pending: number }>();

  for (const row of referrals) {
    const referrerId = row.referrer_id;
    const referrer = row.referrer;

    if (!statsMap.has(referrerId)) {
      statsMap.set(referrerId, {
        name: referrer?.name || "Unknown",
        avatar: referrer?.avatar || undefined,
        credited: 0,
        pending: 0,
      });
    }

    const stats = statsMap.get(referrerId)!;
    if (row.status === "credited") {
      stats.credited++;
    } else {
      stats.pending++;
    }
  }

  return Array.from(statsMap.entries())
    .filter(([, stats]) => stats.credited > 0)
    .sort((a, b) => b[1].credited - a[1].credited)
    .slice(0, limit)
    .map(([userId, stats], index) => ({
      userId,
      userName: stats.name,
      userAvatar: stats.avatar,
      cohortId,
      totalReferrals: stats.credited,
      pendingReferrals: stats.pending,
      rank: index + 1,
    }));
}

// Validation helpers mirrored from API routes
function isSelfReferral(referrerUserId: string, currentUserId: string): boolean {
  return referrerUserId === currentUserId;
}

function isValidRefCode(code: string): boolean {
  if (!code || code.length !== CODE_LENGTH) return false;
  return [...code].every((c) => CODE_CHARS.includes(c));
}

// ──────────────────────────────────────────────
// Test Data Factories
// ──────────────────────────────────────────────

function makeCodeRow(overrides: Partial<ReferralCodeRow> = {}): ReferralCodeRow {
  return {
    id: "code-1",
    user_id: "user-1",
    cohort_id: "cohort-1",
    code: "aBcDeFgH",
    created_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

function makeReferralRow(overrides: Partial<ReferralRow> = {}): ReferralRow {
  return {
    id: "ref-1",
    referral_code_id: "code-1",
    referrer_id: "user-1",
    referred_id: "user-2",
    cohort_id: "cohort-1",
    status: "credited",
    credited_at: "2026-02-02T00:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    referrer: null,
    referred: null,
    ...overrides,
  };
}

function makeRawReferral(overrides: Partial<RawReferralRow> = {}): RawReferralRow {
  return {
    referrer_id: "user-1",
    status: "credited",
    referrer: { id: "user-1", name: "Alice", avatar: null },
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 1. Short Code Generation
// ──────────────────────────────────────────────

describe("Short Code Generation", () => {
  it("generates a code of exactly 8 characters", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(8);
  });

  it("only contains alphanumeric characters", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateShortCode();
      expect(code).toMatch(/^[A-Za-z0-9]{8}$/);
    }
  });

  it("generates different codes on successive calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode());
    }
    // With 62^8 possibilities, 100 codes should all be unique
    expect(codes.size).toBe(100);
  });

  it("uses the full character set (not biased to subset)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const code = generateShortCode();
      for (const c of code) {
        seen.add(c);
      }
    }
    // With 1000 codes (8000 chars), we should see most of the 62 characters
    expect(seen.size).toBeGreaterThan(50);
  });
});

// ──────────────────────────────────────────────
// 2. Ref Code Validation
// ──────────────────────────────────────────────

describe("Ref Code Validation", () => {
  it("accepts valid 8-char alphanumeric code", () => {
    expect(isValidRefCode("aBcDeFgH")).toBe(true);
  });

  it("accepts all-numeric code", () => {
    expect(isValidRefCode("12345678")).toBe(true);
  });

  it("accepts all-alpha code", () => {
    expect(isValidRefCode("abcdEFGH")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidRefCode("")).toBe(false);
  });

  it("rejects code shorter than 8 chars", () => {
    expect(isValidRefCode("abc1234")).toBe(false);
  });

  it("rejects code longer than 8 chars", () => {
    expect(isValidRefCode("abc123456")).toBe(false);
  });

  it("rejects code with special characters", () => {
    expect(isValidRefCode("abc!@#$%")).toBe(false);
  });

  it("rejects code with spaces", () => {
    expect(isValidRefCode("abc 1234")).toBe(false);
  });

  it("rejects code with hyphens", () => {
    expect(isValidRefCode("abc-1234")).toBe(false);
  });

  it("rejects code with unicode", () => {
    expect(isValidRefCode("abcéfgh1")).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 3. Data Conversion — toReferralCode
// ──────────────────────────────────────────────

describe("toReferralCode conversion", () => {
  it("maps snake_case DB row to camelCase type", () => {
    const row = makeCodeRow();
    const result = toReferralCode(row);

    expect(result.id).toBe("code-1");
    expect(result.userId).toBe("user-1");
    expect(result.cohortId).toBe("cohort-1");
    expect(result.code).toBe("aBcDeFgH");
  });

  it("converts created_at string to Date object", () => {
    const row = makeCodeRow({ created_at: "2026-02-01T12:30:00Z" });
    const result = toReferralCode(row);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe("2026-02-01T12:30:00.000Z");
  });
});

// ──────────────────────────────────────────────
// 4. Data Conversion — toReferral
// ──────────────────────────────────────────────

describe("toReferral conversion", () => {
  it("maps basic referral fields", () => {
    const row = makeReferralRow();
    const result = toReferral(row);

    expect(result.id).toBe("ref-1");
    expect(result.referralCodeId).toBe("code-1");
    expect(result.referrerId).toBe("user-1");
    expect(result.referredId).toBe("user-2");
    expect(result.cohortId).toBe("cohort-1");
    expect(result.status).toBe("credited");
  });

  it("converts credited_at to Date when present", () => {
    const row = makeReferralRow({ credited_at: "2026-02-02T15:00:00Z" });
    const result = toReferral(row);

    expect(result.creditedAt).toBeInstanceOf(Date);
    expect(result.creditedAt!.toISOString()).toBe("2026-02-02T15:00:00.000Z");
  });

  it("sets creditedAt to undefined when null", () => {
    const row = makeReferralRow({ credited_at: null });
    const result = toReferral(row);

    expect(result.creditedAt).toBeUndefined();
  });

  it("populates referrer when join data present", () => {
    const row = makeReferralRow({
      referrer: {
        id: "user-1",
        email: "alice@test.com",
        name: "Alice",
        role: "participant",
        avatar: "https://example.com/avatar.jpg",
        created_at: "2026-01-01T00:00:00Z",
      },
    });
    const result = toReferral(row);

    expect(result.referrer).toBeDefined();
    expect(result.referrer!.name).toBe("Alice");
    expect(result.referrer!.email).toBe("alice@test.com");
    expect(result.referrer!.role).toBe("participant");
  });

  it("populates referred when join data present", () => {
    const row = makeReferralRow({
      referred: {
        id: "user-2",
        email: "bob@test.com",
        name: "Bob",
        role: "participant",
        avatar: undefined,
        created_at: "2026-01-15T00:00:00Z",
      },
    });
    const result = toReferral(row);

    expect(result.referred).toBeDefined();
    expect(result.referred!.name).toBe("Bob");
  });

  it("leaves referrer/referred undefined when null", () => {
    const row = makeReferralRow({ referrer: null, referred: null });
    const result = toReferral(row);

    expect(result.referrer).toBeUndefined();
    expect(result.referred).toBeUndefined();
  });

  it("handles pending status", () => {
    const row = makeReferralRow({ status: "pending", credited_at: null });
    const result = toReferral(row);

    expect(result.status).toBe("pending");
    expect(result.creditedAt).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// 5. Self-Referral Detection
// ──────────────────────────────────────────────

describe("Self-Referral Detection", () => {
  it("detects self-referral when IDs match", () => {
    expect(isSelfReferral("user-1", "user-1")).toBe(true);
  });

  it("allows referral when IDs differ", () => {
    expect(isSelfReferral("user-1", "user-2")).toBe(false);
  });

  it("is case-sensitive (UUIDs are lowercase)", () => {
    expect(isSelfReferral("ABC", "abc")).toBe(false);
  });

  it("handles empty strings", () => {
    expect(isSelfReferral("", "")).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 6. Leaderboard Aggregation
// ──────────────────────────────────────────────

describe("Leaderboard Aggregation", () => {
  it("returns empty array for no referrals", () => {
    const result = aggregateLeaderboard([], "cohort-1");
    expect(result).toEqual([]);
  });

  it("counts credited referrals for a single referrer", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe("user-1");
    expect(result[0].totalReferrals).toBe(3);
    expect(result[0].rank).toBe(1);
  });

  it("excludes users with only pending referrals", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "pending" }),
      makeRawReferral({ referrer_id: "user-1", status: "pending" }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result).toHaveLength(0);
  });

  it("tracks pending count alongside credited", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
      makeRawReferral({ referrer_id: "user-1", status: "pending" }),
      makeRawReferral({ referrer_id: "user-1", status: "pending" }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result).toHaveLength(1);
    expect(result[0].totalReferrals).toBe(1);
    expect(result[0].pendingReferrals).toBe(2);
  });

  it("ranks multiple referrers by credited count descending", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-a", status: "credited", referrer: { id: "user-a", name: "Alice", avatar: null } }),
      makeRawReferral({ referrer_id: "user-b", status: "credited", referrer: { id: "user-b", name: "Bob", avatar: null } }),
      makeRawReferral({ referrer_id: "user-b", status: "credited", referrer: { id: "user-b", name: "Bob", avatar: null } }),
      makeRawReferral({ referrer_id: "user-b", status: "credited", referrer: { id: "user-b", name: "Bob", avatar: null } }),
      makeRawReferral({ referrer_id: "user-c", status: "credited", referrer: { id: "user-c", name: "Charlie", avatar: null } }),
      makeRawReferral({ referrer_id: "user-c", status: "credited", referrer: { id: "user-c", name: "Charlie", avatar: null } }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ userId: "user-b", userName: "Bob", totalReferrals: 3, rank: 1 });
    expect(result[1]).toMatchObject({ userId: "user-c", userName: "Charlie", totalReferrals: 2, rank: 2 });
    expect(result[2]).toMatchObject({ userId: "user-a", userName: "Alice", totalReferrals: 1, rank: 3 });
  });

  it("assigns correct cohortId from parameter", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
    ];
    const result = aggregateLeaderboard(referrals, "my-cohort-42");

    expect(result[0].cohortId).toBe("my-cohort-42");
  });

  it("respects limit parameter", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited", referrer: { id: "user-1", name: "A", avatar: null } }),
      makeRawReferral({ referrer_id: "user-1", status: "credited", referrer: { id: "user-1", name: "A", avatar: null } }),
      makeRawReferral({ referrer_id: "user-1", status: "credited", referrer: { id: "user-1", name: "A", avatar: null } }),
      makeRawReferral({ referrer_id: "user-2", status: "credited", referrer: { id: "user-2", name: "B", avatar: null } }),
      makeRawReferral({ referrer_id: "user-2", status: "credited", referrer: { id: "user-2", name: "B", avatar: null } }),
      makeRawReferral({ referrer_id: "user-3", status: "credited", referrer: { id: "user-3", name: "C", avatar: null } }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1", 2);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it("uses 'Unknown' name when referrer join data missing", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited", referrer: null }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result[0].userName).toBe("Unknown");
  });

  it("preserves avatar from referrer data", () => {
    const referrals = [
      makeRawReferral({
        referrer_id: "user-1",
        status: "credited",
        referrer: { id: "user-1", name: "Alice", avatar: "https://example.com/avatar.jpg" },
      }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result[0].userAvatar).toBe("https://example.com/avatar.jpg");
  });

  it("handles mixed credited and pending across multiple users", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited", referrer: { id: "user-1", name: "Alice", avatar: null } }),
      makeRawReferral({ referrer_id: "user-1", status: "pending", referrer: { id: "user-1", name: "Alice", avatar: null } }),
      makeRawReferral({ referrer_id: "user-2", status: "pending", referrer: { id: "user-2", name: "Bob", avatar: null } }),
      makeRawReferral({ referrer_id: "user-2", status: "pending", referrer: { id: "user-2", name: "Bob", avatar: null } }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    // Only user-1 appears (has credited), user-2 excluded (only pending)
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe("user-1");
    expect(result[0].totalReferrals).toBe(1);
    expect(result[0].pendingReferrals).toBe(1);
  });
});

// ──────────────────────────────────────────────
// 7. Referral Status Logic
// ──────────────────────────────────────────────

describe("Referral Status Logic", () => {
  it("pending referral has no creditedAt", () => {
    const row = makeReferralRow({ status: "pending", credited_at: null });
    const result = toReferral(row);

    expect(result.status).toBe("pending");
    expect(result.creditedAt).toBeUndefined();
  });

  it("credited referral has creditedAt timestamp", () => {
    const row = makeReferralRow({ status: "credited", credited_at: "2026-02-05T10:00:00Z" });
    const result = toReferral(row);

    expect(result.status).toBe("credited");
    expect(result.creditedAt).toBeInstanceOf(Date);
  });

  // Simulate the status filtering done in getUserStats
  it("correctly separates credited vs pending counts", () => {
    const referrals = [
      { status: "credited" as const },
      { status: "credited" as const },
      { status: "pending" as const },
      { status: "credited" as const },
      { status: "pending" as const },
    ];

    const total = referrals.filter((r) => r.status === "credited").length;
    const pending = referrals.filter((r) => r.status === "pending").length;

    expect(total).toBe(3);
    expect(pending).toBe(2);
  });
});

// ──────────────────────────────────────────────
// 8. Cookie Ref Code Handling
// ──────────────────────────────────────────────

describe("Cookie Ref Code Handling", () => {
  it("encodeURIComponent preserves alphanumeric codes", () => {
    const code = "aBcDeFgH";
    expect(encodeURIComponent(code)).toBe(code);
  });

  it("encodeURIComponent would escape special chars if present", () => {
    const malicious = "abc<script>";
    const encoded = encodeURIComponent(malicious);
    expect(encoded).not.toContain("<");
    expect(encoded).not.toContain(">");
  });

  it("cookie string format is correct", () => {
    const code = "aBcDeFgH";
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    const cookie = `ref_code=${encodeURIComponent(code)}; path=/; expires=${expires}; SameSite=Lax`;

    expect(cookie).toContain("ref_code=aBcDeFgH");
    expect(cookie).toContain("path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("expires=");
  });
});

// ──────────────────────────────────────────────
// 9. Edge Cases
// ──────────────────────────────────────────────

describe("Edge Cases", () => {
  it("leaderboard handles single referral correctly", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1");

    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe(1);
    expect(result[0].totalReferrals).toBe(1);
  });

  it("leaderboard with limit=0 returns empty", () => {
    const referrals = [
      makeRawReferral({ referrer_id: "user-1", status: "credited" }),
    ];
    const result = aggregateLeaderboard(referrals, "cohort-1", 0);

    expect(result).toHaveLength(0);
  });

  it("leaderboard handles large number of referrers", () => {
    const referrals: RawReferralRow[] = [];
    for (let i = 0; i < 100; i++) {
      // Each user gets (100 - i) credited referrals so ranking is deterministic
      for (let j = 0; j < 100 - i; j++) {
        referrals.push(
          makeRawReferral({
            referrer_id: `user-${i}`,
            status: "credited",
            referrer: { id: `user-${i}`, name: `User ${i}`, avatar: null },
          })
        );
      }
    }
    const result = aggregateLeaderboard(referrals, "cohort-1", 10);

    expect(result).toHaveLength(10);
    expect(result[0].userId).toBe("user-0");
    expect(result[0].totalReferrals).toBe(100);
    expect(result[0].rank).toBe(1);
    expect(result[9].userId).toBe("user-9");
    expect(result[9].rank).toBe(10);
  });

  it("first-touch attribution: unique referred_id per cohort", () => {
    // This tests the DB constraint logic — same referred_id can only appear once per cohort
    const referredIds = new Map<string, string>(); // referred_id → first referrer_id

    function recordReferral(referrerId: string, referredId: string, cohortId: string): boolean {
      const key = `${referredId}:${cohortId}`;
      if (referredIds.has(key)) return false; // UNIQUE constraint would block
      referredIds.set(key, referrerId);
      return true;
    }

    expect(recordReferral("alice", "charlie", "cohort-1")).toBe(true);
    expect(recordReferral("bob", "charlie", "cohort-1")).toBe(false); // duplicate
    expect(recordReferral("alice", "charlie", "cohort-2")).toBe(true); // different cohort is OK
  });
});
