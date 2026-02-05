/**
 * Section 10: Workshop RSVP Tests — Calendar Integration
 *
 * Tests for calendar-utils.ts:
 * - generateGoogleCalendarUrl
 * - generateICSFile
 * - generateAppleCalendarUrl
 */

import { describe, it, expect } from "vitest";
import {
  generateGoogleCalendarUrl,
  generateICSFile,
  generateAppleCalendarUrl,
} from "../calendar-utils";
import type { Workshop } from "@/types";

// -- helpers --

function makeWorkshop(overrides: Partial<Workshop> = {}): Workshop {
  return {
    id: "ws-1",
    title: "Intro to Story Protocol",
    description: "Learn the basics of Story Protocol and IP registration.",
    category: "technical",
    status: "published",
    isEvergreen: false,
    scheduledAt: new Date("2025-03-15T14:00:00Z"),
    endTime: new Date("2025-03-15T15:30:00Z"),
    timezone: "America/Los_Angeles",
    location: "Online",
    meetingUrl: "https://meet.google.com/abc-def-ghi",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 10.2.1  Google Calendar URL
// ──────────────────────────────────────────────

describe("generateGoogleCalendarUrl", () => {
  it("returns empty string when no scheduledAt", () => {
    const ws = makeWorkshop({ scheduledAt: undefined });
    expect(generateGoogleCalendarUrl(ws)).toBe("");
  });

  it("generates valid Google Calendar URL", () => {
    const ws = makeWorkshop();
    const url = generateGoogleCalendarUrl(ws);

    expect(url).toContain("https://calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
  });

  it("includes workshop title in URL", () => {
    const ws = makeWorkshop({ title: "My Workshop" });
    const url = generateGoogleCalendarUrl(ws);
    expect(url).toContain("My+Workshop");
  });

  it("includes formatted date range", () => {
    const ws = makeWorkshop({
      scheduledAt: new Date("2025-03-15T14:00:00Z"),
      endTime: new Date("2025-03-15T15:30:00Z"),
    });
    const url = generateGoogleCalendarUrl(ws);

    // Dates should be in YYYYMMDDTHHMMSSZ format
    expect(url).toContain("20250315T140000Z");
    expect(url).toContain("20250315T153000Z");
  });

  it("defaults to 1-hour duration when no endTime", () => {
    const ws = makeWorkshop({
      scheduledAt: new Date("2025-03-15T14:00:00Z"),
      endTime: undefined,
    });
    const url = generateGoogleCalendarUrl(ws);

    // End time should be start + 1 hour
    expect(url).toContain("20250315T150000Z");
  });

  it("includes location", () => {
    const ws = makeWorkshop({ location: "Room 301" });
    const url = generateGoogleCalendarUrl(ws);
    expect(url).toContain("Room+301");
  });

  it("defaults location to Online when not set", () => {
    const ws = makeWorkshop({ location: undefined });
    const url = generateGoogleCalendarUrl(ws);
    expect(url).toContain("Online");
  });

  it("includes meeting URL in details", () => {
    const ws = makeWorkshop({ meetingUrl: "https://zoom.us/j/123" });
    const url = generateGoogleCalendarUrl(ws);
    expect(url).toContain("zoom.us");
  });

  it("includes description in details", () => {
    const ws = makeWorkshop({ description: "Learn about DeFi" });
    const url = generateGoogleCalendarUrl(ws);
    expect(url).toContain("Learn+about+DeFi");
  });
});

// ──────────────────────────────────────────────
// 10.2.2  ICS File Generation
// ──────────────────────────────────────────────

describe("generateICSFile", () => {
  it("returns empty string when no scheduledAt", () => {
    const ws = makeWorkshop({ scheduledAt: undefined });
    expect(generateICSFile(ws)).toBe("");
  });

  it("generates valid ICS structure", () => {
    const ws = makeWorkshop();
    const ics = generateICSFile(ws);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes required ICS headers", () => {
    const ws = makeWorkshop();
    const ics = generateICSFile(ws);

    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//SWA//Workshop Calendar//EN");
    expect(ics).toContain("CALSCALE:GREGORIAN");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("includes correct UID", () => {
    const ws = makeWorkshop({ id: "ws-abc-123" });
    const ics = generateICSFile(ws);
    expect(ics).toContain("UID:ws-abc-123@swa.xyz");
  });

  it("includes formatted start/end dates", () => {
    const ws = makeWorkshop({
      scheduledAt: new Date("2025-06-20T10:00:00Z"),
      endTime: new Date("2025-06-20T11:30:00Z"),
    });
    const ics = generateICSFile(ws);

    expect(ics).toContain("DTSTART:20250620T100000Z");
    expect(ics).toContain("DTEND:20250620T113000Z");
  });

  it("defaults to 1-hour duration when no endTime", () => {
    const ws = makeWorkshop({
      scheduledAt: new Date("2025-06-20T10:00:00Z"),
      endTime: undefined,
    });
    const ics = generateICSFile(ws);

    expect(ics).toContain("DTEND:20250620T110000Z");
  });

  it("includes summary (title)", () => {
    const ws = makeWorkshop({ title: "Web3 Workshop" });
    const ics = generateICSFile(ws);
    expect(ics).toContain("SUMMARY:Web3 Workshop");
  });

  it("includes location", () => {
    const ws = makeWorkshop({ location: "Room 301" });
    const ics = generateICSFile(ws);
    expect(ics).toContain("LOCATION:Room 301");
  });

  it("defaults location to Online", () => {
    const ws = makeWorkshop({ location: undefined });
    const ics = generateICSFile(ws);
    expect(ics).toContain("LOCATION:Online");
  });

  it("includes meeting URL in description", () => {
    const ws = makeWorkshop({ meetingUrl: "https://zoom.us/j/123" });
    const ics = generateICSFile(ws);
    expect(ics).toContain("zoom.us/j/123");
  });

  it("includes meeting URL as URL field", () => {
    const ws = makeWorkshop({ meetingUrl: "https://zoom.us/j/123" });
    const ics = generateICSFile(ws);
    expect(ics).toContain("URL:https://zoom.us/j/123");
  });

  it("omits URL field when no meetingUrl", () => {
    const ws = makeWorkshop({ meetingUrl: undefined });
    const ics = generateICSFile(ws);
    expect(ics).not.toContain("URL:");
  });

  it("includes STATUS:CONFIRMED", () => {
    const ics = generateICSFile(makeWorkshop());
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("uses CRLF line endings", () => {
    const ics = generateICSFile(makeWorkshop());
    expect(ics).toContain("\r\n");
  });

  it("escapes special characters in text fields", () => {
    const ws = makeWorkshop({
      title: "Workshop; with, special\\ chars",
      description: "Line1\nLine2",
      location: "Room; 301",
    });
    const ics = generateICSFile(ws);

    expect(ics).toContain("SUMMARY:Workshop\\; with\\, special\\\\ chars");
    expect(ics).toContain("LOCATION:Room\\; 301");
  });
});

// ──────────────────────────────────────────────
// 10.2.3  Apple Calendar URL
// ──────────────────────────────────────────────

describe("generateAppleCalendarUrl", () => {
  it("returns empty string when no scheduledAt", () => {
    const ws = makeWorkshop({ scheduledAt: undefined });
    expect(generateAppleCalendarUrl(ws)).toBe("");
  });

  it("falls back to Google Calendar URL", () => {
    const ws = makeWorkshop();
    const appleUrl = generateAppleCalendarUrl(ws);
    const googleUrl = generateGoogleCalendarUrl(ws);

    // Currently Apple falls back to Google Calendar
    expect(appleUrl).toBe(googleUrl);
  });

  it("includes calendar.google.com", () => {
    const ws = makeWorkshop();
    const url = generateAppleCalendarUrl(ws);
    expect(url).toContain("calendar.google.com");
  });
});
