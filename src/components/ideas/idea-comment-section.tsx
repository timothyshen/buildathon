"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Reply, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { ideasService } from "@/services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { IdeaComment } from "@/types";

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

interface CommentItemProps {
  comment: IdeaComment;
  ideaId: string;
  isReply?: boolean;
  onCommentAdded: () => void;
}

function CommentItem({ comment, ideaId, isReply = false, onCommentAdded }: CommentItemProps) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);

  const isOwner = user?.id === comment.authorId;

  const handleReply = async () => {
    if (!user || !replyText.trim()) return;
    setIsSubmitting(true);
    const res = await ideasService.addComment(ideaId, user.id, replyText.trim(), comment.id);
    if (res.success) {
      setReplyText("");
      setShowReply(false);
      onCommentAdded();
    } else {
      toast.error("Failed to post reply");
    }
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    const res = await ideasService.updateComment(comment.id, editText.trim());
    if (res.success) {
      setIsEditing(false);
      onCommentAdded();
    } else {
      toast.error("Failed to update comment");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const res = await ideasService.deleteComment(comment.id);
    if (res.success) {
      onCommentAdded();
    } else {
      toast.error("Failed to delete comment");
    }
    setIsSubmitting(false);
  };

  return (
    <div className={cn("group", isReply && "ml-8 border-l-2 border-border pl-4")}>
      <div className="flex items-start gap-3 py-3">
        <img
          src={comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
          alt={comment.author?.name || "User"}
          className="h-7 w-7 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{comment.author?.name || "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditText(comment.body); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{comment.body}</p>
          )}

          {!isEditing && (
            <div className="mt-1.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {user && !isReply && (
                <button
                  onClick={() => setShowReply(!showReply)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {showReply && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyText.trim()}>
                  {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowReply(false); setReplyText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          ideaId={ideaId}
          isReply
          onCommentAdded={onCommentAdded}
        />
      ))}
    </div>
  );
}

interface IdeaCommentSectionProps {
  ideaId: string;
  comments: IdeaComment[];
  onRefresh: () => void;
}

export function IdeaCommentSection({ ideaId, comments, onRefresh }: IdeaCommentSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login?redirect=/ideas");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const res = await ideasService.addComment(ideaId, user.id, newComment.trim());
    if (res.success) {
      setNewComment("");
      onRefresh();
    } else {
      toast.error("Failed to post comment");
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      <div className="mb-6">
        {user ? (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment..."
              rows={3}
              className="text-sm"
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Comment
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <button onClick={() => router.push("/login?redirect=/ideas")} className="text-primary hover:underline">
                Sign in
              </button>{" "}
              to leave a comment.
            </p>
          </div>
        )}
      </div>

      <div className="divide-y">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ideaId={ideaId}
              onCommentAdded={onRefresh}
            />
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
