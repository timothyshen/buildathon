"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, reviewsService, tracksService } from "@/services";
import type { Submission, Review, Track } from "@/types";
import { getSubmissionPrizes, type PrizeInfo } from "@/lib/prize-utils";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PrizeBadges } from "@/components/ui/prize-badges";
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
  Calendar,
  Tag,
  Loader2,
  BarChart3,
} from "lucide-react";

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>;
}

function getStatusBanner(status: string) {
  switch (status) {
    case "draft":
      return {
        message: "Your submission is in draft. Complete and submit when ready.",
        variant: "warning" as const,
        icon: AlertCircle,
      };
    case "submitted":
      return {
        message: "Your submission has been received and is awaiting review.",
        variant: "info" as const,
        icon: FileCheck,
      };
    case "under_review":
      return {
        message: "Judges are currently reviewing your submission.",
        variant: "info" as const,
        icon: AlertCircle,
      };
    case "accepted":
      return {
        message: "Congratulations! Your submission has been accepted.",
        variant: "success" as const,
        icon: FileCheck,
      };
    case "winner":
      return {
        message: "Congratulations! Your submission is a winner!",
        variant: "success" as const,
        icon: Star,
      };
    default:
      return {
        message: "Status unknown",
        variant: "default" as const,
        icon: AlertCircle,
      };
  }
}

function getStatusBannerStyles(variant: "warning" | "info" | "success" | "default") {
  switch (variant) {
    case "warning":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    case "info":
      return "bg-blue-50 border-blue-200 text-blue-800";
    case "success":
      return "bg-green-50 border-green-200 text-green-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
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

export default function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [completedReviews, setCompletedReviews] = useState<Review[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [prizes, setPrizes] = useState<PrizeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: submissionData } = await submissionsService.getById(id);

      if (!submissionData) {
        setIsLoading(false);
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
        // Compute prizes
        const track = tracksResult.data.find((t: Track) => t.id === submissionData.trackId);
        const submissionPrizes = getSubmissionPrizes(submissionData, submissionData.cohort, track);
        setPrizes(submissionPrizes);
      }

      setIsLoading(false);
    }
    loadData();
  }, [id]);

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

  // Check if user is team member, solo owner, or admin
  const isTeamMember = submission.team?.members.some(
    (m) => m.userId === user?.id
  );
  const isSoloOwner = !submission.teamId && submission.createdBy === user?.id;
  const isAdmin = user?.role === "admin";
  const hasAccess = isTeamMember || isSoloOwner || isAdmin;

  // Redirect if not authorized
  if (!hasAccess) {
    router.push("/submissions");
    return null;
  }

  const statusBanner = getStatusBanner(submission.status);
  const StatusIcon = statusBanner.icon;

  const canEditByStatus = submission.status === "draft" || submission.status === "submitted";
  const deadlinePassed = submission.cohort?.submissionDeadline
    ? new Date() > submission.cohort.submissionDeadline
    : false;
  const canEdit = canEditByStatus && !deadlinePassed;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Submissions", href: "/submissions" },
          { label: submission.title },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{submission.title}</h1>
            {prizes.length > 0 && (
              <PrizeBadges prizes={prizes} maxVisible={5} size="md" />
            )}
          </div>
          {submission.tagline && (
            <p className="mt-2 text-lg text-muted-foreground">
              {submission.tagline}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/submissions/${submission.id}/traction`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Traction
            </Link>
          </Button>
          {canEdit && (
            <Button asChild>
              <Link href={`/submissions/${submission.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusBannerStyles(
          statusBanner.variant
        )}`}
      >
        <StatusIcon className="h-5 w-5 flex-shrink-0" />
        <p className="font-medium">{statusBanner.message}</p>
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

          {/* About Card */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {submission.description}
              </p>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          {submission.techStack.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {submission.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section */}
          {completedReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {completedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border rounded-lg p-4 space-y-4"
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
                          <p className="text-2xl font-bold">
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
                            <p className="text-lg font-semibold">
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (1 column) */}
        <div className="space-y-6">
          {/* Team Card or Solo Badge */}
          {submission.team ? (
            <ProjectTeam team={submission.team} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submitted by</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Solo submission</Badge>
              </CardContent>
            </Card>
          )}

          {/* Track Card */}
          {submissionTrack && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Track
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{submissionTrack.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {submissionTrack.description}
                </p>
                {submissionTrack.prizePool && (
                  <p className="text-sm font-medium text-green-600 mt-2">
                    Prize Pool: {submissionTrack.prizePool}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* IP Registration Card */}
          {submission.ipAssetId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  IP Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                    <Badge variant="outline" className="mt-1">
                      {submission.ipLicenseType}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cohort Card */}
          {submission.cohort && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cohort
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Links Card */}
          {(submission.demoUrl ||
            submission.repoUrl ||
            submission.videoUrl ||
            submission.presentationUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.demoUrl && (
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Live Demo
                  </a>
                )}
                {submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    Repository
                  </a>
                )}
                {submission.videoUrl && (
                  <a
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    Video
                  </a>
                )}
                {submission.presentationUrl && (
                  <a
                    href={submission.presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Presentation className="h-4 w-4" />
                    Presentation
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
