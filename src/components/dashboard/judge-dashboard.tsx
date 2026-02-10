"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { reviewsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import type { Review } from "@/types";

export function JudgeDashboard() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const reviewsResult = await reviewsService.getByJudge(user.id);
      if (reviewsResult.success) setReviews(reviewsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const completedReviews = reviews.filter((r) => r.status === "completed");
  const avgScore =
    completedReviews.length > 0
      ? (
          completedReviews.reduce((acc, r) => acc + (r.overallScore || 0), 0) /
          completedReviews.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-10">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {pendingReviews.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {completedReviews.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {reviews.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-violet-600">
            {avgScore}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
        </div>
      </div>

      {/* Pending Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Pending Reviews
          </h2>
          {pendingReviews.length > 0 && (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/reviews">View all</Link>
            </Button>
          )}
        </div>

        {pendingReviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs mt-1">You&apos;ve reviewed all assigned submissions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingReviews.map((review) => (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="flex items-center justify-between rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">
                    {review.submission?.title}
                  </span>
                  {review.submission?.tagline && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {review.submission.tagline}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {review.submission?.team?.name || "Solo"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">&middot;</span>
                    <span className="text-[11px] text-muted-foreground">
                      {review.submission?.track?.name || "Open Track"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Completed Reviews */}
      {completedReviews.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            Completed Reviews
          </h2>
          <div className="space-y-2">
            {completedReviews.map((review) => (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="flex items-center justify-between rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {review.submission?.title}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-emerald-600">
                      {review.overallScore?.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {review.submission?.team?.name || "Solo"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">&middot;</span>
                    <span className="text-[11px] text-muted-foreground">
                      {review.submission?.track?.name || "Open Track"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
