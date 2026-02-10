"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cohortsService, submissionsService, reviewsService, usersService } from "@/services";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Cohort, Submission } from "@/types";

export function AdminDashboard() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [judgeCount, setJudgeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [cohortsResult, submissionsResult, pendingReviewsResult, judgesResult] = await Promise.all([
        cohortsService.list(),
        submissionsService.list({ pageSize: 5, sortBy: "createdAt", sortOrder: "desc" }),
        reviewsService.list({ status: "pending", pageSize: 1 }),
        usersService.list({ role: "judge", pageSize: 1 }),
      ]);

      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (submissionsResult.success) {
        setSubmissions(submissionsResult.data);
        setTotalSubmissions(submissionsResult.total);
      }
      if (pendingReviewsResult.success) setPendingReviewCount(pendingReviewsResult.total);
      if (judgesResult.success) setJudgeCount(judgesResult.total);

      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCohorts = cohorts.filter((c) => c.status === "active");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage buildathons, submissions, and judges.
          </p>
        </div>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
          <Link href="/admin/cohorts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Cohort
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {activeCohorts.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active Cohorts</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {totalSubmissions}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Submissions</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {pendingReviewCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending Reviews</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {judgeCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Judges</div>
        </div>
      </div>

      {/* Cohorts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Cohorts
          </h2>
          <Link
            href="/admin/cohorts"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="rounded-xl border divide-y">
          {cohorts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No cohorts yet.</p>
            </div>
          ) : (
            cohorts.map((cohort) => (
                <Link
                  key={cohort.id}
                  href={`/admin/cohorts/${cohort.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{cohort.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          cohort.status === "active" ? "bg-emerald-500"
                            : cohort.status === "upcoming" ? "bg-blue-500"
                            : cohort.status === "judging" ? "bg-violet-500"
                            : cohort.status === "completed" ? "bg-amber-500"
                            : "bg-muted-foreground"
                        }`} />
                        <span className="text-xs text-muted-foreground capitalize">{cohort.status}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(cohort.startDate).toLocaleDateString()} – {new Date(cohort.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))
          )}
        </div>
      </section>

      {/* Recent Submissions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Recent Submissions
          </h2>
          <Link
            href="/admin/submissions"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="rounded-xl border divide-y">
          {submissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            </div>
          ) : (
            submissions.slice(0, 5).map((submission) => (
              <Link
                key={submission.id}
                href={`/admin/submissions/${submission.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{submission.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        submission.status === "submitted" ? "bg-emerald-500"
                          : submission.status === "draft" ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">{submission.status}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {submission.team?.name || "Solo"} · {submission.cohort?.name}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
