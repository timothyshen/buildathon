"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Calendar, User as UserIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { IdeaVoteButton } from "@/components/ideas/idea-vote-button";
import { IdeaCommentSection } from "@/components/ideas/idea-comment-section";
import { IdeaInterestSection } from "@/components/ideas/idea-interest-section";
import { ideasService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Idea, IdeaComment, IdeaInterest, IdeaStatus } from "@/types";

const STATUS_COLORS: Record<IdeaStatus, string> = {
  open: "bg-blue-500",
  seeking_team: "bg-amber-500",
  in_progress: "bg-violet-500",
  built: "bg-emerald-500",
  archived: "bg-muted-foreground",
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  open: "Open",
  seeking_team: "Seeking Team",
  in_progress: "In Progress",
  built: "Built",
  archived: "Archived",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [interests, setInterests] = useState<IdeaInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadIdea = useCallback(async () => {
    const res = await ideasService.getById(id, user?.id);
    if (res.success && res.data) {
      setIdea(res.data);
    } else {
      router.push("/ideas");
    }
  }, [id, user?.id, router]);

  const loadComments = useCallback(async () => {
    const res = await ideasService.getComments(id);
    if (res.success) {
      setComments(res.data);
    }
  }, [id]);

  const loadInterests = useCallback(async () => {
    const res = await ideasService.getInterests(id);
    if (res.success) {
      setInterests(res.data);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      await Promise.all([loadIdea(), loadComments(), loadInterests()]);
      setIsLoading(false);
    }
    load();
  }, [loadIdea, loadComments, loadInterests]);

  const handleStatusChange = async (newStatus: string) => {
    if (!idea) return;
    const res = await ideasService.update(idea.id, { status: newStatus as IdeaStatus });
    if (res.success) {
      setIdea({ ...idea, status: newStatus as IdeaStatus });
      toast.success("Status updated");
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!idea) return;
    const res = await ideasService.delete(idea.id);
    if (res.success) {
      toast.success("Idea deleted");
      router.push("/ideas");
    } else {
      toast.error("Failed to delete idea");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!idea) return null;

  const isAuthor = user?.id === idea.authorId;
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Ideas
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Title + meta */}
            <h1 className="text-2xl font-semibold tracking-tight">{idea.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* Status dot */}
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", STATUS_COLORS[idea.status])} />
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[idea.status]}</span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" />
                {idea.author?.name || "Anonymous"}
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(idea.createdAt)}
              </div>
            </div>

            {/* Tags */}
            {idea.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none">
              <RichTextDisplay content={idea.description} />
            </div>

            {/* Comments */}
            <div className="mt-10 border-t pt-8">
              <IdeaCommentSection
                ideaId={idea.id}
                comments={comments}
                onRefresh={loadComments}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Vote */}
            <section className="rounded-xl border p-5 flex flex-col items-center">
              <IdeaVoteButton
                ideaId={idea.id}
                initialCount={idea.voteCount}
                initialHasVoted={idea.hasVoted}
                size="lg"
                onVoteChange={(newCount, hasVoted) => {
                  setIdea({ ...idea, voteCount: newCount, hasVoted });
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">upvotes</p>
            </section>

            {/* Interest */}
            <IdeaInterestSection
              ideaId={idea.id}
              interests={interests}
              onRefresh={loadInterests}
            />

            {/* Author actions */}
            {(isAuthor || isAdmin) && (
              <section className="rounded-xl border p-5 space-y-3">
                <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  {isAdmin ? "Admin Actions" : "Manage"}
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={idea.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="seeking_team">Seeking Team</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="built">Built</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isAuthor && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                      <Link href={`/ideas/new?edit=${idea.id}`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the idea along with all its votes, comments, and interests. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </section>
            )}

            {/* Details */}
            <section className="rounded-xl border p-5 space-y-3">
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Details
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{idea.author?.name || "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(idea.createdAt)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
