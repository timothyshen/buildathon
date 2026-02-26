"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, reviewsService, tracksService } from "@/services";
import type { Submission, Review, Track } from "@/types";
import { getSubmissionPrizes, type PrizeInfo } from "@/lib/prize-utils";
import { getSubmissionStatusLabel } from "@/lib/utils/status";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PrizeBadges } from "@/components/ui/prize-badges";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Shield,
  FileCheck,
  Edit,
  AlertCircle,
  Star,
  ExternalLink,
  Github,
  Video,
  Presentation,
  Loader2,
  BarChart3,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  submitted: "bg-blue-500",
  under_review: "bg-amber-500",
  accepted: "bg-violet-500",
  winner: "bg-emerald-500",
};

function getStatusBanner(status: string) {
  switch (status) {
    case "draft":
      return {
        message: "Your submission is in draft. Complete and submit when ready.",
        className: "border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200",
        icon: AlertCircle,
      };
    case "submitted":
      return {
        message: "Your submission has been received and is awaiting review.",
        className: "border-blue-200 bg-blue-50/50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200",
        icon: FileCheck,
      };
    case "under_review":
      return {
        message: "Judges are currently reviewing your submission.",
        className: "border-blue-200 bg-blue-50/50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-200",
        icon: AlertCircle,
      };
    case "accepted":
      return {
        message: "Congratulations! Your submission has been accepted.",
        className: "border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200",
        icon: FileCheck,
      };
    case "winner":
      return {
        message: "Congratulations! Your submission is a winner!",
        className: "border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200",
        icon: Star,
      };
    default:
      return {
        message: "Status unknown",
        className: "border-border bg-muted/50 text-muted-foreground",
        icon: AlertCircle,
      };
  }
}

