"use client";

import { mockUser, mockSubmissions, mockCohorts, mockActivities } from "../page";
import type { MockActivity } from "../page";
import { Trophy, FileText, MessageSquare, Calendar } from "lucide-react";

const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  submitted: "bg-blue-500",
  under_review: "bg-amber-500",
  winner: "bg-emerald-500",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In Review",
  winner: "Winner",
};

function activityIcon(type: MockActivity["type"]) {
  switch (type) {
    case "submission":
      return <FileText className="h-3.5 w-3.5" />;
    case "review":
      return <MessageSquare className="h-3.5 w-3.5" />;
    case "cohort":
      return <Calendar className="h-3.5 w-3.5" />;
    case "win":
      return <Trophy className="h-3.5 w-3.5" />;
  }
}

function activityDotColor(type: MockActivity["type"]) {
  switch (type) {
    case "submission":
      return "bg-blue-500 text-white";
    case "review":
      return "bg-violet-500 text-white";
    case "cohort":
      return "bg-amber-500 text-white";
    case "win":
      return "bg-emerald-500 text-white";
  }
}

function relativeTime(date: Date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(date: Date) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function V3ActivityFeed() {
  const wins = mockSubmissions.filter((s) => s.status === "winner").length;
  const activeCohorts = mockCohorts.filter((c) => c.status === "active");
  const sortedActivities = [...mockActivities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mockUser.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your build journey</p>
      </div>

      <div className="flex gap-12">
        {/* Left sidebar — stats */}
        <div className="w-44 shrink-0 space-y-6 hidden md:block">
          <div>
            <div className="text-2xl font-mono font-semibold tabular-nums">
              {mockSubmissions.length}
            </div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-semibold tabular-nums text-emerald-600">
              {wins}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-semibold tabular-nums">
              {activeCohorts.length}
            </div>
            <div className="text-xs text-muted-foreground">Active cohorts</div>
          </div>

          {/* Deadlines */}
          {activeCohorts.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Deadlines
              </div>
              {activeCohorts.map((c) => {
                const days = daysUntil(c.submissionDeadline);
                return (
                  <div key={c.id} className="mb-3">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className={`text-xs font-mono tabular-nums ${days <= 5 ? "text-red-500" : "text-muted-foreground"}`}>
                      {days} days left
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Project list */}
          <div className="pt-4 border-t">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Projects
            </div>
            {mockSubmissions.map((s) => (
              <div key={s.id} className="flex items-center gap-2 mb-2.5 cursor-pointer hover:text-foreground text-muted-foreground transition-colors">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot[s.status]}`} />
                <span className="text-sm truncate">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — timeline */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-6">
            Activity
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-0">
              {sortedActivities.map((a) => (
                <div key={a.id} className="relative flex gap-4 pb-6">
                  {/* Dot */}
                  <div
                    className={`relative z-10 h-[23px] w-[23px] rounded-full flex items-center justify-center shrink-0 ${activityDotColor(a.type)}`}
                  >
                    {activityIcon(a.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(a.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile stats (shown below on small screens) */}
      <div className="md:hidden mt-10 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xl font-mono font-semibold tabular-nums">
            {mockSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground">Projects</div>
        </div>
        <div>
          <div className="text-xl font-mono font-semibold tabular-nums text-emerald-600">
            {wins}
          </div>
          <div className="text-xs text-muted-foreground">Wins</div>
        </div>
        <div>
          <div className="text-xl font-mono font-semibold tabular-nums">
            {activeCohorts.length}
          </div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
      </div>

      {/* Mobile projects */}
      <div className="md:hidden mt-8">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Projects
        </h2>
        <div className="divide-y">
          {mockSubmissions.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5 py-3">
              <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[s.status]}`} />
              <span className="text-sm font-medium flex-1 truncate">{s.title}</span>
              <span className="text-xs text-muted-foreground">{statusLabel[s.status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
