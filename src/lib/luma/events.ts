import { lumaFetch } from "./client";
import type { LumaListEventsResponse, LumaEventEntry } from "@/types/luma";
import type { CalendarEvent } from "@/types";

export function mapLumaEventToCalendarEvent(
  entry: LumaEventEntry
): CalendarEvent {
  const { event } = entry;
  const geo = event.geo_address_json;
  const host = event.hosts?.[0];

  return {
    id: event.api_id,
    title: event.name,
    description: event.description,
    descriptionMd: event.description_md,
    startAt: new Date(event.start_at),
    endAt: new Date(event.end_at),
    timezone: event.timezone,
    eventUrl: event.url,
    coverUrl: event.cover_url,
    meetingUrl: event.meeting_url,
    location:
      geo?.description || geo?.full_address || geo?.city || undefined,
    hostName: host?.name,
    hostAvatar: host?.avatar_url,
    category: entry.tags?.[0] || "Event",
    tags: entry.tags,
    lumaApiId: event.api_id,
  };
}

export async function fetchLumaEvents(options?: {
  after?: string;
  before?: string;
  cursor?: string;
  limit?: number;
}): Promise<{
  events: CalendarEvent[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const params = new URLSearchParams({
    sort_column: "start_at",
    sort_direction: "asc",
    pagination_limit: String(options?.limit ?? 50),
  });

  if (options?.after) params.set("after", options.after);
  if (options?.before) params.set("before", options.before);
  if (options?.cursor) params.set("pagination_cursor", options.cursor);

  const data = await lumaFetch<LumaListEventsResponse>(
    `/v1/calendar/list-events?${params.toString()}`
  );

  return {
    events: data.entries.map(mapLumaEventToCalendarEvent),
    hasMore: data.has_more,
    nextCursor: data.next_cursor,
  };
}

export async function addGuestToEvent(
  eventApiId: string,
  email: string,
  name?: string
): Promise<void> {
  await lumaFetch("/v1/event/add-guests", {
    method: "POST",
    body: JSON.stringify({
      event_api_id: eventApiId,
      guests: [{ email, name }],
    }),
  });
}
