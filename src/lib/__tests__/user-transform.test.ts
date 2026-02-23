/**
 * User Transform Tests
 *
 * Tests for toUser from users.service.ts
 */

import { describe, it, expect } from "vitest";
import { toUser } from "@/services/users.service";

// -- helpers --

function makeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "participant",
    avatar: undefined,
    wallet_address: undefined,
    bio: undefined,
    twitter: undefined,
    github: undefined,
    sponsor_org_id: undefined,
    has_completed_onboarding: undefined,
    notification_preferences: undefined,
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// toUser — snake_case → camelCase mapping
// ──────────────────────────────────────────────

describe("toUser", () => {
  it("maps required fields correctly", () => {
    const user = toUser(makeRow());
    expect(user.id).toBe("user-1");
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
    expect(user.role).toBe("participant");
  });

  it("maps wallet_address to walletAddress", () => {
    const user = toUser(makeRow({ wallet_address: "0xABC123" }));
    expect(user.walletAddress).toBe("0xABC123");
  });

  it("maps sponsor_org_id to sponsorOrgId", () => {
    const user = toUser(makeRow({ sponsor_org_id: "org-42" }));
    expect(user.sponsorOrgId).toBe("org-42");
  });

  it("maps has_completed_onboarding to hasCompletedOnboarding", () => {
    const user = toUser(makeRow({ has_completed_onboarding: true }));
    expect(user.hasCompletedOnboarding).toBe(true);
  });

  it("maps notification_preferences to notificationPreferences", () => {
    const prefs = {
      push_enabled: true,
      submission_updates: false,
      review_alerts: true,
      deadline_reminders: true,
      team_activity: false,
    };
    const user = toUser(makeRow({ notification_preferences: prefs }));
    expect(user.notificationPreferences).toEqual(prefs);
  });

  it("converts created_at string to Date", () => {
    const user = toUser(makeRow({ created_at: "2025-06-20T12:00:00Z" }));
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.createdAt.toISOString()).toBe("2025-06-20T12:00:00.000Z");
  });

  it("handles all optional fields as undefined", () => {
    const user = toUser(makeRow());
    expect(user.avatar).toBeUndefined();
    expect(user.walletAddress).toBeUndefined();
    expect(user.bio).toBeUndefined();
    expect(user.twitter).toBeUndefined();
    expect(user.github).toBeUndefined();
    expect(user.sponsorOrgId).toBeUndefined();
    expect(user.hasCompletedOnboarding).toBeUndefined();
    expect(user.notificationPreferences).toBeUndefined();
  });

  it("maps all user roles", () => {
    for (const role of ["admin", "sponsor", "judge", "participant"]) {
      const user = toUser(makeRow({ role }));
      expect(user.role).toBe(role);
    }
  });

  it("maps social fields", () => {
    const user = toUser(
      makeRow({ twitter: "@test", github: "testuser", bio: "Hello world" })
    );
    expect(user.twitter).toBe("@test");
    expect(user.github).toBe("testuser");
    expect(user.bio).toBe("Hello world");
  });
});
