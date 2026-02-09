"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { reviewsService } from "@/services";
import type { Review } from "@/types";
import { toast } from "sonner";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Play,
  Star,
  User,
  Calendar,
  Loader2,
  Scale,
} from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getReviewStatusColor(status: Review["status"]): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "pending":
    default:
      return "bg-slate-100 text-slate-800";
  }
}

const scoreCategories = [
  { key: "innovationScore", label: "Innovation", description: "How novel and creative is the idea?" },
  { key: "executionScore", label: "Execution", description: "How well is the project implemented?" },
  { key: "designScore", label: "Design", description: "How good is the UX/UI?" },
  { key: "impactScore", label: "Impact", description: "What's the potential impact?" },
  { key: "presentationScore", label: "Presentation", description: "How well is it presented?" },
];

interface AdminReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminReviewDetailPage({ params }: AdminReviewDetailPageProps) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [adminReviewId, setAdminReviewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingReview, setIsCreatingReview] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (user?.role !== "admin") {
        setIsLoading(false);
        return;
      }

      const { data, success } = await reviewsService.getById(id);
      if (success && data) {
        setReview(data);

        // Check if admin already has their own review for this submission
        if (data.submissionId) {
          const reviewsResult = await reviewsService.getBySubmission(data.submissionId);
          if (reviewsResult.success) {
            const existing = reviewsResult.data.find((r) => r.judgeId === user.id);
            if (existing) {
              setAdminReviewId(existing.id);
            }
          }
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [id, user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    notFound();
  }

  // Only admins can access
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Access denied. Admin only.</div>
      </div>
    );
  }

  const submission = review.submission;
  const judge = review.judge;

  const handleJudgeSubmission = async () => {
    if (!user || !review.submissionId) return;

    if (adminReviewId) {
      router.push(`/reviews/${adminReviewId}?from=admin`);
      return;
    }

    setIsCreatingReview(true);
    try {
      const result = await reviewsService.create({
        submissionId: review.submissionId,
        judgeId: user.id,
      });
      if (result.success) {
        router.push(`/reviews/${result.data.id}?from=admin`);
      } else {
        toast.error(result.error || "Failed to create review");
      }
    } catch {
      toast.error("Failed to create review");
    } finally {
      setIsCreatingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/reviews">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin/cohorts" },
            { label: "Reviews", href: "/admin/reviews" },
            { label: `Review by ${judge?.name || "Unknown"}` },
          ]}
        />
      </div>
      <AdminNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Review Details</h1>
          <p className="mt-2 text-muted-foreground">
            {submission?.title || "Unknown Submission"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleJudgeSubmission}
            disabled={isCreatingReview}
            size="sm"
          >
            {isCreatingReview ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Scale className="mr-2 h-4 w-4" />
            )}
            {adminReviewId ? "Review this Submission" : "Judge this Submission"}
          </Button>
          <Badge className={getReviewStatusColor(review.status)}>
            {review.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Judge Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Judge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={judge?.avatar} />
                <AvatarFallback>
                  {judge?.name ? getInitials(judge.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{judge?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{judge?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Info */}
        <Card>
          <CardHeader>
            <CardTitle>Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{submission?.title || "Unknown"}</p>
            {submission?.tagline && (
              <p className="text-sm text-muted-foreground">{submission.tagline}</p>
            )}
            <p className="text-sm">
              Team: {submission?.team?.name || "Solo"}
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href={`/admin/submissions/${submission?.id}`}>
                View Submission
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Assigned</p>
              <p className="font-medium">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
            {review.completedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="font-medium">
                  {new Date(review.completedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scores */}
      {review.status === "completed" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Scores
            </CardTitle>
            <CardDescription>
              Individual category scores and overall rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {scoreCategories.map((category) => {
                const score = review[category.key as keyof Review] as number | undefined;
                return (
                  <div key={category.key} className="text-center">
                    <div className="text-3xl font-bold">
                      {score?.toFixed(1) || "-"}
                    </div>
                    <p className="text-sm font-medium">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-center gap-4">
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {review.overallScore?.toFixed(1) || "-"}
                </div>
                <p className="text-muted-foreground">Overall Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Public Feedback</CardTitle>
            <CardDescription>
              Feedback shared with the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {review.feedback ? (
              <p className="whitespace-pre-wrap">{review.feedback}</p>
            ) : (
              <p className="text-muted-foreground italic">No feedback provided</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
            <CardDescription>
              Notes visible only to judges and admins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {review.internalNotes ? (
              <p className="whitespace-pre-wrap">{review.internalNotes}</p>
            ) : (
              <p className="text-muted-foreground italic">No internal notes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submission Links */}
      {submission && (
        <Card>
          <CardHeader>
            <CardTitle>Project Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {submission.demoUrl && (
              <Button variant="outline" asChild>
                <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Live Demo
                </a>
              </Button>
            )}
            {submission.repoUrl && (
              <Button variant="outline" asChild>
                <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  Repository
                </a>
              </Button>
            )}
            {submission.videoUrl && (
              <Button variant="outline" asChild>
                <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Play className="mr-2 h-4 w-4" />
                  Demo Video
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
