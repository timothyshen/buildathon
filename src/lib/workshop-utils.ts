/**
 * Workshop Utilities
 * Pure helper functions extracted from workshop components for testability.
 */

import type { CalendarEvent } from "@/types";

// ── Category helpers ──────────────────────────────────────

export function getCategoryClassName(category: string): string {
  switch (category.toLowerCase()) {
    case "basics":
      return "bg-category-technical/10 text-category-technical border-category-technical/20";
    case "advanced":
      return "bg-category-design/10 text-category-design border-category-design/20";
    case "business":
      return "bg-category-business/10 text-category-business border-category-business/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// ── Time / duration formatting ────────────────────────────

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDuration(startAt: Date | string, endAt: Date | string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${diffMins} min`;
}

// ── Calendar date helpers ─────────────────────────────────

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const days: Date[] = [];
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((event) => isSameDay(new Date(event.startAt), date));
}
