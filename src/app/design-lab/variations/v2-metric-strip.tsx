"use client";

import { mockUser, mockSubmissions, mockCohorts } from "../page";
import { ChevronRight } from "lucide-react";

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

function getInitials(title: string) {
  return title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const initialColors = [
  "bg-blue-500/10 text-blue-600",
  "bg-violet-500/10 text-violet-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
];

export function V2MetricStrip() {
  const wins = mockSubmissions.filter((s) => s.status === "winner").length;
  const activeCohorts = mockCohorts.filter((c) => c.status === "active");

  function daysUntil(date: Date) {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Next deadline
  const nextDeadline = activeCohorts
    .sort((a, b) => new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime())
    [0];

  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hey, {mockUser.name.split(" ")[0]}
        </h1>
      </div>

      {/* Metric strip */}
      <div className="flex items-center divide-x">
        <div className="pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {mockSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Projects</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {mockSubmissions.filter((s) => s.status === "submitted" || s.status === "under_review").length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {wins}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Wins</div>
        </div>
        {nextDeadline && (
          <div className="pl-8">
            <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
              {daysUntil(nextDeadline.submissionDeadline)}d
            </div>
            <div className="text-xs text-muted-foreground mt-1">Next deadline</div>
          </div>
        )}
      </div>

      {/* Projects */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Projects
        </h2>
        <div className="space-y-1">
          {mockSubmissions.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              {/* Initial avatar */}
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                  initialColors[i % initialColors.length]
                }`}
              >
                {getInitials(s.title)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{s.title}</span>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot[s.status]}`} />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {statusLabel[s.status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {s.tagline}
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Cohorts */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Buildathons
        </h2>
        <div className="space-y-1">
          {mockCohorts.map((c) => {
            const days = daysUntil(c.submissionDeadline);
            const isActive = c.status === "active";
            return (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.tagline}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {isActive && (
                    <span className={`text-xs font-mono tabular-nums ${days <= 5 ? "text-red-500" : "text-muted-foreground"}`}>
                      {days}d left
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
