"use client";

import { useState, useEffect } from "react";
import { reviewsService, submissionsService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { Review, Submission } from "@/types";
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
import Link from "next/link";
import { Eye, Loader2 } from "lucide-react";
import { getReviewStatusColor } from "@/lib/utils/colors";

export default function SponsorReviewsPage() {
  const { user } = useAuth();

  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const reviewsResult = await reviewsService.getByJudge(user.id);
      if (reviewsResult.success) {
        setUserReviews(reviewsResult.data);
      }

      // Load submissions list for lookup
      const submissionsResult = await submissionsService.list();
      if (submissionsResult.success) {
        setSubmissions(submissionsResult.data);
      }

      setIsLoading(false);
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = userReviews.filter((r) => r.status === "pending").length;
  const completedCount = userReviews.filter((r) => r.status === "completed").length;

  const getSubmission = (submissionId: string) => {
    return submissions.find((s) => s.id === submissionId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="mt-2 text-muted-foreground">
          Judge submissions assigned to you
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-foreground">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userReviews.map((review) => {
                const submission = getSubmission(review.submissionId);
                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission?.title || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission?.tagline}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{submission?.team?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge className={getReviewStatusColor(review.status)}>
                        {review.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {review.overallScore ? (
                        <span className="font-medium">{review.overallScore}/10</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/reviews/${review.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {userReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No reviews assigned yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
