import { NextResponse } from "next/server";
import { fetchLumaEvents } from "@/lib/luma/events";

// In-memory cache with TTL
let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after") || undefined;
    const before = searchParams.get("before") || undefined;

    // Use cache for default (no params) requests
    const isDefaultRequest = !after && !before;
    if (
      isDefaultRequest &&
      cachedResponse &&
      Date.now() - cachedResponse.timestamp < CACHE_TTL_MS
    ) {
      return NextResponse.json(cachedResponse.data);
    }

    const result = await fetchLumaEvents({ after, before });

    // Serialize dates for JSON transport
    const serialized = {
      events: result.events.map((e) => ({
        ...e,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
      })),
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };

    if (isDefaultRequest) {
      cachedResponse = { data: serialized, timestamp: Date.now() };
    }

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
