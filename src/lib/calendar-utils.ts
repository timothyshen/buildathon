import { Workshop } from "@/types";

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
 * Generates a Google Calendar URL for a workshop
 * @param workshop - The workshop to create a calendar event for
 * @returns Google Calendar URL string, or empty string if no scheduledAt date
 */
export function generateGoogleCalendarUrl(workshop: Workshop): string {
  if (!workshop.scheduledAt) return "";

  const startDate = new Date(workshop.scheduledAt);
  const endDate = workshop.endTime
    ? new Date(workshop.endTime)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  const details = [
    workshop.description,
    workshop.meetingUrl ? `\n\nJoin: ${workshop.meetingUrl}` : "",
  ]
    .filter(Boolean)
    .join("");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: workshop.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: details,
    location: workshop.location || "Online",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates ICS file content for a workshop
 * @param workshop - The workshop to create an ICS file for
 * @returns ICS file content string, or empty string if no scheduledAt date
 */
export function generateICSFile(workshop: Workshop): string {
  if (!workshop.scheduledAt) return "";

  const startDate = new Date(workshop.scheduledAt);
  const endDate = workshop.endTime
    ? new Date(workshop.endTime)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  const now = new Date();
  const uid = `${workshop.id}@swa.xyz`;

  const description = [
    workshop.description,
    workshop.meetingUrl ? `Join: ${workshop.meetingUrl}` : "",
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
    `SUMMARY:${escapeICSText(workshop.title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `LOCATION:${escapeICSText(workshop.location || "Online")}`,
    workshop.meetingUrl ? `URL:${workshop.meetingUrl}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icsContent;
}

/**
 * Downloads an ICS file for a workshop
 * @param workshop - The workshop to download an ICS file for
 */
export function downloadICSFile(workshop: Workshop): void {
  const icsContent = generateICSFile(workshop);
  if (!icsContent) return;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Create a sanitized filename from the workshop title
  const sanitizedTitle = workshop.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const filename = `${sanitizedTitle}.ics`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Generates an Apple Calendar URL for a workshop
 * Uses webcal:// protocol which iOS and macOS recognize
 * Falls back to Google Calendar URL as Apple doesn't have a direct web URL
 * @param workshop - The workshop to create a calendar event for
 * @returns Apple Calendar compatible URL string, or empty string if no scheduledAt date
 */
export function generateAppleCalendarUrl(workshop: Workshop): string {
  if (!workshop.scheduledAt) return "";

  // Apple Calendar doesn't have a direct web URL like Google Calendar
  // The webcal:// protocol requires a hosted .ics file URL
  // As a fallback, we return the Google Calendar URL which works on all platforms
  return generateGoogleCalendarUrl(workshop);
}
