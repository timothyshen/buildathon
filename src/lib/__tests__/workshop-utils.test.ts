/**
 * Workshop Utilities Tests
 *
 * Tests for workshop-utils.ts:
 * - getCategoryClassName
 * - formatTime
 * - formatDuration
 * - isSameDay
 * - isSameMonth
 * - getMonthDays
 * - getEventsForDate
 */

import { describe, it, expect } from "vitest";
import {
  getCategoryClassName,
  formatTime,
  formatDuration,
  isSameDay,
  isSameMonth,
  getMonthDays,
  getEventsForDate,
} from "../workshop-utils";
import type { CalendarEvent } from "@/types";

// -- helpers --

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "evt-1",
    title: "Test Workshop",
    description: "A test workshop",
    startAt: new Date("2025-03-15T14:00:00Z"),
    endAt: new Date("2025-03-15T15:30:00Z"),
    timezone: "America/Los_Angeles",
    eventUrl: "https://lu.ma/test",
    category: "basics",
    lumaApiId: "luma-1",
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// getCategoryClassName
// ──────────────────────────────────────────────

describe("getCategoryClassName", () => {
  it("returns technical classes for basics", () => {
    const cls = getCategoryClassName("basics");
    expect(cls).toContain("category-technical");
  });

  it("returns design classes for advanced", () => {
    const cls = getCategoryClassName("advanced");
    expect(cls).toContain("category-design");
  });

  it("returns business classes for business", () => {
    const cls = getCategoryClassName("business");
    expect(cls).toContain("category-business");
  });

  it("is case-insensitive", () => {
    expect(getCategoryClassName("BASICS")).toContain("category-technical");
    expect(getCategoryClassName("Advanced")).toContain("category-design");
    expect(getCategoryClassName("BUSINESS")).toContain("category-business");
  });

  it("returns muted classes for unknown category", () => {
    const cls = getCategoryClassName("other");
    expect(cls).toContain("bg-muted");
    expect(cls).toContain("text-muted-foreground");
  });
});

// ──────────────────────────────────────────────
// formatDuration
// ──────────────────────────────────────────────

describe("formatDuration", () => {
  it("formats hours only", () => {
    const result = formatDuration(
      new Date("2025-01-01T10:00:00Z"),
      new Date("2025-01-01T12:00:00Z")
    );
    expect(result).toBe("2h");
  });

  it("formats minutes only", () => {
    const result = formatDuration(
      new Date("2025-01-01T10:00:00Z"),
      new Date("2025-01-01T10:45:00Z")
    );
    expect(result).toBe("45 min");
  });

  it("formats hours and minutes", () => {
    const result = formatDuration(
      new Date("2025-01-01T10:00:00Z"),
      new Date("2025-01-01T11:30:00Z")
    );
    expect(result).toBe("1h 30m");
  });

  it("handles exactly 60 minutes as 1h", () => {
    const result = formatDuration(
      new Date("2025-01-01T10:00:00Z"),
      new Date("2025-01-01T11:00:00Z")
    );
    expect(result).toBe("1h");
  });

  it("handles zero duration", () => {
    const d = new Date("2025-01-01T10:00:00Z");
    expect(formatDuration(d, d)).toBe("0 min");
  });

  it("accepts string dates", () => {
    const result = formatDuration(
      "2025-01-01T10:00:00Z",
      "2025-01-01T12:30:00Z"
    );
    expect(result).toBe("2h 30m");
  });
});

// ──────────────────────────────────────────────
// formatTime
// ──────────────────────────────────────────────

describe("formatTime", () => {
  it("formats a Date to time string", () => {
    const result = formatTime(new Date("2025-01-01T15:00:00Z"));
    // Locale-dependent, just verify it returns a non-empty string
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("accepts string dates", () => {
    const result = formatTime("2025-01-01T15:00:00Z" as unknown as Date);
    expect(result).toBeTruthy();
  });
});

// ──────────────────────────────────────────────
// isSameDay
// ──────────────────────────────────────────────

describe("isSameDay", () => {
  it("returns true for same day", () => {
    const a = new Date(2025, 2, 15, 10, 0);
    const b = new Date(2025, 2, 15, 23, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    const a = new Date(2025, 2, 15);
    const b = new Date(2025, 2, 16);
    expect(isSameDay(a, b)).toBe(false);
  });

  it("returns false for same day different month", () => {
    const a = new Date(2025, 2, 15);
    const b = new Date(2025, 3, 15);
    expect(isSameDay(a, b)).toBe(false);
  });

  it("returns false for same day/month different year", () => {
    const a = new Date(2025, 2, 15);
    const b = new Date(2026, 2, 15);
    expect(isSameDay(a, b)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// isSameMonth
// ──────────────────────────────────────────────

describe("isSameMonth", () => {
  it("returns true for same month", () => {
    const a = new Date(2025, 2, 1);
    const b = new Date(2025, 2, 28);
    expect(isSameMonth(a, b)).toBe(true);
  });

  it("returns false for different months", () => {
    const a = new Date(2025, 2, 1);
    const b = new Date(2025, 3, 1);
    expect(isSameMonth(a, b)).toBe(false);
  });

  it("returns false for same month different year", () => {
    const a = new Date(2025, 2, 1);
    const b = new Date(2026, 2, 1);
    expect(isSameMonth(a, b)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// getMonthDays
// ──────────────────────────────────────────────

describe("getMonthDays", () => {
  it("always returns exactly 42 days (6-week grid)", () => {
    const days = getMonthDays(new Date(2025, 2, 1)); // March 2025
    expect(days).toHaveLength(42);
  });

  it("includes all days of the target month", () => {
    const march2025 = new Date(2025, 2, 1);
    const days = getMonthDays(march2025);
    // March has 31 days
    for (let d = 1; d <= 31; d++) {
      expect(days.some((day) => day.getMonth() === 2 && day.getDate() === d)).toBe(true);
    }
  });

  it("includes padding days from prev/next month", () => {
    // March 2025 starts on Saturday (index 6), so 6 padding days from Feb
    const days = getMonthDays(new Date(2025, 2, 1));
    const firstDay = days[0];
    // First day should be from February
    expect(firstDay.getMonth()).toBe(1); // February
  });

  it("handles month starting on Sunday (no prev-month padding)", () => {
    // June 2025 starts on Sunday
    const days = getMonthDays(new Date(2025, 5, 1));
    expect(days[0].getMonth()).toBe(5); // June
    expect(days[0].getDate()).toBe(1);
  });

  it("handles February in a leap year", () => {
    const days = getMonthDays(new Date(2024, 1, 1)); // Feb 2024
    // Feb 2024 has 29 days
    expect(days.some((d) => d.getMonth() === 1 && d.getDate() === 29)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// getEventsForDate
// ──────────────────────────────────────────────

describe("getEventsForDate", () => {
  it("returns events matching the date", () => {
    const events = [
      makeEvent({ id: "1", startAt: new Date(2025, 2, 15, 10) }),
      makeEvent({ id: "2", startAt: new Date(2025, 2, 16, 10) }),
      makeEvent({ id: "3", startAt: new Date(2025, 2, 15, 14) }),
    ];
    const result = getEventsForDate(new Date(2025, 2, 15), events);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when no events match", () => {
    const events = [makeEvent({ startAt: new Date(2025, 2, 16, 10) })];
    expect(getEventsForDate(new Date(2025, 2, 15), events)).toHaveLength(0);
  });

  it("returns empty array for empty events list", () => {
    expect(getEventsForDate(new Date(), [])).toHaveLength(0);
  });
});
