"use client";

import { useState } from "react";
import { mockUser, mockSubmissions, mockCohorts } from "../page";
import { ChevronRight, Plus } from "lucide-react";

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

type Filter = "all" | "draft" | "submitted" | "under_review" | "winner";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "In Review" },
  { value: "winner", label: "Winners" },
];

export function V1CommandCenter() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? mockSubmissions
      : mockSubmissions.filter((s) => s.status === filter);

  const activeCohorts = mockCohorts.filter((c) => c.status === "active");

  function daysUntil(date: Date) {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-3xl space-y-10">
      {/* Greeting — no card */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mockUser.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mockSubmissions.length} projects &middot;{" "}
          {mockSubmissions.filter((s) => s.status === "winner").length} wins
        </p>
      </div>

      {/* Deadlines strip */}
      {activeCohorts.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Upcoming Deadlines
          </h2>
          <div className="divide-y">
            {activeCohorts.map((c) => {
              const days = daysUntil(c.submissionDeadline);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-sm font-mono tabular-nums ${
                        days <= 5 ? "text-red-500 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {days}d
                    </span>
                    <span className="text-sm truncate">{c.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Projects
          </h2>
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                filter === f.value
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-3.5 group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[s.status]}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {s.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {statusLabel[s.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {s.cohortName} &middot; {s.trackName}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No projects match this filter.
          </p>
        )}
      </section>
    </div>
  );
}
