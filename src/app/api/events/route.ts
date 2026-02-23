import { NextResponse } from "next/server";
import { fetchLumaEvents, fetchAllLumaEvents } from "@/lib/luma/events";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarEvent } from "@/types";

// In-memory cache with TTL
let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function attachAttendeeCounts(
  events: { lumaApiId: string }[]
): Promise<Map<string, number>> {
  if (events.length === 0) return new Map();

  const adminClient = createAdminClient();
  const eventIds = events.map((e) => e.lumaApiId);

  // Count RSVPs per event using a raw count query
  const { data, error } = await adminClient
    .from("event_rsvps")
    .select("luma_event_id")
    .in("luma_event_id", eventIds);

  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const row of data) {
    const id = row.luma_event_id;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after") || undefined;
    const before = searchParams.get("before") || undefined;

    // Default request: fetch ALL pages so the calendar has every event
    const isDefaultRequest = !after && !before;

    if (
      isDefaultRequest &&
      cachedResponse &&
      Date.now() - cachedResponse.timestamp < CACHE_TTL_MS
    ) {
      return NextResponse.json(cachedResponse.data);
    }

    // Serialize helper
    const serialize = (events: CalendarEvent[]) =>
      events.map((e) => ({
        ...e,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
      }));

    if (isDefaultRequest) {
      // Paginate through all events for the full calendar
      const allEvents = await fetchAllLumaEvents();

      // Attach local RSVP counts
      const counts = await attachAttendeeCounts(allEvents);
      for (const event of allEvents) {
        event.attendeeCount = counts.get(event.lumaApiId) || 0;
      }

      const serialized = { events: serialize(allEvents), hasMore: false };

      cachedResponse = { data: serialized, timestamp: Date.now() };
      return NextResponse.json(serialized);
    }

    // Targeted request with date filters — single page
    const result = await fetchLumaEvents({ after, before });

    // Attach local RSVP counts
    const counts = await attachAttendeeCounts(result.events);
    for (const event of result.events) {
      event.attendeeCount = counts.get(event.lumaApiId) || 0;
    }

    const serialized = {
      events: serialize(result.events),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("[Events API] Error:", err);
    // Return cached data on error if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse.data);
    }
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
