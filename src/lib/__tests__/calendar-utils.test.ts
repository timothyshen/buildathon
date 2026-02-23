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
import type { CalendarEvent } from "@/types";

// -- helpers --

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
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
    const url = generateGoogleCalendarUrl(makeEvent());

    expect(url).toContain("https://calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
  });

  it("includes event title in URL", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ title: "My Workshop" }));
    expect(url).toContain("My+Workshop");
  });

  it("includes formatted date range", () => {
    const url = generateGoogleCalendarUrl(makeEvent({
      startAt: new Date("2025-03-15T14:00:00Z"),
      endAt: new Date("2025-03-15T15:30:00Z"),
    }));

    // Dates should be in YYYYMMDDTHHMMSSZ format
    expect(url).toContain("20250315T140000Z");
    expect(url).toContain("20250315T153000Z");
  });

  it("includes location", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ location: "Room 301" }));
    expect(url).toContain("Room+301");
  });

  it("defaults location to Online when not set", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ location: undefined }));
    expect(url).toContain("Online");
  });

  it("includes meeting URL in details", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ meetingUrl: "https://zoom.us/j/123" }));
    expect(url).toContain("zoom.us");
  });

  it("includes description in details", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ description: "Learn about DeFi" }));
    expect(url).toContain("Learn+about+DeFi");
  });

  it("includes eventUrl in details", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ eventUrl: "https://lu.ma/my-event" }));
    expect(url).toContain("lu.ma");
  });
});

// ──────────────────────────────────────────────
// 10.2.2  ICS File Generation
// ──────────────────────────────────────────────

describe("generateICSFile", () => {
  it("generates valid ICS structure", () => {
    const ics = generateICSFile(makeEvent());

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes required ICS headers", () => {
    const ics = generateICSFile(makeEvent());

    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//SWA//Workshop Calendar//EN");
    expect(ics).toContain("CALSCALE:GREGORIAN");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("includes correct UID", () => {
    const ics = generateICSFile(makeEvent({ id: "ws-abc-123" }));
    expect(ics).toContain("UID:ws-abc-123@swa.xyz");
  });

  it("includes formatted start/end dates", () => {
    const ics = generateICSFile(makeEvent({
      startAt: new Date("2025-06-20T10:00:00Z"),
      endAt: new Date("2025-06-20T11:30:00Z"),
    }));

    expect(ics).toContain("DTSTART:20250620T100000Z");
    expect(ics).toContain("DTEND:20250620T113000Z");
  });

  it("includes summary (title)", () => {
    const ics = generateICSFile(makeEvent({ title: "Web3 Workshop" }));
    expect(ics).toContain("SUMMARY:Web3 Workshop");
  });

  it("includes location", () => {
    const ics = generateICSFile(makeEvent({ location: "Room 301" }));
    expect(ics).toContain("LOCATION:Room 301");
  });

  it("defaults location to Online", () => {
    const ics = generateICSFile(makeEvent({ location: undefined }));
    expect(ics).toContain("LOCATION:Online");
  });

  it("includes meeting URL in description", () => {
    const ics = generateICSFile(makeEvent({ meetingUrl: "https://zoom.us/j/123" }));
    expect(ics).toContain("zoom.us/j/123");
  });

  it("includes eventUrl as URL field", () => {
    const ics = generateICSFile(makeEvent({ eventUrl: "https://lu.ma/test" }));
    expect(ics).toContain("URL:https://lu.ma/test");
  });

  it("omits URL field when no eventUrl", () => {
    const ics = generateICSFile(makeEvent({ eventUrl: "" }));
    expect(ics).not.toContain("URL:");
  });

  it("includes STATUS:CONFIRMED", () => {
    const ics = generateICSFile(makeEvent());
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("uses CRLF line endings", () => {
    const ics = generateICSFile(makeEvent());
    expect(ics).toContain("\r\n");
  });

  it("escapes special characters in text fields", () => {
    const ics = generateICSFile(makeEvent({
      title: "Workshop; with, special\\ chars",
      description: "Line1\nLine2",
      location: "Room; 301",
    }));

    expect(ics).toContain("SUMMARY:Workshop\\; with\\, special\\\\ chars");
    expect(ics).toContain("LOCATION:Room\\; 301");
  });
});

// ──────────────────────────────────────────────
// 10.2.3  Apple Calendar URL
// ──────────────────────────────────────────────

describe("generateAppleCalendarUrl", () => {
  it("falls back to Google Calendar URL", () => {
    const evt = makeEvent();
    const appleUrl = generateAppleCalendarUrl(evt);
    const googleUrl = generateGoogleCalendarUrl(evt);

    // Currently Apple falls back to Google Calendar
    expect(appleUrl).toBe(googleUrl);
  });

  it("includes calendar.google.com", () => {
    const url = generateAppleCalendarUrl(makeEvent());
    expect(url).toContain("calendar.google.com");
  });
});
