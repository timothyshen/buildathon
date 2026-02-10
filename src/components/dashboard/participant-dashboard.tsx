"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { cohortsService, submissionsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ChevronRight, Clock, Trophy, Zap, Plus, FileText } from "lucide-react";
import type { Cohort, Submission } from "@/types";
import { getSubmissionStatusLabel } from "@/lib/utils/status";

const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  submitted: "bg-blue-500",
  under_review: "bg-amber-500",
  accepted: "bg-violet-500",
  winner: "bg-emerald-500",
};

function daysUntil(date: Date) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function ParticipantDashboard() {
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const [cohortsResult, submissionsResult] = await Promise.all([
        cohortsService.list({ isPublic: true, pageSize: 50 }),
        submissionsService.getByUser(user.id),
      ]);

      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (submissionsResult.success) setSubmissions(submissionsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

  if (isLoading) {
    return <Loading />;
  }

  const activeCohorts = cohorts.filter((c) => c.status === "active");
  const publicCohorts = cohorts;
  const wins = submissions.filter((s) => s.status === "winner").length;
  const drafts = submissions.filter((s) => s.status === "draft").length;

  const nextDeadline = activeCohorts
    .sort((a, b) => new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime())
    [0];
  const deadlineDays = nextDeadline ? daysUntil(nextDeadline.submissionDeadline) : null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {user?.name?.split(" ")[0]}
        </h1>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Hero tile — deadline */}
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
              {submissions.length}
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Projects
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/submit" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
              New
            </Link>
          </Button>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-medium">No projects yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Start your first buildathon project
            </p>
            <Button asChild size="sm" className="mt-4 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/submit">Create project</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {submissions.map((s) => (
              <Link
                key={s.id}
                href={s.status === "draft" ? `/submissions/${s.id}/edit` : `/submissions/${s.id}`}
                className="rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[s.status] || statusDot.draft}`} />
                      <span className="text-sm font-medium truncate">{s.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {s.tagline || s.description?.slice(0, 80)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {s.cohort?.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">&middot;</span>
                      <span className="text-[11px] text-muted-foreground">
                        {getSubmissionStatusLabel(s.status)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Cohorts */}
      {publicCohorts.length > 0 && (
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            Buildathons
          </h2>
          <div className="divide-y">
            {publicCohorts.map((c) => {
              const days = daysUntil(c.submissionDeadline);
              const isActive = c.status === "active";
              return (
                <Link
                  key={c.id}
                  href={`/cohorts/${c.slug}`}
                  className="flex items-center justify-between py-3 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isActive && (
                      <span className={`text-xs font-mono tabular-nums ${days <= 5 ? "text-red-500" : "text-muted-foreground"}`}>
                        {days}d
                      </span>
                    )}
                    {c.status === "upcoming" && (
                      <span className="text-xs text-muted-foreground">Upcoming</span>
                    )}
                    {c.status === "completed" && (
                      <span className="text-xs text-muted-foreground">Completed</span>
                    )}
                    {c.status === "judging" && (
                      <span className="text-xs text-muted-foreground">Judging</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
