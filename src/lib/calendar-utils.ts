import { CalendarEvent } from "@/types";

/**
 * Formats a Date object to Google Calendar's required format (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, "");
}

/**
 * Formats a Date object to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, "");
}

/**
 * Escapes special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates a Google Calendar URL for an event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  const details = [
    event.description,
    event.meetingUrl ? `\n\nJoin: ${event.meetingUrl}` : "",
    event.eventUrl ? `\n\nEvent page: ${event.eventUrl}` : "",
  ]
    .filter(Boolean)
    .join("");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: details,
    location: event.location || "Online",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates ICS file content for an event
 */
export function generateICSFile(event: CalendarEvent): string {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const now = new Date();
  const uid = `${event.id}@swa.xyz`;

  const description = [
    event.description,
    event.meetingUrl ? `Join: ${event.meetingUrl}` : "",
    event.eventUrl ? `Event page: ${event.eventUrl}` : "",
  ]
    .filter(Boolean)
    .join("\\n\\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SWA//Workshop Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `LOCATION:${escapeICSText(event.location || "Online")}`,
    event.eventUrl ? `URL:${event.eventUrl}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icsContent;
}

/**
 * Downloads an ICS file for an event
 */
export function downloadICSFile(event: CalendarEvent): void {
  const icsContent = generateICSFile(event);
  if (!icsContent) return;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const sanitizedTitle = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "event";

  const filename = `${sanitizedTitle}.ics`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generates an Apple Calendar URL for an event
 * Falls back to Google Calendar URL as Apple doesn't have a direct web URL
 */
export function generateAppleCalendarUrl(event: CalendarEvent): string {
  return generateGoogleCalendarUrl(event);
}
