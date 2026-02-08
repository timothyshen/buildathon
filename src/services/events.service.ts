import type { CalendarEvent } from "@/types";

type SerializedCalendarEvent = Omit<CalendarEvent, "startAt" | "endAt"> & {
  startAt: string;
  endAt: string;
};

export interface EventsListResponse {
  events: CalendarEvent[];
  hasMore: boolean;
  nextCursor?: string;
}

async function listEvents(options?: {
  after?: string;
  before?: string;
}): Promise<EventsListResponse> {
  const params = new URLSearchParams();
  if (options?.after) params.set("after", options.after);
  if (options?.before) params.set("before", options.before);

  const url = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch events");

  return {
    events: (data.events as SerializedCalendarEvent[]).map(
      (e) => ({
        ...e,
        startAt: new Date(e.startAt),
        endAt: new Date(e.endAt),
      })
    ),
    hasMore: data.hasMore,
    nextCursor: data.nextCursor,
  };
}

async function rsvp(
  eventApiId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/events/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventApiId }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error };
  return { success: true };
}

async function getUserRsvps(): Promise<string[]> {
  const res = await fetch("/api/events/rsvp");
  const data = await res.json();
  return data.rsvps || [];
}

export const eventsService = { listEvents, rsvp, getUserRsvps };
