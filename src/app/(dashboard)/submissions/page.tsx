"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, tracksService, cohortsService } from "@/services";
import type { Submission, Track, Cohort } from "@/types";
import { getSubmissionStatusLabel } from "@/lib/utils/status";
import { getSubmissionPrizes, type PrizeInfo } from "@/lib/prize-utils";
import { Button } from "@/components/ui/button";
import { PrizeBadges } from "@/components/ui/prize-badges";
import {
  Plus,
  FileText,
  ExternalLink,
  Github,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Trophy,
} from "lucide-react";

interface EnrichedSubmission extends Submission {
  prizes: PrizeInfo[];
}

const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  submitted: "bg-blue-500",
  under_review: "bg-amber-500",
  accepted: "bg-violet-500",
  winner: "bg-emerald-500",
};

const PAGE_SIZE = 10;

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [userSubmissions, setUserSubmissions] = useState<EnrichedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, success } = await submissionsService.getByUser(user.id);
      if (!success) {
        setIsLoading(false);
        return;
      }

      // Load cohorts and tracks to compute prizes
      const cohortIds = [...new Set(data.map((s: Submission) => s.cohortId).filter(Boolean))];
      const [cohortsResult, ...trackResults] = await Promise.all([
        cohortsService.list(),
        ...cohortIds.map((id) => tracksService.getByCohort(id as string)),
      ]);

      const cohortMap = new Map<string, Cohort>(
        cohortsResult.data.map((c: Cohort) => [c.id, c])
      );
      const trackMap = new Map<string, Track[]>();
      cohortIds.forEach((id, index) => {
        trackMap.set(id as string, trackResults[index].data);
      });

      // Enrich submissions with prizes
      const enriched: EnrichedSubmission[] = data.map((submission: Submission) => {
        const cohort = submission.cohortId ? cohortMap.get(submission.cohortId) : undefined;
        const tracks = submission.cohortId ? (trackMap.get(submission.cohortId) || []) : [];
        const track = tracks.find((t) => t.id === submission.trackId);
        const prizes = getSubmissionPrizes(submission, cohort, track);

        return {
          ...submission,
          prizes,
        };
      });

      setUserSubmissions(enriched);
      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

  const filtered = filter === "all"
    ? userSubmissions
    : userSubmissions.filter((s) => s.status === filter);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedSubmissions = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const drafts = userSubmissions.filter((s) => s.status === "draft").length;
  const wins = userSubmissions.filter((s) => s.status === "winner").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filters = [
    { value: "all", label: "All" },
    { value: "draft", label: "Drafts" },
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "In Review" },
    { value: "winner", label: "Winners" },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/submit" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {userSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {drafts}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Drafts</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {wins}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Wins</div>
        </div>
      </div>

      {userSubmissions.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-medium">No submissions yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first buildathon submission to get started.
          </p>
          <Button asChild size="sm" className="mt-4 bg-foreground text-background hover:bg-foreground/90">
            <Link href="/submit">Create submission</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                  filter === f.value
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Submission list */}
          <div className="space-y-3">
            {paginatedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[submission.status] || statusDot.draft}`} />
                      <Link
                        href={
                          submission.status === "draft"
                            ? `/submissions/${submission.id}/edit`
                            : `/submissions/${submission.id}`
                        }
                        className="text-sm font-medium hover:underline"
                      >
                        {submission.title}
                      </Link>
                      <span className="text-[11px] text-muted-foreground">
                        {getSubmissionStatusLabel(submission.status)}
                      </span>
                      {submission.prizes.length > 0 && (
                        <PrizeBadges prizes={submission.prizes} maxVisible={2} size="sm" />
                      )}
                    </div>
                    {submission.tagline && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {submission.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">
                        {submission.cohort?.name}
                      </span>
                      {submission.track && (
                        <>
                          <span className="text-[11px] text-muted-foreground">&middot;</span>
                          <span className="text-[11px] text-muted-foreground">
                            {submission.track.name}
                          </span>
                        </>
                      )}
                      {submission.techStack.length > 0 && (
                        <>
                          <span className="text-[11px] text-muted-foreground">&middot;</span>
                          <span className="text-[11px] text-muted-foreground">
                            {submission.techStack.slice(0, 3).join(", ")}
                            {submission.techStack.length > 3 && ` +${submission.techStack.length - 3}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {submission.demoUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {submission.repoUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {submission.status !== "draft" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Traction">
                        <Link href={`/submissions/${submission.id}/traction`}>
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Link
                      href={
                        submission.status === "draft"
                          ? `/submissions/${submission.id}/edit`
                          : `/submissions/${submission.id}`
                      }
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </div>

                {submission.ipAssetId && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600">
                    <Trophy className="h-3 w-3" />
                    <span>IP registered on Story Protocol</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
