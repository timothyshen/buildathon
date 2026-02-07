"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { VoteButton } from "./vote-button";
import { FeedbackStatusBadge } from "./feedback-status-badge";
import { FeedbackCategoryBadge } from "./feedback-category-badge";
import type { FeedbackPost } from "@/types";

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface FeedbackCardProps {
  post: FeedbackPost;
  onVoteChange?: (postId: string, newCount: number, hasVoted: boolean) => void;
}

export function FeedbackCard({ post, onVoteChange }: FeedbackCardProps) {
  const excerpt = stripHtml(post.description).slice(0, 140);

  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
      {/* Vote button */}
      <div className="flex-shrink-0 pt-0.5">
        <VoteButton
          postId={post.id}
          initialCount={post.voteCount}
          initialHasVoted={post.hasVoted}
          onVoteChange={(newCount, hasVoted) => onVoteChange?.(post.id, newCount, hasVoted)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/feedback/${post.id}`} className="group">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {post.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {excerpt}{excerpt.length < stripHtml(post.description).length ? "..." : ""}
        </p>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FeedbackCategoryBadge category={post.category} />
          <FeedbackStatusBadge status={post.status} />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {post.commentCount}
          </span>
          <span className="text-xs text-muted-foreground">
            {post.author?.name || "Anonymous"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
