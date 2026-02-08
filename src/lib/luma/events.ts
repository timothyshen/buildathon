import { lumaFetch } from "./client";
import type { LumaListEventsResponse, LumaEventEntry } from "@/types/luma";
import type { CalendarEvent } from "@/types";

const USE_MOCK = !process.env.LUMA_API_KEY;

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

// ── Mock data for development without a Luma API key ──

function generateMockEvents(): CalendarEvent[] {
  const now = new Date();
  const day = (offset: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  return [
    {
      id: "evt-mock-1",
      title: "Story Protocol 101: Getting Started",
      description:
        "An introductory workshop covering the fundamentals of Story Protocol — what it is, how it works, and how to start building with programmable IP.",
      startAt: day(1, 14),
      endAt: day(1, 15),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-1",
      coverUrl: "https://picsum.photos/seed/sp101/800/400",
      location: "Online",
      meetingUrl: "https://meet.google.com/mock-link",
      hostName: "Story Protocol",
      category: "Basics",
      tags: ["Basics"],
      lumaApiId: "evt-mock-1",
    },
    {
      id: "evt-mock-2",
      title: "Advanced IP Licensing Workshop",
      description:
        "Deep dive into programmable IP licensing — commercial vs non-commercial licenses, remix trees, and royalty flows on Story Protocol.",
      startAt: day(3, 11),
      endAt: day(3, 12),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-2",
      coverUrl: "https://picsum.photos/seed/adv-ip/800/400",
      location: "Online",
      hostName: "IP Labs",
      category: "Advanced",
      tags: ["Advanced"],
      lumaApiId: "evt-mock-2",
    },
    {
      id: "evt-mock-3",
      title: "Building AI Agents on Story",
      description:
        "Learn how to build AI agents that interact with Story Protocol to register, license, and remix IP assets autonomously.",
      startAt: day(5, 16),
      endAt: day(5, 17),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-3",
      coverUrl: "https://picsum.photos/seed/ai-agents/800/400",
      location: "Online",
      hostName: "AI x Crypto Labs",
      category: "Advanced",
      tags: ["Advanced"],
      lumaApiId: "evt-mock-3",
    },
    {
      id: "evt-mock-4",
      title: "Founder Office Hours",
      description:
        "Open office hours with the Story Protocol founding team. Bring your questions about building on Story, fundraising, or go-to-market strategy.",
      startAt: day(7, 10),
      endAt: day(7, 11),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-4",
      location: "Online",
      hostName: "Story Protocol",
      category: "Business",
      tags: ["Business"],
      lumaApiId: "evt-mock-4",
    },
    {
      id: "evt-mock-5",
      title: "Smart Contract Security for IP",
      description:
        "Workshop on writing secure smart contracts for IP registration, covering common pitfalls and best practices with Solidity on Story.",
      startAt: day(10, 13),
      endAt: day(10, 14),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-5",
      coverUrl: "https://picsum.photos/seed/security/800/400",
      location: "Online",
      hostName: "OpenZeppelin",
      category: "Advanced",
      tags: ["Advanced"],
      lumaApiId: "evt-mock-5",
    },
    {
      id: "evt-mock-6",
      title: "Demo Day Prep: Pitch Clinic",
      description:
        "Get feedback on your buildathon pitch deck and demo from experienced founders and investors before the final demo day.",
      startAt: day(12, 15),
      endAt: day(12, 16),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-6",
      location: "Online",
      hostName: "SWA Team",
      category: "Business",
      tags: ["Business"],
      lumaApiId: "evt-mock-6",
    },
    {
      id: "evt-mock-7",
      title: "Story Protocol SDK Deep Dive",
      description:
        "Hands-on walkthrough of the Story Protocol TypeScript SDK — from project setup to registering your first IP asset and creating license tokens.",
      startAt: day(0, 17),
      endAt: day(0, 18),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-7",
      coverUrl: "https://picsum.photos/seed/sdk/800/400",
      location: "Online",
      meetingUrl: "https://meet.google.com/mock-sdk",
      hostName: "Story Protocol",
      category: "Basics",
      tags: ["Basics"],
      lumaApiId: "evt-mock-7",
    },
    {
      id: "evt-mock-8",
      title: "Tokenomics & IP Monetization",
      description:
        "Explore different monetization models for on-chain IP — royalty splits, license tiers, and token-gated access patterns.",
      startAt: day(15, 11),
      endAt: day(15, 12),
      timezone: "America/Los_Angeles",
      eventUrl: "https://lu.ma/mock-event-8",
      location: "San Francisco, CA",
      hostName: "Token Engineering Labs",
      category: "Business",
      tags: ["Business"],
      lumaApiId: "evt-mock-8",
    },
  ];
}

// ── Public API ──

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
  if (USE_MOCK) {
    console.log("[Luma] Using mock events (LUMA_API_KEY not set)");
    return { events: generateMockEvents(), hasMore: false };
  }

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
  if (USE_MOCK) {
    console.log(`[Luma Mock] RSVP: ${email} → ${eventApiId}`);
    return;
  }

  await lumaFetch("/v1/event/add-guests", {
    method: "POST",
    body: JSON.stringify({
      event_api_id: eventApiId,
      guests: [{ email, name }],
    }),
  });
}
