"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { mockReviews, mockCohorts } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Clock, FileText } from "lucide-react";

export function JudgeDashboard() {
  const { user } = useAuth();

  // Get judge's reviews
  const judgeReviews = mockReviews.filter((r) => r.judgeId === user?.id);
  const pendingReviews = judgeReviews.filter((r) => r.status === "pending");
  const completedReviews = judgeReviews.filter((r) => r.status === "completed");

  // Get active judging cohorts
  const judgingCohorts = mockCohorts.filter((c) => c.status === "judging" || c.status === "active");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Judge Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Review submissions and help select the winners.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReviews.length}</div>
            <p className="text-xs text-muted-foreground">Reviews completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judgeReviews.length}</div>
            <p className="text-xs text-muted-foreground">Submissions to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score Given</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedReviews.length > 0
                ? (
                    completedReviews.reduce((acc, r) => acc + (r.overallScore || 0), 0) /
                    completedReviews.length
                  ).toFixed(1)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Out of 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>Submissions waiting for your review</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You&apos;ve reviewed all assigned submissions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-semibold">{review.submission?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {review.submission?.tagline || review.submission?.team?.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">
                        {review.submission?.track?.name || "Open Track"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {review.submission?.cohort?.name}
                      </span>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/reviews/${review.id}`}>Review Now</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Reviews */}
      {completedReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Reviews</CardTitle>
            <CardDescription>Your submitted reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{review.submission?.title}</h3>
                      <Badge className="bg-green-100 text-green-800">Reviewed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Score: {review.overallScore?.toFixed(1)}/10
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/reviews/${review.id}`}>View Review</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
