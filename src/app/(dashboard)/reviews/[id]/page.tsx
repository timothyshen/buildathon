"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { reviewsService } from "@/services";
import type { Review } from "@/types";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Play,
  Loader2,
  Star,
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
      <div className="py-8 text-center">
        <p>Review not found</p>
        <Button asChild className="mt-4">
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: backLabel, href: backHref },
          { label: submission.title },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Review: {submission.title}</h1>
        <p className="text-muted-foreground">
          {submission.team?.name || "Solo"} • {submission.cohort?.name}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Submission Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{submission.title}</h3>
                {submission.tagline && (
                  <p className="text-sm text-muted-foreground">{submission.tagline}</p>
                )}
              </div>

              <p className="text-sm">{submission.description}</p>

              <div className="flex flex-wrap gap-2">
                {submission.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>

              {submission.builtWithStory && (
                <Badge className="bg-purple-100 text-purple-800">
                  Built with Story Protocol
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {submission.demoUrl && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </a>
                </Button>
              )}
              {submission.repoUrl && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Repository
                  </a>
                </Button>
              )}
              {submission.videoUrl && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Play className="mr-2 h-4 w-4" />
                    Demo Video
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>
                Rate each category from 1-10
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scoreCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{category.label}</Label>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <span className="text-lg font-semibold">
                      {scores[category.key as keyof typeof scores]}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleScoreChange(category.key, value)}
                        disabled={isCompleted}
                        className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                          scores[category.key as keyof typeof scores] >= value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        } ${isCompleted ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-semibold">Overall Score</span>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{averageScore.toFixed(1)}</span>
                  <span className="text-muted-foreground">/ 10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>
                Share constructive feedback with the team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Public Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="What did you like? What could be improved?"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isCompleted}
                />
                <p className="text-xs text-muted-foreground">
                  This will be shared with the team
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes for other judges (not shared with team)"
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  disabled={isCompleted}
                />
                <p className="text-xs text-muted-foreground">
                  Only visible to other judges and admins
                </p>
              </div>
            </CardContent>
          </Card>

          {!isCompleted && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.values(scores).some((s) => s === 0)}
              className="w-full"
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
