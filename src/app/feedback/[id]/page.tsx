"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Calendar, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { VoteButton } from "@/components/feedback/vote-button";
import { FeedbackStatusBadge } from "@/components/feedback/feedback-status-badge";
import { FeedbackCategoryBadge } from "@/components/feedback/feedback-category-badge";
import { FeedbackStatusSelect } from "@/components/feedback/feedback-status-select";
import { CommentSection } from "@/components/feedback/comment-section";
import { feedbackService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { FeedbackPost, FeedbackComment, FeedbackStatus } from "@/types";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [post, setPost] = useState<FeedbackPost | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    const res = await feedbackService.getById(id, user?.id);
    if (res.success && res.data) {
      setPost(res.data);
    } else {
      router.push("/feedback");
    }
  }, [id, user?.id, router]);

  const loadComments = useCallback(async () => {
    const res = await feedbackService.getComments(id);
    if (res.success) {
      setComments(res.data);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      await Promise.all([loadPost(), loadComments()]);
      setIsLoading(false);
    }
    load();
  }, [loadPost, loadComments]);

  const handleStatusChange = (newStatus: FeedbackStatus) => {
    if (post) {
      setPost({ ...post, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) return null;

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feedback
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main Content */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{post.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FeedbackCategoryBadge category={post.category} />
              <FeedbackStatusBadge status={post.status} />
            </div>

            {/* Description */}
            <div className="mt-6 prose prose-neutral dark:prose-invert max-w-none">
              <RichTextDisplay content={post.description} />
            </div>

            {/* Comments */}
            <div className="mt-10 border-t pt-8">
              <CommentSection
                postId={post.id}
                comments={comments}
                onRefresh={loadComments}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Vote Card */}
            <Card>
              <CardContent className="flex flex-col items-center py-6">
                <VoteButton
                  postId={post.id}
                  initialCount={post.voteCount}
                  initialHasVoted={post.hasVoted}
                  size="lg"
                  onVoteChange={(newCount, hasVoted) => {
                    setPost({ ...post, voteCount: newCount, hasVoted });
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">upvotes</p>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>{post.author?.name || "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Status */}
            {isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeedbackStatusSelect
                    postId={post.id}
                    currentStatus={post.status}
                    onStatusChange={handleStatusChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
