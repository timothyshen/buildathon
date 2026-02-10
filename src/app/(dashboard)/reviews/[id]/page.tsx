"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { reviewsService } from "@/services";
import type { Review } from "@/types";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  Github,
  Play,
  Loader2,
  Star,
  ArrowLeft,
} from "lucide-react";

const scoreCategories = [
  { key: "innovation", label: "Innovation", description: "How novel and creative is the idea?" },
  { key: "execution", label: "Execution", description: "How well is the project implemented?" },
  { key: "design", label: "Design", description: "How good is the UX/UI?" },
  { key: "impact", label: "Impact", description: "What's the potential impact?" },
  { key: "presentation", label: "Presentation", description: "How well is it presented?" },
];

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const backHref = from === "admin" ? "/admin/judge" : from === "sponsor" ? "/sponsor/reviews" : "/reviews";
  const backLabel = from === "admin" ? "Judge" : from === "sponsor" ? "Track Reviews" : "Reviews";

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState({
    innovation: 0,
    execution: 0,
    design: 0,
    impact: 0,
    presentation: 0,
  });
  const [feedback, setFeedback] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data, success } = await reviewsService.getById(id);
      if (success && data) {
        setReview(data);
        setScores({
          innovation: data.innovationScore || 0,
          execution: data.executionScore || 0,
          design: data.designScore || 0,
          impact: data.impactScore || 0,
          presentation: data.presentationScore || 0,
        });
        setFeedback(data.feedback || "");
        setInternalNotes(data.internalNotes || "");
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review || !review.submission) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Review not found</p>
        <Button asChild variant="ghost" size="sm" className="mt-4">
          <Link href={backHref}>Back to {backLabel}</Link>
        </Button>
      </div>
    );
  }

  const submission = review.submission;
  const isCompleted = review.status === "completed";

  const averageScore =
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  const handleScoreChange = (category: string, value: number) => {
    setScores((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await reviewsService.submitReview(id, {
        innovationScore: scores.innovation,
        executionScore: scores.execution,
        designScore: scores.design,
        impactScore: scores.impact,
        presentationScore: scores.presentation,
        feedback: feedback || undefined,
        internalNotes: internalNotes || undefined,
      });
      if (result.success) {
        // Fire-and-forget notification trigger
        fetch("/api/notifications/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "review_completed",
            data: { submissionId: review.submissionId },
          }),
        }).catch(() => {});

        toast.success("Review submitted successfully");
        router.push(backHref);
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const links = [
    { url: submission.demoUrl, label: "Live Demo", icon: ExternalLink },
    { url: submission.repoUrl, label: "Repository", icon: Github },
    { url: submission.videoUrl, label: "Demo Video", icon: Play },
  ].filter((l) => l.url);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: backLabel, href: backHref },
          { label: submission.title },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{submission.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {submission.team?.name || "Solo"} &middot; {submission.cohort?.name}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left — Project Details */}
        <div className="space-y-6">
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Project Details
            </h2>
            <div className="rounded-xl border p-5 space-y-4">
              {submission.tagline && (
                <p className="text-sm text-muted-foreground">{submission.tagline}</p>
              )}

              {submission.description && (
                <p className="text-sm">{submission.description}</p>
              )}

              {submission.techStack.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {submission.techStack.join(", ")}
                </p>
              )}

              {submission.builtWithStory && (
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  <span className="text-xs text-violet-600">Built with Story Protocol</span>
                </div>
              )}
            </div>
          </section>

          {links.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Links
              </h2>
              <div className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border py-3 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right — Review Form */}
        <div className="space-y-6">
          {/* Scoring */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Scoring
            </h2>
            <div className="rounded-xl border p-5 space-y-5">
              {scoreCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{category.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <span className="font-mono text-sm tabular-nums font-semibold">
                      {scores[category.key as keyof typeof scores] || "—"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleScoreChange(category.key, value)}
                        disabled={isCompleted}
                        className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                          scores[category.key as keyof typeof scores] >= value
                            ? "bg-foreground text-background"
                            : "bg-muted hover:bg-muted/80"
                        } ${isCompleted ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Overall */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-medium">Overall</span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    {averageScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 10</span>
                </div>
              </div>
            </div>
          </section>

          {/* Feedback */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Feedback
            </h2>
            <div className="rounded-xl border p-5 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="feedback" className="text-xs text-muted-foreground">
                  Public Feedback
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="What did you like? What could be improved?"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isCompleted}
                />
                <p className="text-[11px] text-muted-foreground">
                  Shared with the team
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs text-muted-foreground">
                  Internal Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Notes for other judges (not shared with team)"
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  disabled={isCompleted}
                />
                <p className="text-[11px] text-muted-foreground">
                  Only visible to judges and admins
                </p>
              </div>
            </div>
          </section>

          {/* Submit */}
          {!isCompleted && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.values(scores).some((s) => s === 0)}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Review...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