function getInitials(name: string): string {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

const scoreCategories = [
  { key: "innovationScore", label: "Innovation" },
  { key: "executionScore", label: "Execution" },
  { key: "designScore", label: "Design" },
  { key: "impactScore", label: "Impact" },
  { key: "presentationScore", label: "Presentation" },
] as const;

export default function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [completedReviews, setCompletedReviews] = useState<Review[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [prizes, setPrizes] = useState<PrizeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user || authLoading) return;

      const { data: submissionData } = await submissionsService.getById(id);

      if (!submissionData) {
        setIsLoading(false);
        return;
      }

      const isTeamMember = submissionData.team?.members.some((m) => m.userId === user.id);
      const isSoloOwner = !submissionData.teamId && submissionData.createdBy === user.id;
      const isAdmin = user.role === "admin";
      if (!isTeamMember && !isSoloOwner && !isAdmin) {
        router.push("/submissions");
        return;
      }

      setSubmission(submissionData);

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
        const track = tracksResult.data.find((t: Track) => t.id === submissionData.trackId);
        const submissionPrizes = getSubmissionPrizes(submissionData, submissionData.cohort, track);
        setPrizes(submissionPrizes);
      }

      setIsLoading(false);
    }
    loadData();
  }, [id, user, authLoading, router]);

  const submissionTracks = submission?.tracks?.length
    ? submission.tracks
    : submission?.trackIds?.length
      ? tracks.filter((t) => submission.trackIds!.includes(t.id))
      : [];

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    notFound();
  }

  const statusBanner = getStatusBanner(submission.status);
  const StatusIcon = statusBanner.icon;

  const canEditByStatus = submission.status === "draft" || submission.status === "submitted";
  const deadlinePassed = submission.cohort?.submissionDeadline
    ? new Date() > submission.cohort.submissionDeadline
    : false;
  const canEdit = canEditByStatus && !deadlinePassed;
  const canDelete = submission.status === "draft";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await submissionsService.delete(submission.id);
      if (result.success) {
        toast.success("Submission deleted");
        router.push("/submissions");
      } else {
        toast.error(result.error || "Failed to delete submission");
      }
    } catch {
      toast.error("Failed to delete submission");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Submissions", href: "/submissions" },
          { label: submission.title },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot[submission.status] || statusDot.draft}`} />
            <h1 className="text-2xl font-semibold tracking-tight">{submission.title}</h1>
            <span className="text-sm text-muted-foreground">
              {getSubmissionStatusLabel(submission.status)}
            </span>
            {prizes.length > 0 && (
              <PrizeBadges prizes={prizes} maxVisible={5} size="md" />
            )}
          </div>
          {submission.tagline && (
            <p className="mt-1 text-sm text-muted-foreground">
              {submission.tagline}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/submissions/${submission.id}/traction`}>
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Traction
            </Link>
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete draft submission?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{submission.title}&rdquo;. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canEdit && (
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" asChild>
              <Link href={`/submissions/${submission.id}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${statusBanner.className}`}>
        <StatusIcon className="h-4 w-4 shrink-0" />
        <p>{statusBanner.message}</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Gallery */}
          <ProjectGallery
            screenshots={submission.screenshots}
            videoUrl={submission.videoUrl}
          />

          {/* About */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              About
            </h2>
            <RichTextDisplay content={submission.description} className="text-sm text-muted-foreground leading-relaxed" />
          </section>

          {/* Tech Stack */}
          {submission.techStack.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {submission.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {completedReviews.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
                Reviews
              </h2>
              <div className="space-y-3">
                {completedReviews.map((review) => (
                  <div key={review.id} className="rounded-xl border p-4 space-y-4">
                    {/* Judge Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {review.judge?.avatar && (
                          <AvatarImage src={review.judge.avatar} alt={review.judge.name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {review.judge ? getInitials(review.judge.name) : "JD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {review.judge?.name || "Anonymous Judge"}
                        </p>
                      </div>
                      {review.overallScore && (
                        <div className="text-right">
                          <span className="text-2xl font-mono font-bold tabular-nums">
                            {review.overallScore.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-5 gap-3">
                      {scoreCategories.map(({ key, label }) => {
                        const score = review[key];
                        return (
                          <div key={key} className="text-center">
                            <p className="text-lg font-mono font-semibold tabular-nums">
                              {score ?? "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback */}
                    {review.feedback && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {review.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          {submission.team ? (
            <ProjectTeam team={submission.team} />
          ) : (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Submitted by
              </h2>
              <span className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground">
                Solo submission
              </span>
            </section>
          )}

          {/* Tracks */}
          {submissionTracks.length > 0 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                {submissionTracks.length === 1 ? "Track" : "Tracks"}
              </h2>
              <div className="space-y-2">
                {submissionTracks.map((track) => (
                  <div key={track.id} className="rounded-xl border p-4">
                    <p className="text-sm font-medium">{track.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {track.description}
                    </p>
                    {track.prizePool && (
                      <p className="text-xs font-mono text-emerald-600 mt-2">
                        {track.prizePool} prize pool
                      </p>
                    )}
                    {submission?.trackDescriptions?.[track.id] && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Integration</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.trackDescriptions[track.id]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* IP Registration */}
          {submission.ipAssetId && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                IP Registration
              </h2>
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Registered on Story Protocol</span>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Asset ID</p>
                  <p className="text-xs font-mono break-all mt-0.5">{submission.ipAssetId}</p>
                </div>
                {submission.ipRegisteredAt && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Registered</p>
                    <p className="text-xs mt-0.5">{submission.ipRegisteredAt.toLocaleDateString()}</p>
                  </div>
                )}
                {submission.ipLicenseType && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">License</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] rounded border text-muted-foreground">
                      {submission.ipLicenseType}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Cohort */}
          {submission.cohort && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Cohort
              </h2>
              <Link
                href={`/cohorts/${submission.cohort.slug}`}
                className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium">{submission.cohort.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(submission.cohort.startDate).toLocaleDateString()} — {new Date(submission.cohort.endDate).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </section>
          )}

          {/* Links */}
          {(submission.demoUrl || submission.repoUrl || submission.videoUrl || submission.presentationUrl) && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Links
              </h2>
              <div className="space-y-1">
                {submission.demoUrl && (
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Live Demo
                  </a>
                )}
                {submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                    Repository
                  </a>
                )}
                {submission.videoUrl && (
                  <a
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Video
                  </a>
                )}
                {submission.presentationUrl && (
                  <a
                    href={submission.presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Presentation className="h-3.5 w-3.5" />
                    Presentation
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
