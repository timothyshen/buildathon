import { NextResponse } from "next/server";
import { fetchLumaEvents, fetchAllLumaEvents } from "@/lib/luma/events";

// In-memory cache with TTL
let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    const serialize = (events: Awaited<ReturnType<typeof fetchAllLumaEvents>>) =>
      events.map((e) => ({
        ...e,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
      }));

    if (isDefaultRequest) {
      // Paginate through all events for the full calendar
      const allEvents = await fetchAllLumaEvents();
      const serialized = { events: serialize(allEvents), hasMore: false };

      cachedResponse = { data: serialized, timestamp: Date.now() };
      return NextResponse.json(serialized);
    }

    // Targeted request with date filters — single page
    const result = await fetchLumaEvents({ after, before });
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
