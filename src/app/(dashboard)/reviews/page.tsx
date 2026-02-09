"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { reviewsService } from "@/services";
import type { Review } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, ChevronRight } from "lucide-react";

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

  const ReviewRow = ({ review }: { review: Review }) => (
    <Link
      href={`/reviews/${review.id}`}
      className="flex items-start justify-between rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{review.submission?.title}</span>
          {review.status === "completed" && review.overallScore && (
            <span className="font-mono text-xs tabular-nums text-emerald-600">
              {review.overallScore.toFixed(1)}/10
            </span>
          )}
        </div>
        {review.submission?.tagline && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {review.submission.tagline}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground">
            {review.submission?.team?.name || "Solo"}
          </span>
          <span className="text-[11px] text-muted-foreground">&middot;</span>
          <span className="text-[11px] text-muted-foreground">
            {review.submission?.track?.name || "Open"}
          </span>
          {review.submission?.techStack && review.submission.techStack.length > 0 && (
            <>
              <span className="text-[11px] text-muted-foreground">&middot;</span>
              <span className="text-[11px] text-muted-foreground">
                {review.submission.techStack.slice(0, 3).join(", ")}
                {review.submission.techStack.length > 3 && ` +${review.submission.techStack.length - 3}`}
              </span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
    </Link>
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>

      {/* Stats strip */}
      <div className="flex items-center divide-x">
        <div className="pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {pendingReviews.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-blue-600">
            {inProgressReviews.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">In Progress</div>
        </div>
        <div className="pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {completedReviews.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-8">
        <TabsList variant="line">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2">
          {pendingReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No pending reviews</p>
              <p className="text-xs mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            pendingReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-2">
          {inProgressReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No reviews in progress</p>
            </div>
          ) : (
            inProgressReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-2">
          {completedReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No completed reviews yet</p>
            </div>
          ) : (
            completedReviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
