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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, CheckCircle, Clock, Loader2 } from "lucide-react";
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

      // For each track, get submissions and check for existing reviews
      const allTrackSubmissions: TrackSubmission[] = [];
      const seenSubmissionIds = new Set<string>();

      for (const track of tracksResult.data) {
        const subResult = await submissionsService.getByTrack(track.id);
        if (!subResult.success) continue;

        for (const submission of subResult.data) {
          // Avoid duplicates if submission is in multiple tracks from same sponsor
          if (seenSubmissionIds.has(submission.id)) continue;
          seenSubmissionIds.add(submission.id);

          // Check for existing review by this user
          const reviewsResult = await reviewsService.getBySubmission(submission.id);
          const existingReview = reviewsResult.success
            ? reviewsResult.data.find((r) => r.judgeId === user.id)
            : null;

          allTrackSubmissions.push({
            submission,
            track,
            review: existingReview || null,
          });
        }
      }

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
        <div className="text-muted-foreground">
          No sponsor organization found for your account.
        </div>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Track Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Review submissions that selected your track ({sponsorOrg.name})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackSubmissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reviewedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{notStartedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
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
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No submissions in your tracks yet.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                trackSubmissions.map((item) => (
                  <TableRow key={item.submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.submission.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.submission.tagline}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.submission.team?.name || "Solo"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{item.track.name}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.review ? (
                        <Badge
                          className={
                            item.review.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : item.review.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }
                        >
                          {item.review.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not started</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.review?.overallScore ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">
                            {item.review.overallScore.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={item.review?.status === "completed" ? "ghost" : "default"}
                        size="sm"
                        onClick={() => handleReview(item)}
                        disabled={creatingReviewFor === item.submission.id}
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
        </CardContent>
      </Card>
    </div>
  );
}
