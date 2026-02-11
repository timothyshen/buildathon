"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  reviewsService,
  submissionsService,
  tracksService,
} from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { Review, Submission, Track } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
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

  const [trackSubmissions, setTrackSubmissions] = useState<TrackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingReviewFor, setCreatingReviewFor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    async function loadData() {
      if (!user?.sponsorOrgId) {
        setIsLoading(false);
        return;
      }

      // Fetch tracks and submissions in parallel (no sequential waterfall)
      const [tracksResult, submissionsResult] = await Promise.all([
        tracksService.getBySponsor(user.sponsorOrgId),
        submissionsService.getByTrackSponsor(user.sponsorOrgId),
      ]);

      if (!tracksResult.success || !submissionsResult.success) {
        setIsLoading(false);
        return;
      }

      const submissions = submissionsResult.data;
      const tracks = tracksResult.data;

      // Build a track lookup for display
      const trackMap = new Map<string, Track>(tracks.map((t) => [t.id, t]));

      // Batch-fetch all reviews for these submissions (1 query instead of N)
      const submissionIds = submissions.map((s) => s.id);
      const reviewsResult = await reviewsService.getBySubmissions(submissionIds);
      const allReviews = reviewsResult.success ? reviewsResult.data : [];

      // Group reviews by submission ID
      const reviewsBySubmission = new Map<string, Review[]>();
      for (const review of allReviews) {
        const existing = reviewsBySubmission.get(review.submissionId) || [];
        existing.push(review);
        reviewsBySubmission.set(review.submissionId, existing);
      }

      const allTrackSubmissions: TrackSubmission[] = submissions.map((submission) => {
        const track = (submission.trackId && trackMap.get(submission.trackId)) || tracks[0];
        const submissionReviews = reviewsBySubmission.get(submission.id) || [];
        const existingReview = submissionReviews.find((r) => r.judgeId === user.id) || null;
        return { submission, track, review: existingReview };
      });

      setTrackSubmissions(allTrackSubmissions);
      setIsLoading(false);
    }
    loadData();
  }, [user?.sponsorOrgId, user?.id]);

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
          Review submissions that selected your track
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {trackSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {reviewedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Reviewed</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-blue-600">
            {inProgressCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">In Progress</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {notStartedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Not Started</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
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
              trackSubmissions.slice((page - 1) * pageSize, page * pageSize).map((item) => (
                <TableRow key={item.submission.id}>
                  <TableCell>
                    <div className="max-w-[200px] md:max-w-none">
                      <p className="text-sm font-medium truncate">{item.submission.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.submission.tagline}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.submission.team?.name || "Solo"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
                  <TableCell>
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

      {trackSubmissions.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={trackSubmissions.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      )}
    </div>
  );
}
