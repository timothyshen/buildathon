"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { V1CommandCenter } from "./variations/v1-command-center";
import { V2MetricStrip } from "./variations/v2-metric-strip";
import { V3ActivityFeed } from "./variations/v3-activity-feed";
import { V4BentoGrid } from "./variations/v4-bento-grid";
import { V5FocusMode } from "./variations/v5-focus-mode";

// ── Mock Data ──────────────────────────────────────────────────────────────────

export interface MockSubmission {
  id: string;
  title: string;
  tagline: string;
  status: "draft" | "submitted" | "under_review" | "winner";
  cohortName: string;
  trackName: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface MockCohort {
  id: string;
  name: string;
  tagline: string;
  status: "active" | "upcoming";
  submissionDeadline: Date;
  startDate: Date;
}

export interface MockActivity {
  id: string;
  type: "submission" | "review" | "cohort" | "win";
  title: string;
  description: string;
  timestamp: Date;
}

export const mockUser = { name: "Alex Chen" };

export const mockSubmissions: MockSubmission[] = [
  {
    id: "1",
    title: "StoryForge",
    tagline: "AI-powered narrative engine for IP licensing",
    status: "winner",
    cohortName: "Buildathon #3",
    trackName: "AI & Creativity",
    updatedAt: new Date("2026-01-15"),
    createdAt: new Date("2026-01-05"),
  },
  {
    id: "2",
    title: "ChainMint",
    tagline: "One-click NFT minting with Story Protocol",
    status: "submitted",
    cohortName: "Buildathon #4",
    trackName: "DeFi Tools",
    updatedAt: new Date("2026-02-01"),
    createdAt: new Date("2026-01-20"),
  },
  {
    id: "3",
    title: "IPGuard",
    tagline: "Automated IP infringement detection system",
    status: "under_review",
    cohortName: "Buildathon #4",
    trackName: "Infrastructure",
    updatedAt: new Date("2026-02-05"),
    createdAt: new Date("2026-01-25"),
  },
  {
    id: "4",
    title: "RemixDAO",
    tagline: "Collaborative remixing with on-chain attribution",
    status: "draft",
    cohortName: "Buildathon #4",
    trackName: "Social & Community",
    updatedAt: new Date("2026-02-08"),
    createdAt: new Date("2026-02-06"),
  },
];

export const mockCohorts: MockCohort[] = [
  {
    id: "c1",
    name: "Buildathon #4",
    tagline: "Build the future of programmable IP",
    status: "active",
    submissionDeadline: new Date("2026-02-28"),
    startDate: new Date("2026-01-15"),
  },
  {
    id: "c2",
    name: "Mini Buildathon: AI Agents",
    tagline: "48-hour sprint on AI agent tooling",
    status: "active",
    submissionDeadline: new Date("2026-02-14"),
    startDate: new Date("2026-02-10"),
  },
  {
    id: "c3",
    name: "Buildathon #5",
    tagline: "Coming soon",
    status: "upcoming",
    submissionDeadline: new Date("2026-04-30"),
    startDate: new Date("2026-03-15"),
  },
];

export const mockActivities: MockActivity[] = [
  {
    id: "a1",
    type: "submission",
    title: "Submitted IPGuard",
    description: "Submitted to Buildathon #4 — Infrastructure track",
    timestamp: new Date("2026-02-05T14:30:00"),
  },
  {
    id: "a2",
    type: "review",
    title: "ChainMint reviewed",
    description: "Your project received a new judge review",
    timestamp: new Date("2026-02-03T09:15:00"),
  },
  {
    id: "a3",
    type: "cohort",
    title: "Mini Buildathon started",
    description: "AI Agents sprint is now live — 48 hours to build",
    timestamp: new Date("2026-02-10T00:00:00"),
  },
  {
    id: "a4",
    type: "win",
    title: "StoryForge won!",
    description: "1st place in AI & Creativity track — Buildathon #3",
    timestamp: new Date("2026-01-20T18:00:00"),
  },
  {
    id: "a5",
    type: "submission",
    title: "Started RemixDAO draft",
    description: "New draft created for Social & Community track",
    timestamp: new Date("2026-02-06T11:00:00"),
  },
];

// ── Page ────────────────────────────────────────────────────────────────────────

const variations = [
  { value: "v1", label: "V1: Command Center", desc: "Linear-style flat list, zero cards" },
  { value: "v2", label: "V2: Metric Strip", desc: "Vercel-style horizontal numbers" },
  { value: "v3", label: "V3: Activity Feed", desc: "Timeline-based two-column" },
  { value: "v4", label: "V4: Bento Grid", desc: "Asymmetric tiles, gradient hero" },
  { value: "v5", label: "V5: Focus Mode", desc: "Single CTA, accordion sections" },
];

export default function DesignLabPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Design Lab
              </p>
              <h1 className="text-lg font-semibold mt-0.5">
                Participant Dashboard Redesign
              </h1>
            </div>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Pick your favorite. Everything here uses mock data.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="v1">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {variations.map((v) => (
              <TabsTrigger key={v.value} value={v.value} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{v.label}</span>
                <span className="sm:hidden">{v.value.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Variation descriptions */}
          <div className="mt-4 mb-8">
            {variations.map((v) => (
              <TabsContent key={v.value} value={v.value}>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{v.label}</span>
                  {" — "}{v.desc}
                </p>
              </TabsContent>
            ))}
          </div>

          {/* Variation renders */}
          <TabsContent value="v1">
            <V1CommandCenter />
          </TabsContent>
          <TabsContent value="v2">
            <V2MetricStrip />
          </TabsContent>
          <TabsContent value="v3">
            <V3ActivityFeed />
          </TabsContent>
          <TabsContent value="v4">
            <V4BentoGrid />
          </TabsContent>
          <TabsContent value="v5">
            <V5FocusMode />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
