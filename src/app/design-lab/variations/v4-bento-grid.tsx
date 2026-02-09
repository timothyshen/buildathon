"use client";

import { mockUser, mockSubmissions, mockCohorts } from "../page";
import { ChevronRight, Clock, Trophy, Zap } from "lucide-react";

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

function daysUntil(date: Date) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function V4BentoGrid() {
  const wins = mockSubmissions.filter((s) => s.status === "winner").length;
  const drafts = mockSubmissions.filter((s) => s.status === "draft").length;
  const activeCohorts = mockCohorts.filter((c) => c.status === "active");

  const nextDeadline = activeCohorts
    .sort((a, b) => new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime())
    [0];

  const deadlineDays = nextDeadline ? daysUntil(nextDeadline.submissionDeadline) : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mockUser.name.split(" ")[0]}
        </h1>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Hero tile — 2 col span */}
        {nextDeadline && (
          <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.08] border p-6 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Next deadline</span>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold tabular-nums">
                {deadlineDays}
                <span className="text-lg text-muted-foreground ml-1">days</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {nextDeadline.name}
              </p>
            </div>
          </div>
        )}

        {/* Wins tile */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[160px]">
          <Trophy className="h-4 w-4 text-emerald-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-emerald-600">
              {wins}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Wins</p>
          </div>
        </div>

        {/* Projects tile */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[160px]">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums">
              {mockSubmissions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Projects</p>
          </div>
        </div>

        {/* Drafts tile */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[160px]">
          <div className="text-xs text-muted-foreground">Needs attention</div>
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-amber-600">
              {drafts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Drafts to finish</p>
          </div>
        </div>

        {/* Active cohorts tile */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[160px]">
          <div className="text-xs text-muted-foreground">Participating in</div>
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums">
              {activeCohorts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active buildathons</p>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="mt-10">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockSubmissions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[s.status]}`} />
                    <span className="text-sm font-medium truncate">{s.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {s.tagline}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground">
                      {s.cohortName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">&middot;</span>
                    <span className="text-[11px] text-muted-foreground">
                      {statusLabel[s.status]}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohorts */}
      <div className="mt-10">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Buildathons
        </h2>
        <div className="divide-y">
          {mockCohorts.map((c) => {
            const days = daysUntil(c.submissionDeadline);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.status === "active" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {c.status === "active" && (
                    <span className={`text-xs font-mono tabular-nums ${days <= 5 ? "text-red-500" : "text-muted-foreground"}`}>
                      {days}d
                    </span>
                  )}
                  {c.status === "upcoming" && (
                    <span className="text-xs text-muted-foreground">Upcoming</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
