"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { reviewsService } from "@/services";
import type { Review } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [judgeReviews, setJudgeReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, success } = await reviewsService.getByJudge(user.id);
      if (success) setJudgeReviews(data);
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

  const pendingReviews = judgeReviews.filter((r) => r.status === "pending");
  const inProgressReviews = judgeReviews.filter((r) => r.status === "in_progress");
  const completedReviews = judgeReviews.filter((r) => r.status === "completed");

  const ReviewCard = ({ review }: { review: Review }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{review.submission?.title}</h3>
              {review.status === "completed" && review.overallScore && (
                <Badge className="bg-green-100 text-green-800">
                  {review.overallScore.toFixed(1)}/10
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {review.submission?.tagline || review.submission?.description?.slice(0, 100)}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Team: {review.submission?.team?.name || "Solo"}</span>
              <span>Track: {review.submission?.track?.name || "Open"}</span>
            </div>
            {review.submission?.techStack && (
              <div className="flex flex-wrap gap-1">
                {review.submission.techStack.slice(0, 5).map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button asChild>
            <Link href={`/reviews/${review.id}`}>
              {review.status === "completed" ? "View Review" : "Review Now"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="mt-2 text-muted-foreground">
          Review assigned submissions and provide feedback
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReviews.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 font-semibold">No pending reviews</h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;re all caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6 space-y-4">
          {inProgressReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No reviews in progress
                </p>
              </CardContent>
            </Card>
          ) : (
            inProgressReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No completed reviews yet
                </p>
              </CardContent>
            </Card>
          ) : (
            completedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
