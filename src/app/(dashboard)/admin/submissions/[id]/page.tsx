"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, reviewsService, tracksService } from "@/services";
import type { Submission, Review, Track } from "@/types";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Star,
  ExternalLink,
  Github,
  Video,
  Presentation,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AdminSubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}


function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const scoreCategories = [
  { key: "innovationScore", label: "Innovation" },
  { key: "executionScore", label: "Execution" },
  { key: "designScore", label: "Design" },
  { key: "impactScore", label: "Impact" },
  { key: "presentationScore", label: "Presentation" },
] as const;

function getStatusDotColor(status: string): string {
  switch (status) {
    case "submitted":
      return "bg-emerald-500";
    case "draft":
      return "bg-amber-500";
    case "under_review":
      return "bg-blue-500";
    case "accepted":
      return "bg-blue-500";
    case "winner":
      return "bg-violet-500";
    default:
      return "bg-muted-foreground";
  }
}

export default function AdminSubmissionDetailPage({ params }: AdminSubmissionDetailPageProps) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [completedReviews, setCompletedReviews] = useState<Review[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (user?.role !== "admin") {
        setIsLoading(false);
        return;
      }

      const { data: submissionData } = await submissionsService.getById(id);

      if (!submissionData) {
        setIsLoading(false);
        return;
      }

      setSubmission(submissionData);

      // Load reviews and tracks in parallel
      const [reviewsResult, tracksResult] = await Promise.all([
        reviewsService.getBySubmission(id),
        submissionData.cohortId
          ? tracksService.getByCohort(submissionData.cohortId)
          : Promise.resolve({ data: [], success: true }),
      ]);

      if (reviewsResult.success) {
        setCompletedReviews(reviewsResult.data.filter((r) => r.status === "completed"));
      }
      if (tracksResult.success) {
        setTracks(tracksResult.data);
      }

      setIsLoading(false);
    }
    loadData();
  }, [id, user, authLoading]);

  const submissionTrack = tracks.find((t) => t.id === submission?.trackId);

  // Handle loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle not found
  if (!submission) {
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

  const currentStatus = status ?? submission.status;

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { success, error } = await submissionsService.updateStatus(
        submission.id,
        newStatus as Submission["status"]
      );
      if (success) {
        setStatus(newStatus);
        toast.success(`Status updated to ${newStatus}`);

        // Fire-and-forget notification trigger
        fetch("/api/notifications/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "submission_status_changed",
            data: {
              submissionId: submission.id,
              title: submission.title,
              newStatus,
              userId: submission.createdBy,
            },
          }),
        }).catch(() => {});
      } else {
        toast.error(error || "Failed to update status");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Submissions", href: "/admin/submissions" },
          { label: submission.title },
        ]}
      />
      <AdminNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{submission.title}</h1>
          {submission.tagline && (
            <p className="text-sm text-muted-foreground mt-1">
              {submission.tagline}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${getStatusDotColor(currentStatus)}`} />
            <span className="text-xs capitalize">{currentStatus.replace("_", " ")}</span>
          </span>
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[150px]">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="winner">Winner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 columns) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Project Gallery */}
          <ProjectGallery
            screenshots={submission.screenshots}
            videoUrl={submission.videoUrl}
          />

          {/* About Section */}
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              About
            </h3>
            <div className="rounded-xl border p-5">
              <RichTextDisplay
                content={submission.description}
                className="text-muted-foreground"
              />
            </div>
          </div>

          {/* Tech Stack */}
          {submission.techStack.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Tech Stack
              </h3>
              <div className="rounded-xl border p-5">
                <div className="flex flex-wrap gap-2">
                  {submission.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md bg-muted px-2 py-1 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {completedReviews.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Reviews ({completedReviews.length})
              </h3>
              <div className="space-y-4">
                {completedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border p-4 space-y-4"
                  >
                    {/* Judge Info */}
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {review.judge?.avatar && (
                          <AvatarImage
                            src={review.judge.avatar}
                            alt={review.judge.name}
                          />
                        )}
                        <AvatarFallback>
                          {review.judge ? getInitials(review.judge.name) : "JD"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {review.judge?.name || "Anonymous Judge"}
                        </p>
                        <p className="text-sm text-muted-foreground">Judge</p>
                      </div>
                      {review.overallScore && (
                        <div className="ml-auto text-right">
                          <p className="font-mono text-2xl font-semibold tabular-nums">
                            {review.overallScore.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Overall Score
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {scoreCategories.map(({ key, label }) => {
                        const score = review[key];
                        return (
                          <div key={key} className="text-center">
                            <p className="font-mono text-lg font-semibold tabular-nums">
                              {score ?? "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {label}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback */}
                    {review.feedback && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Feedback</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {review.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (1 column) */}
        <div className="space-y-10">
          {/* Team or Solo Badge */}
          {submission.team ? (
            <ProjectTeam team={submission.team} />
          ) : (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Submitted by
              </h3>
              <div className="rounded-xl border p-5">
                <p className="text-sm">Solo submission</p>
              </div>
            </div>
          )}

          {/* Track */}
          {submissionTrack && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Track
              </h3>
              <div className="rounded-xl border p-5">
                <p className="font-medium">{submissionTrack.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {submissionTrack.description}
                </p>
                {submissionTrack.prizePool && (
                  <p className="font-mono text-sm tabular-nums text-emerald-600 mt-2">
                    Prize Pool: {submissionTrack.prizePool}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* IP Registration */}
          {submission.ipAssetId && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                IP Registration
              </h3>
              <div className="rounded-xl border p-5 space-y-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">
                    Registered on Story Protocol
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Asset ID</p>
                  <p className="text-sm font-mono break-all">
                    {submission.ipAssetId}
                  </p>
                </div>
                {submission.ipRegisteredAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Registered At
                    </p>
                    <p className="text-sm">
                      {submission.ipRegisteredAt.toLocaleDateString()}
                    </p>
                  </div>
                )}
                {submission.ipLicenseType && (
                  <div>
                    <p className="text-xs text-muted-foreground">License</p>
                    <p className="text-xs mt-1">
                      {submission.ipLicenseType}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cohort */}
          {submission.cohort && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cohort
              </h3>
              <div className="rounded-xl border p-5">
                <Link
                  href={`/cohorts/${submission.cohort.slug}`}
                  className="font-medium hover:underline"
                >
                  {submission.cohort.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.cohort.startDate.toLocaleDateString()} -{" "}
                  {submission.cohort.endDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Links */}
          {(submission.demoUrl ||
            submission.repoUrl ||
            submission.videoUrl ||
            submission.presentationUrl) && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Links
              </h3>
              <div className="rounded-xl border p-5 space-y-1">
                {submission.demoUrl && (
                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                    <a
                      href={submission.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live Demo
                    </a>
                  </Button>
                )}
                {submission.repoUrl && (
                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                    <a
                      href={submission.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      Repository
                    </a>
                  </Button>
                )}
                {submission.videoUrl && (
                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                    <a
                      href={submission.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="h-4 w-4" />
                      Video
                    </a>
                  </Button>
                )}
                {submission.presentationUrl && (
                  <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                    <a
                      href={submission.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Presentation className="h-4 w-4" />
                      Presentation
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/submissions/${submission.id}`}>
              View as Participant
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
