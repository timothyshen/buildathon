"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  reviewsService,
  submissionsService,
  sponsorsService,
  tracksService,
} from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { Review, Submission, Track, SponsorOrg } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TrackSubmission {
  submission: Submission;
  track: Track;
  review: Review | null;
}

export default function SponsorReviewsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [sponsorOrg, setSponsorOrg] = useState<SponsorOrg | null>(null);
  const [trackSubmissions, setTrackSubmissions] = useState<TrackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingReviewFor, setCreatingReviewFor] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get sponsor org for this user
      const orgResult = await sponsorsService.getOrgByUser(user.id);
      if (!orgResult.success || !orgResult.data) {
        setIsLoading(false);
        return;
      }
      setSponsorOrg(orgResult.data);

      // Get tracks for this sponsor org
      const tracksResult = await tracksService.getBySponsor(orgResult.data.id);
      if (!tracksResult.success) {
        setIsLoading(false);
        return;
      }

      // Fetch all track submissions in parallel
      const trackSubmissionResults = await Promise.all(
        tracksResult.data.map((track) => submissionsService.getByTrack(track.id))
      );

      // Deduplicate submissions across tracks
      const seenSubmissionIds = new Set<string>();
      const uniqueSubmissions: { submission: Submission; track: Track }[] = [];

      tracksResult.data.forEach((track, index) => {
        const subResult = trackSubmissionResults[index];
        if (!subResult.success) return;

        for (const submission of subResult.data) {
          if (seenSubmissionIds.has(submission.id)) continue;
          seenSubmissionIds.add(submission.id);
          uniqueSubmissions.push({ submission, track });
        }
      });

      // Fetch all reviews in parallel
      const reviewResults = await Promise.all(
        uniqueSubmissions.map(({ submission }) =>
          reviewsService.getBySubmission(submission.id)
        )
      );

      const allTrackSubmissions: TrackSubmission[] = uniqueSubmissions.map(
        ({ submission, track }, index) => {
          const reviewsResult = reviewResults[index];
          const existingReview = reviewsResult.success
            ? reviewsResult.data.find((r) => r.judgeId === user.id)
            : null;
          return { submission, track, review: existingReview || null };
        }
      );

      setTrackSubmissions(allTrackSubmissions);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const handleReview = async (item: TrackSubmission) => {
    if (!user) return;

    if (item.review) {
      // Existing review - navigate directly
      router.push(`/reviews/${item.review.id}?from=sponsor`);
      return;
    }

    // Create new review
    setCreatingReviewFor(item.submission.id);
    try {
      const result = await reviewsService.create({
        submissionId: item.submission.id,
        judgeId: user.id,
      });
      if (result.success) {
        router.push(`/reviews/${result.data.id}?from=sponsor`);
      } else {
        toast.error(result.error || "Failed to create review");
      }
    } catch {
      toast.error("Failed to create review");
    } finally {
      setCreatingReviewFor(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sponsorOrg) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">
          No sponsor organization found for your account.
        </p>
      </div>
    );
  }

  const reviewedCount = trackSubmissions.filter(
    (ts) => ts.review?.status === "completed"
  ).length;
  const inProgressCount = trackSubmissions.filter(
    (ts) => ts.review?.status === "in_progress"
  ).length;
  const notStartedCount = trackSubmissions.filter(
    (ts) => !ts.review
  ).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Track Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review submissions that selected your track ({sponsorOrg.name})
        </p>
      </div>

      {/* Stats strip */}
      <div className="flex items-center divide-x">
        <div className="pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {trackSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {reviewedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Reviewed</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-blue-600">
            {inProgressCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">In Progress</div>
        </div>
        <div className="pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {notStartedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Not Started</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="hidden md:table-cell">Team</TableHead>
              <TableHead className="hidden md:table-cell">Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trackSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    No submissions in your tracks yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              trackSubmissions.map((item) => (
                <TableRow key={item.submission.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{item.submission.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.submission.tagline}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {item.submission.team?.name || "Solo"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {item.track.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.review?.status === "completed" ? "bg-emerald-500"
                          : item.review?.status === "in_progress" ? "bg-blue-500"
                          : "bg-amber-500"
                      }`} />
                      <span className="text-xs capitalize">
                        {item.review ? item.review.status.replace("_", " ") : "Not started"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.review?.overallScore ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-mono text-xs tabular-nums text-emerald-600">
                          {item.review.overallScore.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={item.review?.status === "completed" ? "ghost" : "default"}
                      size="sm"
                      onClick={() => handleReview(item)}
                      disabled={creatingReviewFor === item.submission.id}
                      className={item.review?.status === "completed" ? "" : "bg-foreground text-background hover:bg-foreground/90"}
                    >
                      {creatingReviewFor === item.submission.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : item.review?.status === "completed" ? (
                        "View"
                      ) : item.review ? (
                        "Continue"
                      ) : (
                        "Review"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
