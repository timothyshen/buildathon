/**
 * Section 10: Calendar Integration Tests
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
import type { CalendarEvent } from "@/types";

// -- helpers --

function makeCalendarEvent(
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent {
  return {
    id: "ws-1",
    title: "Intro to Story Protocol",
    description: "Learn the basics of Story Protocol and IP registration.",
    category: "technical",
    startAt: new Date("2025-03-15T14:00:00Z"),
    endAt: new Date("2025-03-15T15:30:00Z"),
    timezone: "America/Los_Angeles",
    location: "Online",
    meetingUrl: "https://meet.google.com/abc-def-ghi",
    eventUrl: "https://lu.ma/test-event",
    lumaApiId: "luma-1",
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 10.2.1  Google Calendar URL
// ──────────────────────────────────────────────

describe("generateGoogleCalendarUrl", () => {
  it("generates valid Google Calendar URL", () => {
    const event = makeCalendarEvent();
    const url = generateGoogleCalendarUrl(event);

    expect(url).toContain("https://calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
  });

  it("includes event title in URL", () => {
    const event = makeCalendarEvent({ title: "My Workshop" });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain("My+Workshop");
  });

  it("includes formatted date range", () => {
    const event = makeCalendarEvent({
      startAt: new Date("2025-03-15T14:00:00Z"),
      endAt: new Date("2025-03-15T15:30:00Z"),
    });
    const url = generateGoogleCalendarUrl(event);

    // Dates should be in YYYYMMDDTHHMMSSZ format
    expect(url).toContain("20250315T140000Z");
    expect(url).toContain("20250315T153000Z");
  });

  it("includes location", () => {
    const event = makeCalendarEvent({ location: "Room 301" });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain("Room+301");
  });

  it("defaults location to Online when not set", () => {
    const event = makeCalendarEvent({ location: undefined });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain("Online");
  });

  it("includes meeting URL in details", () => {
    const event = makeCalendarEvent({
      meetingUrl: "https://zoom.us/j/123",
    });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain("zoom.us");
  });

  it("includes event URL in details", () => {
    const event = makeCalendarEvent({
      eventUrl: "https://lu.ma/my-event",
    });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain("lu.ma");
  });

  it("includes description in details", () => {
    const event = makeCalendarEvent({ description: "Learn about DeFi" });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain("Learn+about+DeFi");
  });
});

// ──────────────────────────────────────────────
// 10.2.2  ICS File Generation
// ──────────────────────────────────────────────

describe("generateICSFile", () => {
  it("generates valid ICS structure", () => {
    const event = makeCalendarEvent();
    const ics = generateICSFile(event);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes required ICS headers", () => {
    const event = makeCalendarEvent();
    const ics = generateICSFile(event);

    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//SWA//Workshop Calendar//EN");
    expect(ics).toContain("CALSCALE:GREGORIAN");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("includes correct UID", () => {
    const event = makeCalendarEvent({ id: "ws-abc-123" });
    const ics = generateICSFile(event);
    expect(ics).toContain("UID:ws-abc-123@swa.xyz");
  });

  it("includes formatted start/end dates", () => {
    const event = makeCalendarEvent({
      startAt: new Date("2025-06-20T10:00:00Z"),
      endAt: new Date("2025-06-20T11:30:00Z"),
    });
    const ics = generateICSFile(event);

    expect(ics).toContain("DTSTART:20250620T100000Z");
    expect(ics).toContain("DTEND:20250620T113000Z");
  });

  it("includes summary (title)", () => {
    const event = makeCalendarEvent({ title: "Web3 Workshop" });
    const ics = generateICSFile(event);
    expect(ics).toContain("SUMMARY:Web3 Workshop");
  });

  it("includes location", () => {
    const event = makeCalendarEvent({ location: "Room 301" });
    const ics = generateICSFile(event);
    expect(ics).toContain("LOCATION:Room 301");
  });

  it("defaults location to Online", () => {
    const event = makeCalendarEvent({ location: undefined });
    const ics = generateICSFile(event);
    expect(ics).toContain("LOCATION:Online");
  });

  it("includes meeting URL in description", () => {
    const event = makeCalendarEvent({
      meetingUrl: "https://zoom.us/j/123",
    });
    const ics = generateICSFile(event);
    expect(ics).toContain("zoom.us/j/123");
  });

  it("includes eventUrl as URL field", () => {
    const event = makeCalendarEvent({
      eventUrl: "https://lu.ma/test-event",
    });
    const ics = generateICSFile(event);
    expect(ics).toContain("URL:https://lu.ma/test-event");
  });

  it("omits URL field when eventUrl is empty", () => {
    const event = makeCalendarEvent({ eventUrl: "" });
    const ics = generateICSFile(event);
    expect(ics).not.toContain("URL:");
  });

  it("includes STATUS:CONFIRMED", () => {
    const ics = generateICSFile(makeCalendarEvent());
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("uses CRLF line endings", () => {
    const ics = generateICSFile(makeCalendarEvent());
    expect(ics).toContain("\r\n");
  });

  it("escapes special characters in text fields", () => {
    const event = makeCalendarEvent({
      title: "Workshop; with, special\\ chars",
      description: "Line1\nLine2",
      location: "Room; 301",
    });
    const ics = generateICSFile(event);

    expect(ics).toContain("SUMMARY:Workshop\\; with\\, special\\\\ chars");
    expect(ics).toContain("LOCATION:Room\\; 301");
  });
});

// ──────────────────────────────────────────────
// 10.2.3  Apple Calendar URL
// ──────────────────────────────────────────────

describe("generateAppleCalendarUrl", () => {
  it("falls back to Google Calendar URL", () => {
    const event = makeCalendarEvent();
    const appleUrl = generateAppleCalendarUrl(event);
    const googleUrl = generateGoogleCalendarUrl(event);

    // Currently Apple falls back to Google Calendar
    expect(appleUrl).toBe(googleUrl);
  });

  it("includes calendar.google.com", () => {
    const event = makeCalendarEvent();
    const url = generateAppleCalendarUrl(event);
    expect(url).toContain("calendar.google.com");
  });
});
