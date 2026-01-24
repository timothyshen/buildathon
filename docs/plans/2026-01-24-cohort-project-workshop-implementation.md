# Cohort, Project & Workshop Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build public cohort listing/detail pages, project showcase/submission detail pages, and a workshop page with interactive calendar featuring month/agenda views and RSVP functionality.

**Architecture:** Public pages at `/cohorts`, `/cohorts/[slug]`, `/projects/[id]`, `/workshops`. Protected submission detail at `/(dashboard)/submissions/[id]`. Calendar built with custom components. RSVP requires authentication.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Radix UI components, Lucide icons

---

## Task 1: Extend Types for Workshop Scheduling & RSVP

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add scheduling fields to Workshop type**

Add after line 149 (before `createdAt`):

```typescript
  // Scheduling fields
  scheduledAt?: Date;
  endTime?: Date;
  timezone?: string;
  isLive?: boolean;
  maxAttendees?: number;
  location?: string;
  meetingUrl?: string;
```

**Step 2: Add WorkshopRSVP type**

Add after WorkshopVersion interface (after line 201):

```typescript
export type RSVPStatus = "registered" | "attended" | "cancelled";

export interface WorkshopRSVP {
  id: string;
  workshopId: string;
  userId: string;
  user?: User;
  status: RSVPStatus;
  registeredAt: Date;
}
```

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add workshop scheduling and RSVP types"
```

---

## Task 2: Update Mock Data with Scheduled Workshops & RSVPs

**Files:**
- Modify: `src/data/mock-data.ts`

**Step 1: Update mockWorkshops with scheduling data**

Replace the mockWorkshops array with updated entries that include `scheduledAt`, `endTime`, `timezone`, `isLive`, `location`:

```typescript
// Mock Workshops (with scheduling)
export const mockWorkshops: Workshop[] = [
  {
    id: "workshop-1",
    title: "Getting Started with Story Protocol",
    description: "Learn the basics of Story Protocol and how to register your first IP asset.",
    content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Welcome to Story Protocol!" }] }] }),
    videoUrl: "https://youtube.com/watch?v=intro",
    partnerName: "Story Foundation",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=story",
    category: "Basics",
    duration: "30 min",
    status: "published",
    createdBy: "user-1",
    scheduledAt: new Date("2026-01-27T10:00:00"),
    endTime: new Date("2026-01-27T10:30:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    maxAttendees: 100,
    location: "Online",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    publishedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "workshop-2",
    title: "Building AI Agents on Story",
    description: "Deep dive into creating AI agents that interact with IP assets.",
    videoUrl: "https://youtube.com/watch?v=ai-agents",
    articleUrl: "https://docs.story.foundation/ai-agents",
    partnerName: "AI Labs",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=ailabs",
    sponsorId: "sponsor-2",
    category: "Advanced",
    duration: "45 min",
    status: "published",
    createdBy: "user-5",
    scheduledAt: new Date("2026-01-28T14:00:00"),
    endTime: new Date("2026-01-28T14:45:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    maxAttendees: 50,
    location: "Online",
    publishedAt: new Date("2024-02-20"),
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "workshop-3",
    title: "IP Licensing 101",
    description: "Understanding programmable licenses and royalty policies.",
    articleUrl: "https://docs.story.foundation/licensing",
    partnerName: "Story Foundation",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=story",
    category: "Basics",
    duration: "20 min",
    status: "published",
    createdBy: "user-1",
    scheduledAt: new Date("2026-01-30T16:00:00"),
    endTime: new Date("2026-01-30T16:20:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    publishedAt: new Date("2024-03-01"),
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "workshop-4",
    title: "From Hackathon to Production",
    description: "How to take your buildathon project and turn it into a real product.",
    videoUrl: "https://youtube.com/watch?v=production",
    partnerName: "Builder Academy",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=builder",
    category: "Business",
    duration: "60 min",
    status: "published",
    createdBy: "user-1",
    scheduledAt: new Date("2026-02-03T11:00:00"),
    endTime: new Date("2026-02-03T12:00:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    maxAttendees: 200,
    location: "Online",
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-04-10"),
  },
  {
    id: "workshop-5",
    title: "Smart Contract Security for IP",
    description: "Best practices for securing your IP-related smart contracts.",
    partnerName: "Security DAO",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=security",
    category: "Advanced",
    duration: "45 min",
    status: "published",
    createdBy: "user-1",
    scheduledAt: new Date("2026-02-05T15:00:00"),
    endTime: new Date("2026-02-05T15:45:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    publishedAt: new Date("2024-04-15"),
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-15"),
  },
  {
    id: "workshop-6",
    title: "Tokenizing Creative Works",
    description: "Learn how to tokenize art, music, and other creative works as IP assets.",
    partnerName: "Creative Labs",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=creative",
    category: "Basics",
    duration: "35 min",
    status: "published",
    createdBy: "user-1",
    scheduledAt: new Date("2026-02-10T13:00:00"),
    endTime: new Date("2026-02-10T13:35:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    maxAttendees: 75,
    location: "Online",
    publishedAt: new Date("2024-05-01"),
    createdAt: new Date("2024-04-25"),
    updatedAt: new Date("2024-05-01"),
  },
];
```

**Step 2: Add mockWorkshopRSVPs**

Add after mockWorkshopVersions:

```typescript
// Mock Workshop RSVPs
export const mockWorkshopRSVPs: WorkshopRSVP[] = [
  {
    id: "rsvp-1",
    workshopId: "workshop-1",
    userId: "user-3",
    user: mockUsers[2],
    status: "registered",
    registeredAt: new Date("2026-01-20"),
  },
  {
    id: "rsvp-2",
    workshopId: "workshop-1",
    userId: "user-4",
    user: mockUsers[3],
    status: "registered",
    registeredAt: new Date("2026-01-21"),
  },
  {
    id: "rsvp-3",
    workshopId: "workshop-2",
    userId: "user-3",
    user: mockUsers[2],
    status: "registered",
    registeredAt: new Date("2026-01-22"),
  },
];
```

**Step 3: Add helper functions**

Add at the end of the file:

```typescript
// Helper function to get workshops by date range
export function getWorkshopsByDateRange(start: Date, end: Date): Workshop[] {
  return mockWorkshops.filter(w => {
    if (!w.scheduledAt) return false;
    return w.scheduledAt >= start && w.scheduledAt <= end;
  });
}

// Helper function to get RSVPs by workshop
export function getRSVPsByWorkshop(workshopId: string): WorkshopRSVP[] {
  return mockWorkshopRSVPs.filter(r => r.workshopId === workshopId);
}

// Helper function to get RSVPs by user
export function getRSVPsByUser(userId: string): WorkshopRSVP[] {
  return mockWorkshopRSVPs.filter(r => r.userId === userId);
}

// Helper function to get submissions by cohort
export function getSubmissionsByCohort(cohortId: string): Submission[] {
  return mockSubmissions.filter(s => s.cohortId === cohortId);
}

// Helper function to get cohort by slug
export function getCohortBySlug(slug: string): Cohort | undefined {
  return mockCohorts.find(c => c.slug === slug);
}

// Helper function to get submission by id
export function getSubmissionById(id: string): Submission | undefined {
  return mockSubmissions.find(s => s.id === id);
}
```

**Step 4: Update import to include WorkshopRSVP type**

Update the import at the top:

```typescript
import type { User, Cohort, Track, Team, Submission, Review, Workshop, Template, Sponsor, MediaAsset, WorkshopVersion, WorkshopRSVP } from "@/types";
```

**Step 5: Commit**

```bash
git add src/data/mock-data.ts
git commit -m "feat: add scheduled workshops and RSVP mock data"
```

---

## Task 3: Create Cohort Card Component

**Files:**
- Create: `src/components/cohorts/cohort-card.tsx`

**Step 1: Create the cohort card component**

```typescript
import Link from "next/link";
import { Cohort } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy } from "lucide-react";
import { getTracksByCohort } from "@/data/mock-data";

interface CohortCardProps {
  cohort: Cohort;
}

export function CohortCard({ cohort }: CohortCardProps) {
  const tracks = getTracksByCohort(cohort.id);
  const totalPrizePool = cohort.prizes?.reduce((acc, p) => {
    const amount = parseInt(p.amount.replace(/[^0-9]/g, "")) || 0;
    return acc + amount;
  }, 0) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "judging":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const yearOptions: Intl.DateTimeFormatOptions = { year: "numeric" };

    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}, ${endDate.toLocaleDateString("en-US", yearOptions)}`;
  };

  return (
    <Link href={`/cohorts/${cohort.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <div
          className="h-32 rounded-t-xl bg-gradient-to-r from-indigo-500 to-purple-600"
          style={cohort.bannerImage ? { backgroundImage: `url(${cohort.bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{cohort.name}</CardTitle>
            <Badge className={getStatusColor(cohort.status)}>{cohort.status}</Badge>
          </div>
          {cohort.tagline && (
            <CardDescription>{cohort.tagline}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange(cohort.startDate, cohort.endDate)}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{tracks.length} tracks</span>
              </div>
              {totalPrizePool > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span>${totalPrizePool.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cohorts/cohort-card.tsx
git commit -m "feat: add cohort card component"
```

---

## Task 4: Create Cohort Listing Page

**Files:**
- Create: `src/app/cohorts/page.tsx`

**Step 1: Create the cohort listing page**

```typescript
"use client";

import { useState } from "react";
import { mockCohorts } from "@/data/mock-data";
import { CohortCard } from "@/components/cohorts/cohort-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type FilterStatus = "all" | "upcoming" | "active" | "completed";

export default function CohortsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const publicCohorts = mockCohorts.filter(c => c.isPublic);

  const filteredCohorts = publicCohorts.filter(cohort => {
    if (filter === "all") return true;
    if (filter === "completed") return cohort.status === "completed" || cohort.status === "judging";
    return cohort.status === filter;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white">Explore Buildathons</h1>
          <p className="mt-2 text-lg text-indigo-100">
            Join our buildathons and build the future of programmable IP
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredCohorts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No buildathons found for this filter.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCohorts.map(cohort => (
                  <CohortCard key={cohort.id} cohort={cohort} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/cohorts/page.tsx
git commit -m "feat: add public cohort listing page"
```

---

## Task 5: Create Cohort Detail Page Components

**Files:**
- Create: `src/components/cohorts/cohort-hero.tsx`
- Create: `src/components/cohorts/cohort-timeline.tsx`
- Create: `src/components/cohorts/cohort-tracks.tsx`

**Step 1: Create cohort hero component**

```typescript
import { Cohort } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";

interface CohortHeroProps {
  cohort: Cohort;
}

export function CohortHero({ cohort }: CohortHeroProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "judging":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="relative bg-gradient-to-r from-indigo-600 to-purple-600 py-16"
      style={cohort.bannerImage ? { backgroundImage: `url(${cohort.bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {cohort.bannerImage && <div className="absolute inset-0 bg-black/50" />}
      <div className="container relative mx-auto px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-white">{cohort.name}</h1>
          <Badge className={getStatusColor(cohort.status)}>{cohort.status}</Badge>
        </div>
        {cohort.tagline && (
          <p className="mt-2 text-xl text-indigo-100">{cohort.tagline}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-6 text-white/90">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Submissions due {formatDate(cohort.submissionDeadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Max {cohort.maxTeamSize} per team</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create cohort timeline component**

```typescript
import { Cohort } from "@/types";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface CohortTimelineProps {
  cohort: Cohort;
}

export function CohortTimeline({ cohort }: CohortTimelineProps) {
  const now = new Date();

  const events = [
    { label: "Buildathon Starts", date: cohort.startDate, key: "start" },
    { label: "Submission Deadline", date: cohort.submissionDeadline, key: "deadline" },
    { label: "Judging Begins", date: cohort.judgingStart, key: "judging" },
    { label: "Winners Announced", date: cohort.judgingEnd, key: "winners" },
  ];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatus = (date: Date) => {
    const eventDate = new Date(date);
    if (now > eventDate) return "completed";
    return "pending";
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Timeline</h3>
      <div className="relative">
        {events.map((event, index) => {
          const status = getStatus(event.date);
          return (
            <div key={event.key} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                {status === "completed" ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
                {index < events.length - 1 && (
                  <div className={`mt-1 h-full w-0.5 ${status === "completed" ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${status === "completed" ? "text-green-700" : ""}`}>
                  {event.label}
                </p>
                <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 3: Create cohort tracks component**

```typescript
import { Track } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface CohortTracksProps {
  tracks: Track[];
}

export function CohortTracks({ tracks }: CohortTracksProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tracks.map(track => (
        <Card key={track.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{track.name}</CardTitle>
                {track.sponsorName && (
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {track.sponsorLogo && (
                      <img src={track.sponsorLogo} alt={track.sponsorName} className="h-5 w-5 rounded" />
                    )}
                    Sponsored by {track.sponsorName}
                  </CardDescription>
                )}
              </div>
              {track.prizePool && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {track.prizePool}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{track.description}</p>
            {track.requirements && track.requirements.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">Requirements:</p>
                <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                  {track.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/cohorts/cohort-hero.tsx src/components/cohorts/cohort-timeline.tsx src/components/cohorts/cohort-tracks.tsx
git commit -m "feat: add cohort detail components (hero, timeline, tracks)"
```

---

## Task 6: Create Cohort Detail Page

**Files:**
- Create: `src/app/cohorts/[slug]/page.tsx`

**Step 1: Create the cohort detail page**

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCohortBySlug, getTracksByCohort, getSponsorsByCohort, getSubmissionsByCohort } from "@/data/mock-data";
import { CohortHero } from "@/components/cohorts/cohort-hero";
import { CohortTimeline } from "@/components/cohorts/cohort-timeline";
import { CohortTracks } from "@/components/cohorts/cohort-tracks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ExternalLink } from "lucide-react";

interface CohortDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CohortDetailPage({ params }: CohortDetailPageProps) {
  const { slug } = await params;
  const cohort = getCohortBySlug(slug);

  if (!cohort) {
    notFound();
  }

  const tracks = getTracksByCohort(cohort.id);
  const sponsors = getSponsorsByCohort(cohort.id);
  const submissions = getSubmissionsByCohort(cohort.id);

  const tierOrder = ["platinum", "gold", "silver", "bronze", "community"];
  const sponsorsByTier = tierOrder.reduce((acc, tier) => {
    const tierSponsors = sponsors.filter(s => s.tier === tier);
    if (tierSponsors.length > 0) {
      acc[tier] = tierSponsors;
    }
    return acc;
  }, {} as Record<string, typeof sponsors>);

  return (
    <div className="min-h-screen">
      <CohortHero cohort={cohort} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          {cohort.status === "active" && (
            <Button asChild>
              <Link href="/submit">Submit Your Project</Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracks">Tracks ({tracks.length})</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors ({sponsors.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{cohort.description}</p>
                  </CardContent>
                </Card>

                {cohort.prizes && cohort.prizes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Prizes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {cohort.prizes.map((prize, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="font-medium">{prize.place} Place</p>
                              {prize.description && (
                                <p className="text-sm text-muted-foreground">{prize.description}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-lg">{prize.amount}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <CohortTimeline cohort={cohort} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracks" className="mt-6">
            {tracks.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No tracks available yet.</p>
            ) : (
              <CohortTracks tracks={tracks} />
            )}
          </TabsContent>

          <TabsContent value="sponsors" className="mt-6">
            {sponsors.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No sponsors yet.</p>
            ) : (
              <div className="space-y-8">
                {Object.entries(sponsorsByTier).map(([tier, tierSponsors]) => (
                  <div key={tier}>
                    <h3 className="mb-4 text-lg font-semibold capitalize">{tier} Sponsors</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tierSponsors.map(sponsor => (
                        <Card key={sponsor.id}>
                          <CardContent className="flex items-center gap-4 p-4">
                            <img src={sponsor.logo} alt={sponsor.name} className="h-12 w-12 rounded" />
                            <div className="flex-1">
                              <p className="font-medium">{sponsor.name}</p>
                              <a
                                href={sponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                              >
                                Visit website <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            {submissions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No projects submitted yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {submissions.filter(s => s.status !== "draft").map(submission => (
                  <Link key={submission.id} href={`/projects/${submission.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{submission.title}</CardTitle>
                          {submission.status === "winner" && (
                            <Badge className="bg-yellow-100 text-yellow-800">Winner</Badge>
                          )}
                        </div>
                        <CardDescription>{submission.tagline}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {submission.techStack.slice(0, 3).map(tech => (
                            <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                          ))}
                          {submission.techStack.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{submission.techStack.length - 3}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/cohorts/[slug]/page.tsx
git commit -m "feat: add cohort detail page"
```

---

## Task 7: Create Project Card Component

**Files:**
- Create: `src/components/projects/project-card.tsx`

**Step 1: Create the project card component**

```typescript
import Link from "next/link";
import { Submission } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Submission;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        {project.screenshots && project.screenshots.length > 0 && (
          <div
            className="h-40 rounded-t-xl bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url(${project.screenshots[0]})` }}
          />
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            {project.status === "winner" && (
              <Badge className="bg-yellow-100 text-yellow-800">Winner</Badge>
            )}
          </div>
          <CardDescription>{project.tagline}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            <div className="flex flex-wrap gap-1">
              {project.techStack.slice(0, 4).map(tech => (
                <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
              ))}
            </div>
            {project.team && (
              <p className="text-sm text-muted-foreground">by {project.team.name}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/projects/project-card.tsx
git commit -m "feat: add project card component"
```

---

## Task 8: Create Project Detail Components

**Files:**
- Create: `src/components/projects/project-hero.tsx`
- Create: `src/components/projects/project-gallery.tsx`
- Create: `src/components/projects/project-team.tsx`

**Step 1: Create project hero component**

```typescript
import { Submission } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Play, FileText } from "lucide-react";

interface ProjectHeroProps {
  project: Submission;
}

export function ProjectHero({ project }: ProjectHeroProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "winner":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>
        {project.tagline && (
          <p className="text-xl text-slate-300">{project.tagline}</p>
        )}
        {project.team && (
          <p className="mt-2 text-slate-400">by {project.team.name}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {project.demoUrl && (
            <Button asChild>
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Demo
              </a>
            </Button>
          )}
          {project.repoUrl && (
            <Button variant="secondary" asChild>
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View Repo
              </a>
            </Button>
          )}
          {project.videoUrl && (
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" asChild>
              <a href={project.videoUrl} target="_blank" rel="noopener noreferrer">
                <Play className="mr-2 h-4 w-4" />
                Watch Video
              </a>
            </Button>
          )}
          {project.presentationUrl && (
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" asChild>
              <a href={project.presentationUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                View Presentation
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create project gallery component**

```typescript
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectGalleryProps {
  screenshots: string[];
  videoUrl?: string;
}

export function ProjectGallery({ screenshots, videoUrl }: ProjectGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMedia = screenshots.length > 0 || videoUrl;
  if (!hasMedia) return null;

  const items = [
    ...(videoUrl ? [{ type: "video" as const, url: videoUrl }] : []),
    ...screenshots.map(url => ({ type: "image" as const, url })),
  ];

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const currentItem = items[currentIndex];

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="relative aspect-video bg-muted">
        {currentItem.type === "video" ? (
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(currentItem.url)}`}
            title="Project video"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img
            src={currentItem.url}
            alt={`Screenshot ${currentIndex + 1}`}
            className="h-full w-full object-cover"
          />
        )}

        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 p-2 overflow-x-auto">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-16 w-24 flex-shrink-0 rounded overflow-hidden border-2 ${
                index === currentIndex ? "border-primary" : "border-transparent"
              }`}
            >
              {item.type === "video" ? (
                <div className="h-full w-full bg-slate-800 flex items-center justify-center text-white text-xs">
                  Video
                </div>
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create project team component**

```typescript
import { Team } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Twitter } from "lucide-react";

interface ProjectTeamProps {
  team: Team;
}

export function ProjectTeam({ team }: ProjectTeamProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Team: {team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {team.members.map(member => (
            <div key={member.userId} className="flex items-center gap-3">
              <img
                src={member.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.name}`}
                alt={member.user.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{member.user.name}</p>
                  {member.role === "lead" && (
                    <Badge variant="secondary" className="text-xs">Lead</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {member.user.github && (
                    <a
                      href={`https://github.com/${member.user.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {member.user.twitter && (
                    <a
                      href={`https://twitter.com/${member.user.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/projects/project-hero.tsx src/components/projects/project-gallery.tsx src/components/projects/project-team.tsx
git commit -m "feat: add project detail components (hero, gallery, team)"
```

---

## Task 9: Create Public Project Showcase Page

**Files:**
- Create: `src/app/projects/[id]/page.tsx`

**Step 1: Create the public project page**

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubmissionById, getSubmissionsByCohort, getTracksByCohort } from "@/data/mock-data";
import { ProjectHero } from "@/components/projects/project-hero";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { ProjectCard } from "@/components/projects/project-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck } from "lucide-react";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = getSubmissionById(id);

  if (!project || project.status === "draft") {
    notFound();
  }

  const tracks = project.cohortId ? getTracksByCohort(project.cohortId) : [];
  const projectTrack = tracks.find(t => t.id === project.trackId);

  const relatedProjects = project.cohortId
    ? getSubmissionsByCohort(project.cohortId)
        .filter(s => s.id !== project.id && s.status !== "draft")
        .slice(0, 3)
    : [];

  const getLicenseLabel = (license?: string) => {
    switch (license) {
      case "non-commercial":
        return "Non-Commercial";
      case "commercial-use":
        return "Commercial Use";
      case "commercial-remix":
        return "Commercial Remix";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen">
      <ProjectHero project={project} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ProjectGallery screenshots={project.screenshots} videoUrl={project.videoUrl} />

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>

                {project.builtWithStory && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Built with Story Protocol</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <Badge key={tech} variant="secondary">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {projectTrack && (
              <Card>
                <CardHeader>
                  <CardTitle>Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {projectTrack.sponsorLogo && (
                      <img src={projectTrack.sponsorLogo} alt="" className="h-10 w-10 rounded" />
                    )}
                    <div>
                      <p className="font-medium">{projectTrack.name}</p>
                      {projectTrack.sponsorName && (
                        <p className="text-sm text-muted-foreground">Sponsored by {projectTrack.sponsorName}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {project.team && <ProjectTeam team={project.team} />}

            {project.ipAssetId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCheck className="h-5 w-5" />
                    IP Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-sm font-medium text-green-800">Registered on Story Protocol</p>
                    <p className="text-xs text-green-600 font-mono mt-1">{project.ipAssetId}</p>
                  </div>
                  {project.ipLicenseType && (
                    <div>
                      <p className="text-sm text-muted-foreground">License Type</p>
                      <p className="font-medium">{getLicenseLabel(project.ipLicenseType)}</p>
                    </div>
                  )}
                  {project.ipRegisteredAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Registered On</p>
                      <p className="font-medium">
                        {new Date(project.ipRegisteredAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {project.cohort && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cohort</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/cohorts/${project.cohort.slug}`} className="hover:underline">
                    <p className="font-medium">{project.cohort.name}</p>
                  </Link>
                  {project.cohort.tagline && (
                    <p className="text-sm text-muted-foreground">{project.cohort.tagline}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">More from this Buildathon</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map(related => (
                <ProjectCard key={related.id} project={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/projects/[id]/page.tsx
git commit -m "feat: add public project showcase page"
```

---

## Task 10: Create Private Submission Detail Page

**Files:**
- Create: `src/app/(dashboard)/submissions/[id]/page.tsx`

**Step 1: Create the private submission detail page**

```typescript
"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getSubmissionById, mockReviews, getTracksByCohort } from "@/data/mock-data";
import { ProjectHero } from "@/components/projects/project-hero";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, FileCheck, Edit, AlertCircle, Star } from "lucide-react";

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const submission = getSubmissionById(id);

  if (!submission) {
    notFound();
  }

  // Check if user is a team member
  const isTeamMember = submission.team?.members.some(m => m.userId === user?.id);

  if (!isTeamMember && user?.role !== "admin") {
    router.push("/submissions");
    return null;
  }

  const tracks = submission.cohortId ? getTracksByCohort(submission.cohortId) : [];
  const projectTrack = tracks.find(t => t.id === submission.trackId);

  const reviews = mockReviews.filter(r => r.submissionId === submission.id && r.status === "completed");

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "draft":
        return { message: "Your submission is in draft. Complete and submit when ready.", color: "bg-gray-100 text-gray-800" };
      case "submitted":
        return { message: "Your submission has been received and is awaiting review.", color: "bg-blue-100 text-blue-800" };
      case "under_review":
        return { message: "Judges are currently reviewing your submission.", color: "bg-purple-100 text-purple-800" };
      case "accepted":
        return { message: "Congratulations! Your submission has been accepted.", color: "bg-green-100 text-green-800" };
      case "winner":
        return { message: "Congratulations! Your submission is a winner!", color: "bg-yellow-100 text-yellow-800" };
      default:
        return { message: "", color: "" };
    }
  };

  const statusInfo = getStatusMessage(submission.status);

  const getLicenseLabel = (license?: string) => {
    switch (license) {
      case "non-commercial":
        return "Non-Commercial";
      case "commercial-use":
        return "Commercial Use";
      case "commercial-remix":
        return "Commercial Remix";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{submission.title}</h1>
          {submission.tagline && (
            <p className="mt-1 text-muted-foreground">{submission.tagline}</p>
          )}
        </div>
        {submission.status === "draft" && (
          <Button asChild>
            <Link href="/submit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Submission
            </Link>
          </Button>
        )}
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${statusInfo.color}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{statusInfo.message}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectGallery screenshots={submission.screenshots} videoUrl={submission.videoUrl} />

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap">{submission.description}</p>

              {submission.builtWithStory && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Built with Story Protocol</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tech Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {submission.techStack.map(tech => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section - Only visible after judging */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={review.judge?.avatar}
                          alt={review.judge?.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <span className="font-medium">{review.judge?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{review.overallScore?.toFixed(1)}</span>
                        <span className="text-muted-foreground">/10</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[
                        { label: "Innovation", score: review.innovationScore },
                        { label: "Execution", score: review.executionScore },
                        { label: "Design", score: review.designScore },
                        { label: "Impact", score: review.impactScore },
                        { label: "Presentation", score: review.presentationScore },
                      ].map(({ label, score }) => (
                        <div key={label} className="text-center">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-semibold">{score || "-"}</p>
                        </div>
                      ))}
                    </div>

                    {review.feedback && (
                      <div>
                        <p className="text-sm font-medium mb-1">Feedback</p>
                        <p className="text-sm text-muted-foreground">{review.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {submission.team && <ProjectTeam team={submission.team} />}

          {projectTrack && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Track</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {projectTrack.sponsorLogo && (
                    <img src={projectTrack.sponsorLogo} alt="" className="h-10 w-10 rounded" />
                  )}
                  <div>
                    <p className="font-medium">{projectTrack.name}</p>
                    {projectTrack.sponsorName && (
                      <p className="text-sm text-muted-foreground">Sponsored by {projectTrack.sponsorName}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {submission.ipAssetId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="h-5 w-5" />
                  IP Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">Registered on Story Protocol</p>
                  <p className="text-xs text-green-600 font-mono mt-1">{submission.ipAssetId}</p>
                </div>
                {submission.ipLicenseType && (
                  <div>
                    <p className="text-sm text-muted-foreground">License Type</p>
                    <p className="font-medium">{getLicenseLabel(submission.ipLicenseType)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {submission.cohort && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/cohorts/${submission.cohort.slug}`} className="hover:underline">
                  <p className="font-medium">{submission.cohort.name}</p>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {submission.demoUrl && (
                <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                  Demo URL
                </a>
              )}
              {submission.repoUrl && (
                <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                  Repository
                </a>
              )}
              {submission.videoUrl && (
                <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                  Demo Video
                </a>
              )}
              {submission.presentationUrl && (
                <a href={submission.presentationUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                  Presentation
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "src/app/(dashboard)/submissions/[id]/page.tsx"
git commit -m "feat: add private submission detail page with reviews"
```

---

## Task 11: Create Workshop Calendar Components

**Files:**
- Create: `src/components/workshops/calendar-month-view.tsx`
- Create: `src/components/workshops/calendar-agenda-view.tsx`
- Create: `src/components/workshops/workshop-card.tsx`

**Step 1: Create workshop card component**

```typescript
import { Workshop, WorkshopRSVP } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin } from "lucide-react";

interface WorkshopCardProps {
  workshop: Workshop;
  rsvpCount: number;
  userRsvp?: WorkshopRSVP;
  onViewDetails: () => void;
  onRsvp: () => void;
  onAddToCalendar: (type: "google" | "apple" | "ics") => void;
}

export function WorkshopCard({
  workshop,
  rsvpCount,
  userRsvp,
  onViewDetails,
  onRsvp,
  onAddToCalendar
}: WorkshopCardProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "basics":
        return "bg-green-100 text-green-800";
      case "advanced":
        return "bg-purple-100 text-purple-800";
      case "business":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {workshop.partnerLogo && (
            <img src={workshop.partnerLogo} alt="" className="h-10 w-10 rounded" />
          )}
          <div>
            <h4 className="font-semibold">{workshop.title}</h4>
            {workshop.partnerName && (
              <p className="text-sm text-muted-foreground">{workshop.partnerName}</p>
            )}
          </div>
        </div>
        <Badge className={getCategoryColor(workshop.category)}>{workshop.category}</Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{workshop.description}</p>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {workshop.scheduledAt && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(workshop.scheduledAt)}</span>
            {workshop.duration && <span>({workshop.duration})</span>}
          </div>
        )}
        {workshop.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{workshop.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{rsvpCount} attending</span>
          {workshop.maxAttendees && <span>/ {workshop.maxAttendees}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </Button>
        <Button
          size="sm"
          variant={userRsvp ? "secondary" : "default"}
          onClick={onRsvp}
        >
          {userRsvp ? "Cancel RSVP" : "RSVP"}
        </Button>
        <div className="relative group">
          <Button variant="ghost" size="sm">
            Add to Calendar
          </Button>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-popover border rounded-md shadow-md py-1 min-w-[140px]">
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent"
              onClick={() => onAddToCalendar("google")}
            >
              Google Calendar
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent"
              onClick={() => onAddToCalendar("apple")}
            >
              Apple Calendar
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent"
              onClick={() => onAddToCalendar("ics")}
            >
              Download .ics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create calendar month view component**

```typescript
"use client";

import { Workshop } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarMonthViewProps {
  currentDate: Date;
  workshops: Workshop[];
  onDateChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export function CalendarMonthView({
  currentDate,
  workshops,
  onDateChange,
  onDateSelect,
  selectedDate,
}: CalendarMonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getWorkshopsForDate = (day: number) => {
    return workshops.filter(w => {
      if (!w.scheduledAt) return false;
      const workshopDate = new Date(w.scheduledAt);
      return (
        workshopDate.getFullYear() === year &&
        workshopDate.getMonth() === month &&
        workshopDate.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const days = [];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 border-b border-r bg-muted/30" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayWorkshops = getWorkshopsForDate(day);
    const today = isToday(day);
    const selected = isSelected(day);

    days.push(
      <button
        key={day}
        className={`h-24 border-b border-r p-1 text-left transition-colors hover:bg-accent/50 ${
          selected ? "bg-accent" : ""
        }`}
        onClick={() => onDateSelect(new Date(year, month, day))}
      >
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
            today ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          {day}
        </span>
        <div className="mt-1 space-y-1">
          {dayWorkshops.slice(0, 2).map(w => (
            <div
              key={w.id}
              className="truncate rounded bg-primary/10 px-1 py-0.5 text-xs text-primary"
            >
              {w.title}
            </div>
          ))}
          {dayWorkshops.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{dayWorkshops.length - 2} more
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="border-r p-2 text-center text-sm font-medium text-muted-foreground last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">{days}</div>
    </div>
  );
}
```

**Step 3: Create calendar agenda view component**

```typescript
import { Workshop } from "@/types";
import { getRSVPsByWorkshop } from "@/data/mock-data";
import { WorkshopCard } from "./workshop-card";
import { WorkshopRSVP } from "@/types";

interface CalendarAgendaViewProps {
  workshops: Workshop[];
  userRsvps: WorkshopRSVP[];
  onViewDetails: (workshop: Workshop) => void;
  onRsvp: (workshop: Workshop) => void;
  onAddToCalendar: (workshop: Workshop, type: "google" | "apple" | "ics") => void;
}

export function CalendarAgendaView({
  workshops,
  userRsvps,
  onViewDetails,
  onRsvp,
  onAddToCalendar,
}: CalendarAgendaViewProps) {
  // Sort workshops by date
  const sortedWorkshops = [...workshops]
    .filter(w => w.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  // Group by date
  const groupedByDate = sortedWorkshops.reduce((acc, workshop) => {
    const dateKey = new Date(workshop.scheduledAt!).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(workshop);
    return acc;
  }, {} as Record<string, Workshop[]>);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (sortedWorkshops.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No upcoming workshops scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([dateKey, dateWorkshops]) => (
        <div key={dateKey}>
          <h3 className="mb-3 text-lg font-semibold">{formatDateHeader(dateKey)}</h3>
          <div className="space-y-3">
            {dateWorkshops.map(workshop => {
              const rsvpCount = getRSVPsByWorkshop(workshop.id).length;
              const userRsvp = userRsvps.find(r => r.workshopId === workshop.id);

              return (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  rsvpCount={rsvpCount}
                  userRsvp={userRsvp}
                  onViewDetails={() => onViewDetails(workshop)}
                  onRsvp={() => onRsvp(workshop)}
                  onAddToCalendar={(type) => onAddToCalendar(workshop, type)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/workshops/calendar-month-view.tsx src/components/workshops/calendar-agenda-view.tsx src/components/workshops/workshop-card.tsx
git commit -m "feat: add workshop calendar components (month view, agenda view, card)"
```

---

## Task 12: Create Workshop Detail Modal

**Files:**
- Create: `src/components/workshops/workshop-detail-modal.tsx`

**Step 1: Create the workshop detail modal**

```typescript
import { Workshop, WorkshopRSVP } from "@/types";
import { getRSVPsByWorkshop } from "@/data/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin, Calendar, Video, FileText, ExternalLink } from "lucide-react";

interface WorkshopDetailModalProps {
  workshop: Workshop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRsvp?: WorkshopRSVP;
  onRsvp: () => void;
  onAddToCalendar: (type: "google" | "apple" | "ics") => void;
}

export function WorkshopDetailModal({
  workshop,
  open,
  onOpenChange,
  userRsvp,
  onRsvp,
  onAddToCalendar,
}: WorkshopDetailModalProps) {
  if (!workshop) return null;

  const rsvpCount = getRSVPsByWorkshop(workshop.id).length;

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "basics":
        return "bg-green-100 text-green-800";
      case "advanced":
        return "bg-purple-100 text-purple-800";
      case "business":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {workshop.partnerLogo && (
                <img src={workshop.partnerLogo} alt="" className="h-12 w-12 rounded" />
              )}
              <div>
                <DialogTitle>{workshop.title}</DialogTitle>
                {workshop.partnerName && (
                  <DialogDescription>{workshop.partnerName}</DialogDescription>
                )}
              </div>
            </div>
            <Badge className={getCategoryColor(workshop.category)}>{workshop.category}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">{workshop.description}</p>

          <div className="space-y-2">
            {workshop.scheduledAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(workshop.scheduledAt)}</span>
              </div>
            )}
            {workshop.duration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{workshop.duration}</span>
              </div>
            )}
            {workshop.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{workshop.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{rsvpCount} attending</span>
              {workshop.maxAttendees && <span className="text-muted-foreground">/ {workshop.maxAttendees} max</span>}
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-wrap gap-2">
            {workshop.videoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={workshop.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="mr-2 h-4 w-4" />
                  Watch Video
                </a>
              </Button>
            )}
            {workshop.articleUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={workshop.articleUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Read Article
                </a>
              </Button>
            )}
            {userRsvp && workshop.meetingUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={workshop.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Join Meeting
                </a>
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant={userRsvp ? "secondary" : "default"}
              onClick={onRsvp}
            >
              {userRsvp ? "Cancel RSVP" : "RSVP Now"}
            </Button>
            <Button variant="outline" onClick={() => onAddToCalendar("google")}>
              Add to Google Calendar
            </Button>
            <Button variant="outline" onClick={() => onAddToCalendar("ics")}>
              Download .ics
            </Button>
          </div>

          {!userRsvp && workshop.meetingUrl && (
            <p className="text-sm text-muted-foreground">
              RSVP to receive the meeting link.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/workshops/workshop-detail-modal.tsx
git commit -m "feat: add workshop detail modal"
```

---

## Task 13: Create Add-to-Calendar Utility

**Files:**
- Create: `src/lib/calendar-utils.ts`

**Step 1: Create calendar utility functions**

```typescript
import { Workshop } from "@/types";

export function generateGoogleCalendarUrl(workshop: Workshop): string {
  if (!workshop.scheduledAt) return "";

  const startDate = new Date(workshop.scheduledAt);
  const endDate = workshop.endTime ? new Date(workshop.endTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: workshop.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: `${workshop.description}\n\n${workshop.meetingUrl ? `Join: ${workshop.meetingUrl}` : ""}`,
    location: workshop.location || "Online",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICSFile(workshop: Workshop): string {
  if (!workshop.scheduledAt) return "";

  const startDate = new Date(workshop.scheduledAt);
  const endDate = workshop.endTime ? new Date(workshop.endTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, -1) + "Z";
  };

  const escapeText = (text: string) => {
    return text.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SWA Buildathon//Workshop//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeText(workshop.title)}`,
    `DESCRIPTION:${escapeText(workshop.description)}${workshop.meetingUrl ? `\\n\\nJoin: ${workshop.meetingUrl}` : ""}`,
    `LOCATION:${escapeText(workshop.location || "Online")}`,
    `UID:${workshop.id}@swa.xyz`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

export function downloadICSFile(workshop: Workshop): void {
  const icsContent = generateICSFile(workshop);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${workshop.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateAppleCalendarUrl(workshop: Workshop): string {
  // Apple Calendar uses the same webcal protocol but through ICS
  // For web, we'll use the ICS download approach
  return generateGoogleCalendarUrl(workshop).replace("https://", "webcal://");
}
```

**Step 2: Commit**

```bash
git add src/lib/calendar-utils.ts
git commit -m "feat: add calendar utility functions for add-to-calendar"
```

---

## Task 14: Create Workshop Page

**Files:**
- Create: `src/app/workshops/page.tsx`

**Step 1: Create the workshop page with calendar**

```typescript
"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { mockWorkshops, getRSVPsByUser, getRSVPsByWorkshop, mockWorkshopRSVPs } from "@/data/mock-data";
import { Workshop, WorkshopRSVP } from "@/types";
import { CalendarMonthView } from "@/components/workshops/calendar-month-view";
import { CalendarAgendaView } from "@/components/workshops/calendar-agenda-view";
import { WorkshopDetailModal } from "@/components/workshops/workshop-detail-modal";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/lib/calendar-utils";
import { Calendar, List, LogIn } from "lucide-react";
import Link from "next/link";

export default function WorkshopsPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Mock RSVP state - in real app would come from server
  const [localRsvps, setLocalRsvps] = useState<WorkshopRSVP[]>(mockWorkshopRSVPs);

  const publishedWorkshops = mockWorkshops.filter(w => w.status === "published" && w.scheduledAt);

  const userRsvps = useMemo(() => {
    if (!user) return [];
    return localRsvps.filter(r => r.userId === user.id && r.status === "registered");
  }, [user, localRsvps]);

  const upcomingWorkshops = publishedWorkshops
    .filter(w => w.scheduledAt && new Date(w.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5);

  const selectedDateWorkshops = useMemo(() => {
    if (!selectedDate) return [];
    return publishedWorkshops.filter(w => {
      if (!w.scheduledAt) return false;
      const workshopDate = new Date(w.scheduledAt);
      return (
        workshopDate.getFullYear() === selectedDate.getFullYear() &&
        workshopDate.getMonth() === selectedDate.getMonth() &&
        workshopDate.getDate() === selectedDate.getDate()
      );
    });
  }, [selectedDate, publishedWorkshops]);

  const handleViewDetails = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setModalOpen(true);
  };

  const handleRsvp = (workshop: Workshop) => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login";
      return;
    }

    const existingRsvp = localRsvps.find(
      r => r.workshopId === workshop.id && r.userId === user.id && r.status === "registered"
    );

    if (existingRsvp) {
      // Cancel RSVP
      setLocalRsvps(prev =>
        prev.map(r =>
          r.id === existingRsvp.id ? { ...r, status: "cancelled" as const } : r
        )
      );
    } else {
      // Add RSVP
      const newRsvp: WorkshopRSVP = {
        id: `rsvp-${Date.now()}`,
        workshopId: workshop.id,
        userId: user.id,
        status: "registered",
        registeredAt: new Date(),
      };
      setLocalRsvps(prev => [...prev, newRsvp]);
    }
  };

  const handleAddToCalendar = (workshop: Workshop, type: "google" | "apple" | "ics") => {
    if (type === "google") {
      window.open(generateGoogleCalendarUrl(workshop), "_blank");
    } else if (type === "ics" || type === "apple") {
      downloadICSFile(workshop);
    }
  };

  const getUserRsvpForWorkshop = (workshopId: string) => {
    return userRsvps.find(r => r.workshopId === workshopId);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white">Workshops & Learning Sessions</h1>
          <p className="mt-2 text-lg text-teal-100">
            Level up your skills with expert-led workshops and sessions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <Tabs value={view} onValueChange={(v) => setView(v as "month" | "agenda")}>
                <TabsList>
                  <TabsTrigger value="month" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="agenda" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Agenda
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {view === "month" ? (
              <div className="space-y-6">
                <CalendarMonthView
                  currentDate={currentDate}
                  workshops={publishedWorkshops}
                  onDateChange={setCurrentDate}
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                />

                {selectedDate && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      Workshops on {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                    {selectedDateWorkshops.length === 0 ? (
                      <p className="text-muted-foreground">No workshops scheduled for this date.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateWorkshops.map(workshop => (
                          <WorkshopCard
                            key={workshop.id}
                            workshop={workshop}
                            rsvpCount={getRSVPsByWorkshop(workshop.id).length}
                            userRsvp={getUserRsvpForWorkshop(workshop.id)}
                            onViewDetails={() => handleViewDetails(workshop)}
                            onRsvp={() => handleRsvp(workshop)}
                            onAddToCalendar={(type) => handleAddToCalendar(workshop, type)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <CalendarAgendaView
                workshops={publishedWorkshops}
                userRsvps={userRsvps}
                onViewDetails={handleViewDetails}
                onRsvp={handleRsvp}
                onAddToCalendar={handleAddToCalendar}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {!user && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <LogIn className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Log in to RSVP for workshops and receive meeting links
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/login">Log In</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingWorkshops.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming workshops.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingWorkshops.map(workshop => (
                      <button
                        key={workshop.id}
                        className="w-full text-left"
                        onClick={() => handleViewDetails(workshop)}
                      >
                        <div className="flex items-start gap-3">
                          {workshop.partnerLogo && (
                            <img src={workshop.partnerLogo} alt="" className="h-8 w-8 rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{workshop.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {workshop.scheduledAt && new Date(workshop.scheduledAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {userRsvps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your RSVPs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userRsvps.map(rsvp => {
                      const workshop = publishedWorkshops.find(w => w.id === rsvp.workshopId);
                      if (!workshop) return null;
                      return (
                        <button
                          key={rsvp.id}
                          className="w-full text-left"
                          onClick={() => handleViewDetails(workshop)}
                        >
                          <p className="font-medium text-sm">{workshop.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {workshop.scheduledAt && new Date(workshop.scheduledAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Workshop Detail Modal */}
      <WorkshopDetailModal
        workshop={selectedWorkshop}
        open={modalOpen}
        onOpenChange={setModalOpen}
        userRsvp={selectedWorkshop ? getUserRsvpForWorkshop(selectedWorkshop.id) : undefined}
        onRsvp={() => selectedWorkshop && handleRsvp(selectedWorkshop)}
        onAddToCalendar={(type) => selectedWorkshop && handleAddToCalendar(selectedWorkshop, type)}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/workshops/page.tsx
git commit -m "feat: add workshop page with interactive calendar"
```

---

## Task 15: Update Navigation and Final Cleanup

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: Add navigation links for new pages**

Find the navigation items array and add entries for cohorts, projects, and workshops in the public section. Look for existing navigation structure and add:

```typescript
// In the main navigation items, add:
{ name: "Cohorts", href: "/cohorts", icon: Calendar },
{ name: "Projects", href: "/projects", icon: Folder },
{ name: "Workshops", href: "/workshops", icon: BookOpen },
```

**Step 2: Verify app builds successfully**

```bash
npm run build
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete cohort, project, and workshop pages implementation"
```

---

## Summary

This implementation plan creates:

1. **Types** - Extended Workshop type with scheduling fields, new WorkshopRSVP type
2. **Mock Data** - Updated workshops with schedules, RSVP data, helper functions
3. **Cohort Pages** - Listing page with filters, detail page with tabs (overview, tracks, sponsors, projects)
4. **Project Pages** - Public showcase, private submission detail with reviews
5. **Workshop Page** - Interactive calendar with month/agenda views, RSVP, add-to-calendar

All pages follow existing patterns with Tailwind CSS styling, Radix UI components, and TypeScript.
