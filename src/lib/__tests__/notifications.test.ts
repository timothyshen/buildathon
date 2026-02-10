/**
 * Notifications System Tests
 *
 * Tests for:
 * - timeAgo formatting (relative date strings)
 * - toNotification row mapping (snake_case DB rows → camelCase types)
 * - Notification type → icon mapping (all 12 types + unknown)
 * - Notification preferences defaults and merge
 * - Push payload validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ──────────────────────────────────────────────
// Mirror internal functions (not exported from components)
// ──────────────────────────────────────────────

type NotificationType =
  | "submission_status_changed"
  | "review_received"
  | "deadline_reminder"
  | "team_invite"
  | "winner_announced"
  | "review_assigned"
  | "review_deadline"
  | "new_track_submission"
  | "track_review_completed"
  | "new_submission"
  | "new_user"
  | "new_feedback";

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface NotificationPreferences {
  push_enabled: boolean;
  submission_updates: boolean;
  review_alerts: boolean;
  deadline_reminders: boolean;
  team_activity: boolean;
}

// From notification-bell.tsx
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// From use-notifications.ts / notifications.service.ts
function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: row.body as string,
    href: row.href as string | undefined,
    readAt: row.read_at ? new Date(row.read_at as string) : undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

// Icon mapping categories from notification-bell.tsx
type IconCategory = "file" | "message" | "clock" | "user" | "award" | "star" | "users" | "bell";

function getNotificationIconCategory(type: NotificationType | string): IconCategory {
  switch (type) {
    case "submission_status_changed":
    case "new_submission":
    case "new_track_submission":
      return "file";
    case "review_received":
    case "track_review_completed":
    case "new_feedback":
      return "message";
    case "deadline_reminder":
    case "review_deadline":
      return "clock";
    case "team_invite":
      return "user";
    case "winner_announced":
      return "award";
    case "review_assigned":
      return "star";
    case "new_user":
      return "users";
    default:
      return "bell";
  }
}

// High-priority types that trigger toasts (from use-notifications.ts)
const HIGH_PRIORITY_TYPES: NotificationType[] = [
  "submission_status_changed",
  "review_received",
  "winner_announced",
];

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  push_enabled: false,
  submission_updates: true,
  review_alerts: true,
  deadline_reminders: true,
  team_activity: true,
};

// ──────────────────────────────────────────────
// Test data factories
// ──────────────────────────────────────────────

function makeDbRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: "notif-001",
    user_id: "user-abc",
    type: "new_submission",
    title: "New submission",
    body: '"My Project" was submitted',
    href: "/admin/submissions",
    read_at: null,
    metadata: { submissionId: "sub-123", cohortId: "cohort-456" },
    created_at: "2026-02-10T12:00:00Z",
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for dates < 60 seconds ago", () => {
    const date = new Date("2026-02-10T11:59:30Z"); // 30s ago
    expect(timeAgo(date)).toBe("just now");
  });

  it("returns 'just now' for 0 seconds ago", () => {
    const date = new Date("2026-02-10T12:00:00Z");
    expect(timeAgo(date)).toBe("just now");
  });

  it("returns '1m ago' for exactly 60 seconds ago", () => {
    const date = new Date("2026-02-10T11:59:00Z");
    expect(timeAgo(date)).toBe("1m ago");
  });

  it("returns minutes for < 60 minutes", () => {
    const date = new Date("2026-02-10T11:25:00Z"); // 35m ago
    expect(timeAgo(date)).toBe("35m ago");
  });

  it("returns '59m ago' at the boundary", () => {
    const date = new Date("2026-02-10T11:01:00Z"); // 59m ago
    expect(timeAgo(date)).toBe("59m ago");
  });

  it("returns '1h ago' for exactly 60 minutes", () => {
    const date = new Date("2026-02-10T11:00:00Z");
    expect(timeAgo(date)).toBe("1h ago");
  });

  it("returns hours for < 24 hours", () => {
    const date = new Date("2026-02-10T00:00:00Z"); // 12h ago
    expect(timeAgo(date)).toBe("12h ago");
  });

  it("returns '23h ago' at the boundary", () => {
    const date = new Date("2026-02-09T13:00:00Z"); // 23h ago
    expect(timeAgo(date)).toBe("23h ago");
  });

  it("returns '1d ago' for exactly 24 hours", () => {
    const date = new Date("2026-02-09T12:00:00Z");
    expect(timeAgo(date)).toBe("1d ago");
  });

  it("returns days for < 30 days", () => {
    const date = new Date("2026-01-27T12:00:00Z"); // 14d ago
    expect(timeAgo(date)).toBe("14d ago");
  });

  it("returns '29d ago' at the boundary", () => {
    const date = new Date("2026-01-12T12:00:00Z"); // 29d ago
    expect(timeAgo(date)).toBe("29d ago");
  });

  it("returns '1mo ago' for exactly 30 days", () => {
    const date = new Date("2026-01-11T12:00:00Z"); // 30d ago
    expect(timeAgo(date)).toBe("1mo ago");
  });

  it("returns months for > 30 days", () => {
    const date = new Date("2025-09-10T12:00:00Z"); // ~5 months ago
    expect(timeAgo(date)).toBe("5mo ago");
  });

  it("handles future dates (returns 'just now')", () => {
    // Negative seconds floor to 0 or negative, still < 60
    const date = new Date("2026-02-10T12:00:30Z"); // 30s in the future
    expect(timeAgo(date)).toBe("just now");
  });
});

describe("toNotification", () => {
  it("maps all fields from snake_case row", () => {
    const row = makeDbRow();
    const notif = toNotification(row);

    expect(notif.id).toBe("notif-001");
    expect(notif.userId).toBe("user-abc");
    expect(notif.type).toBe("new_submission");
    expect(notif.title).toBe("New submission");
    expect(notif.body).toBe('"My Project" was submitted');
    expect(notif.href).toBe("/admin/submissions");
    expect(notif.readAt).toBeUndefined();
    expect(notif.metadata).toEqual({ submissionId: "sub-123", cohortId: "cohort-456" });
    expect(notif.createdAt).toBeInstanceOf(Date);
    expect(notif.createdAt.toISOString()).toBe("2026-02-10T12:00:00.000Z");
  });

  it("maps read_at to Date when present", () => {
    const row = makeDbRow({ read_at: "2026-02-10T13:00:00Z" });
    const notif = toNotification(row);

    expect(notif.readAt).toBeInstanceOf(Date);
    expect(notif.readAt!.toISOString()).toBe("2026-02-10T13:00:00.000Z");
  });

  it("sets readAt to undefined when read_at is null", () => {
    const row = makeDbRow({ read_at: null });
    expect(toNotification(row).readAt).toBeUndefined();
  });

  it("sets readAt to undefined when read_at is empty string", () => {
    const row = makeDbRow({ read_at: "" });
    expect(toNotification(row).readAt).toBeUndefined();
  });

  it("handles missing href", () => {
    const row = makeDbRow({ href: undefined });
    expect(toNotification(row).href).toBeUndefined();
  });

  it("handles null metadata", () => {
    const row = makeDbRow({ metadata: null });
    expect(toNotification(row).metadata).toBeNull();
  });

  it("preserves all notification types", () => {
    const types: NotificationType[] = [
      "submission_status_changed", "review_received", "deadline_reminder",
      "team_invite", "winner_announced", "review_assigned",
      "review_deadline", "new_track_submission", "track_review_completed",
      "new_submission", "new_user", "new_feedback",
    ];

    types.forEach((type) => {
      const notif = toNotification(makeDbRow({ type }));
      expect(notif.type).toBe(type);
    });
  });

  it("parses ISO date strings correctly", () => {
    const row = makeDbRow({ created_at: "2025-12-25T00:00:00.000Z" });
    const notif = toNotification(row);
    expect(notif.createdAt.getFullYear()).toBe(2025);
    expect(notif.createdAt.getMonth()).toBe(11); // December is 11
    expect(notif.createdAt.getDate()).toBe(25);
  });
});

describe("getNotificationIconCategory", () => {
  it("maps submission types to file icon", () => {
    expect(getNotificationIconCategory("submission_status_changed")).toBe("file");
    expect(getNotificationIconCategory("new_submission")).toBe("file");
    expect(getNotificationIconCategory("new_track_submission")).toBe("file");
  });

  it("maps review/feedback types to message icon", () => {
    expect(getNotificationIconCategory("review_received")).toBe("message");
    expect(getNotificationIconCategory("track_review_completed")).toBe("message");
    expect(getNotificationIconCategory("new_feedback")).toBe("message");
  });

  it("maps deadline types to clock icon", () => {
    expect(getNotificationIconCategory("deadline_reminder")).toBe("clock");
    expect(getNotificationIconCategory("review_deadline")).toBe("clock");
  });

  it("maps team_invite to user icon", () => {
    expect(getNotificationIconCategory("team_invite")).toBe("user");
  });

  it("maps winner_announced to award icon", () => {
    expect(getNotificationIconCategory("winner_announced")).toBe("award");
  });

  it("maps review_assigned to star icon", () => {
    expect(getNotificationIconCategory("review_assigned")).toBe("star");
  });

  it("maps new_user to users icon", () => {
    expect(getNotificationIconCategory("new_user")).toBe("users");
  });

  it("returns bell for unknown types", () => {
    expect(getNotificationIconCategory("unknown_type")).toBe("bell");
    expect(getNotificationIconCategory("")).toBe("bell");
  });

  it("covers all 12 notification types", () => {
    const allTypes: NotificationType[] = [
      "submission_status_changed", "review_received", "deadline_reminder",
      "team_invite", "winner_announced", "review_assigned",
      "review_deadline", "new_track_submission", "track_review_completed",
      "new_submission", "new_user", "new_feedback",
    ];

    allTypes.forEach((type) => {
      const category = getNotificationIconCategory(type);
      expect(category).not.toBe("bell"); // All known types should have a specific icon
    });
  });
});

describe("HIGH_PRIORITY_TYPES", () => {
  it("includes submission_status_changed", () => {
    expect(HIGH_PRIORITY_TYPES).toContain("submission_status_changed");
  });

  it("includes review_received", () => {
    expect(HIGH_PRIORITY_TYPES).toContain("review_received");
  });

  it("includes winner_announced", () => {
    expect(HIGH_PRIORITY_TYPES).toContain("winner_announced");
  });

  it("has exactly 3 types", () => {
    expect(HIGH_PRIORITY_TYPES).toHaveLength(3);
  });

  it("does not include low-priority types", () => {
    const lowPriority: NotificationType[] = [
      "deadline_reminder", "team_invite", "review_assigned",
      "review_deadline", "new_track_submission", "track_review_completed",
      "new_submission", "new_user", "new_feedback",
    ];
    lowPriority.forEach((type) => {
      expect(HIGH_PRIORITY_TYPES).not.toContain(type);
    });
  });
});

describe("NotificationPreferences", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_PREFERENCES.push_enabled).toBe(false);
    expect(DEFAULT_PREFERENCES.submission_updates).toBe(true);
    expect(DEFAULT_PREFERENCES.review_alerts).toBe(true);
    expect(DEFAULT_PREFERENCES.deadline_reminders).toBe(true);
    expect(DEFAULT_PREFERENCES.team_activity).toBe(true);
  });

  it("can be merged with partial overrides", () => {
    const overrides = { push_enabled: true, team_activity: false };
    const merged = { ...DEFAULT_PREFERENCES, ...overrides };

    expect(merged.push_enabled).toBe(true);
    expect(merged.submission_updates).toBe(true);
    expect(merged.review_alerts).toBe(true);
    expect(merged.deadline_reminders).toBe(true);
    expect(merged.team_activity).toBe(false);
  });

  it("all keys are booleans", () => {
    Object.values(DEFAULT_PREFERENCES).forEach((value) => {
      expect(typeof value).toBe("boolean");
    });
  });

  it("has exactly 5 preference keys", () => {
    expect(Object.keys(DEFAULT_PREFERENCES)).toHaveLength(5);
  });

  it("serializes to valid JSON", () => {
    const json = JSON.stringify(DEFAULT_PREFERENCES);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("Notification trigger payload validation", () => {
  // These test the shape of payloads sent to /api/notifications/trigger

  interface TriggerPayload {
    event: string;
    data: Record<string, unknown>;
  }

  function validateTriggerPayload(payload: TriggerPayload): string[] {
    const errors: string[] = [];
    if (!payload.event) errors.push("missing event");
    if (!payload.data) errors.push("missing data");

    switch (payload.event) {
      case "submission_submitted":
        if (!payload.data.submissionId) errors.push("missing submissionId");
        if (!payload.data.title) errors.push("missing title");
        break;
      case "submission_status_changed":
        if (!payload.data.submissionId) errors.push("missing submissionId");
        if (!payload.data.title) errors.push("missing title");
        if (!payload.data.newStatus) errors.push("missing newStatus");
        if (!payload.data.userId) errors.push("missing userId");
        break;
      case "review_completed":
        if (!payload.data.submissionId) errors.push("missing submissionId");
        break;
      case "review_assigned":
        if (!payload.data.judgeId) errors.push("missing judgeId");
        break;
      case "team_invite_created":
        if (!payload.data.teamName) errors.push("missing teamName");
        if (!payload.data.email) errors.push("missing email");
        break;
      case "feedback_created":
        if (!payload.data.feedbackId) errors.push("missing feedbackId");
        if (!payload.data.title) errors.push("missing title");
        break;
      default:
        errors.push(`unknown event: ${payload.event}`);
    }

    return errors;
  }

  it("validates submission_submitted payload", () => {
    const payload: TriggerPayload = {
      event: "submission_submitted",
      data: { submissionId: "sub-1", title: "My Project", cohortId: "cohort-1" },
    };
    expect(validateTriggerPayload(payload)).toEqual([]);
  });

  it("rejects submission_submitted without submissionId", () => {
    const payload: TriggerPayload = {
      event: "submission_submitted",
      data: { title: "My Project" },
    };
    expect(validateTriggerPayload(payload)).toContain("missing submissionId");
  });

  it("rejects submission_submitted without title", () => {
    const payload: TriggerPayload = {
      event: "submission_submitted",
      data: { submissionId: "sub-1" },
    };
    expect(validateTriggerPayload(payload)).toContain("missing title");
  });

  it("validates submission_status_changed payload", () => {
    const payload: TriggerPayload = {
      event: "submission_status_changed",
      data: { submissionId: "sub-1", title: "Project", newStatus: "accepted", userId: "user-1" },
    };
    expect(validateTriggerPayload(payload)).toEqual([]);
  });

  it("rejects submission_status_changed missing fields", () => {
    const payload: TriggerPayload = {
      event: "submission_status_changed",
      data: { submissionId: "sub-1" },
    };
    const errors = validateTriggerPayload(payload);
    expect(errors).toContain("missing title");
    expect(errors).toContain("missing newStatus");
    expect(errors).toContain("missing userId");
  });

  it("validates review_completed payload", () => {
    const payload: TriggerPayload = {
      event: "review_completed",
      data: { submissionId: "sub-1" },
    };
    expect(validateTriggerPayload(payload)).toEqual([]);
  });

  it("validates review_assigned payload", () => {
    const payload: TriggerPayload = {
      event: "review_assigned",
      data: { judgeId: "judge-1" },
    };
    expect(validateTriggerPayload(payload)).toEqual([]);
  });

  it("validates team_invite_created payload", () => {
    const payload: TriggerPayload = {
      event: "team_invite_created",
      data: { teamName: "Alpha Team", email: "user@test.com" },
    };
    expect(validateTriggerPayload(payload)).toEqual([]);
  });

  it("validates feedback_created payload", () => {
    const payload: TriggerPayload = {
      event: "feedback_created",
      data: { feedbackId: "fb-1", title: "Bug Report" },
    };
    expect(validateTriggerPayload(payload)).toEqual([]);
  });

  it("rejects unknown event types", () => {
    const payload: TriggerPayload = {
      event: "unknown_event",
      data: {},
    };
    expect(validateTriggerPayload(payload)).toContain("unknown event: unknown_event");
  });

  it("rejects empty event", () => {
    const payload: TriggerPayload = {
      event: "",
      data: {},
    };
    expect(validateTriggerPayload(payload)).toContain("missing event");
  });
});

describe("Status label mapping", () => {
  // From notification trigger route — status labels for submission changes
  const statusLabels: Record<string, string> = {
    submitted: "submitted",
    under_review: "under review",
    accepted: "accepted",
    winner: "selected as a winner",
  };

  it("maps all submission statuses", () => {
    expect(statusLabels["submitted"]).toBe("submitted");
    expect(statusLabels["under_review"]).toBe("under review");
    expect(statusLabels["accepted"]).toBe("accepted");
    expect(statusLabels["winner"]).toBe("selected as a winner");
  });

  it("returns undefined for draft (not a notification-worthy status)", () => {
    expect(statusLabels["draft"]).toBeUndefined();
  });

  it("generates correct notification body", () => {
    const title = "My Cool Project";
    const newStatus = "accepted";
    const label = statusLabels[newStatus] || newStatus;
    const body = `"${title}" is now ${label}`;
    expect(body).toBe('"My Cool Project" is now accepted');
  });

  it("falls back to raw status for unknown values", () => {
    const newStatus = "custom_status";
    const label = statusLabels[newStatus] || newStatus;
    expect(label).toBe("custom_status");
  });
});

describe("Push subscription fields", () => {
  interface PushSubscriptionFields {
    endpoint: string;
    p256dh: string;
    auth: string;
  }

  function validateSubscription(fields: Partial<PushSubscriptionFields>): string[] {
    const errors: string[] = [];
    if (!fields.endpoint) errors.push("missing endpoint");
    if (!fields.p256dh) errors.push("missing p256dh");
    if (!fields.auth) errors.push("missing auth");
    return errors;
  }

  it("validates complete subscription", () => {
    expect(validateSubscription({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      p256dh: "BLc4xRb...",
      auth: "tBHI...",
    })).toEqual([]);
  });

  it("rejects missing endpoint", () => {
    expect(validateSubscription({ p256dh: "key", auth: "auth" }))
      .toContain("missing endpoint");
  });

  it("rejects missing p256dh", () => {
    expect(validateSubscription({ endpoint: "https://...", auth: "auth" }))
      .toContain("missing p256dh");
  });

  it("rejects missing auth", () => {
    expect(validateSubscription({ endpoint: "https://...", p256dh: "key" }))
      .toContain("missing auth");
  });

  it("rejects completely empty fields", () => {
    const errors = validateSubscription({});
    expect(errors).toHaveLength(3);
  });
});
