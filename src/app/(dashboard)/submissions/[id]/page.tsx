"use client";

import { use, useState, useEffect, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, reviewsService, tracksService, ipAssetsService } from "@/services";
import type { Submission, Review, Track, IpAsset, IpLicenseTerms, PilTermsFormValues, PilPreset } from "@/types";
import { getSubmissionPrizes, type PrizeInfo } from "@/lib/prize-utils";
import { getSubmissionStatusLabel } from "@/lib/utils/status";
import { useIpRegistration } from "@/hooks/use-ip-registration";
import { STORY_EXPLORER_URL } from "@/services/story-protocol/constants";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { StepIP } from "@/app/(dashboard)/submit/components/step-ip";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PrizeBadges } from "@/components/ui/prize-badges";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  GitFork,
} from "lucide-react";
import { toast } from "sonner";

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

  // IP registration state
  const [ipAsset, setIpAsset] = useState<IpAsset | null>(null);
  const [ipLicenseTerms, setIpLicenseTerms] = useState<IpLicenseTerms[]>([]);
  const [showIpModal, setShowIpModal] = useState(false);
  const [pilTerms, setPilTerms] = useState<PilTermsFormValues | null>(null);
  const [pilPreset, setPilPreset] = useState<PilPreset | null>(null);
  const { register: registerIp, status: ipStatus, error: ipError, reset: resetIp } = useIpRegistration();
  const { primaryWallet } = useDynamicContext();

  const handleStepIpChange = useCallback((field: string, value: unknown) => {
    if (field === "pilTerms") setPilTerms(value as PilTermsFormValues | null);
    if (field === "pilPreset") setPilPreset(value as PilPreset | null);
  }, []);

  const handleRegisterIp = useCallback(async () => {
    if (!submission || !pilTerms || !primaryWallet) return;

    if (!isEthereumWallet(primaryWallet)) {
      toast.error("Please connect an Ethereum wallet first");
      return;
    }

    try {
      // Type assertion needed to bridge viem version mismatch between
      // @dynamic-labs/ethereum (viem 2.44.4) and project viem (2.45.0)
      const walletClient = await primaryWallet.getWalletClient() as unknown as import("viem").WalletClient;
      await registerIp(walletClient, submission, pilTerms);

      // Refresh IP asset data
      const res = await ipAssetsService.getBySubmissionId(submission.id);
      if (res.success && res.data) {
        setIpAsset(res.data);
        const termsRes = await ipAssetsService.getLicenseTerms(res.data.id);
        if (termsRes.success) setIpLicenseTerms(termsRes.data);
      }

      toast.success("IP asset registered successfully");
      setShowIpModal(false);
    } catch {
      // Error is already set in the hook
    }
  }, [submission, pilTerms, primaryWallet, registerIp]);

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

  // Fetch IP asset data when submission has an ipAssetId
  useEffect(() => {
    if (!submission?.ipAssetId) return;

    ipAssetsService.getBySubmissionId(submission.id).then(async (res) => {
      if (res.success && res.data) {
        setIpAsset(res.data);
        const termsRes = await ipAssetsService.getLicenseTerms(res.data.id);
        if (termsRes.success) setIpLicenseTerms(termsRes.data);
      }
    });
  }, [submission?.id, submission?.ipAssetId]);

  const submissionTrack = tracks.find((t) => t.id === submission?.trackId);

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

  const isTeamMember = submission.team?.members.some((m) => m.userId === user?.id);
  const isSoloOwner = !submission.teamId && submission.createdBy === user?.id;
  const isOwner = isTeamMember || isSoloOwner;

  // Build a license summary from fetched terms
  const licenseSummary = ipLicenseTerms.length > 0
    ? ipLicenseTerms[0].commercialUse
      ? ipLicenseTerms[0].derivativesAllowed
        ? "Commercial Remix"
        : "Commercial Use"
      : ipLicenseTerms[0].derivativesAllowed
        ? "Non-Commercial Remix"
        : "Non-Commercial"
    : submission.ipLicenseType || "Custom";

  const ipStatusMessages: Record<string, string> = {
    idle: "",
    uploading: "Uploading metadata to IPFS...",
    signing: "Please sign the transaction in your wallet...",
    confirming: "Confirming transaction on-chain...",
    recording: "Recording registration...",
    done: "Registration complete!",
    error: ipError || "Registration failed",
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
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {submission.description}
            </p>
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

          {/* Track */}
          {submissionTrack && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Track
              </h2>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">{submissionTrack.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {submissionTrack.description}
                </p>
                {submissionTrack.prizePool && (
                  <p className="text-xs font-mono text-emerald-600 mt-2">
                    {submissionTrack.prizePool} prize pool
                  </p>
                )}
              </div>
            </section>
          )}

          {/* IP Registration */}
          {ipAsset ? (
            <section className="rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium">Intellectual Property</h3>
                <p className="text-xs text-muted-foreground mt-1">Registered on Story Protocol</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">IP Asset ID</span>
                  <a
                    href={`${STORY_EXPLORER_URL}/ip/${ipAsset.ipId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-500 hover:underline"
                  >
                    {ipAsset.ipId.slice(0, 10)}...{ipAsset.ipId.slice(-8)}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">License</span>
                  <span className="text-xs">{licenseSummary}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Registered</span>
                  <span className="text-xs">{ipAsset.registeredAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Transaction</span>
                  <a
                    href={`${STORY_EXPLORER_URL}/tx/${ipAsset.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-500 hover:underline"
                  >
                    {ipAsset.txHash.slice(0, 10)}...
                  </a>
                </div>
              </div>
              {!isOwner && (
                <Link href={`/submissions/${submission.id}/fork`}>
                  <Button variant="outline" size="sm">
                    <GitFork className="h-4 w-4 mr-2" />
                    Fork this Project
                  </Button>
                </Link>
              )}
            </section>
          ) : isOwner ? (
            <section className="rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium">Intellectual Property</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Register this project as an IP Asset on Story Protocol
                </p>
              </div>
              <Button onClick={() => { resetIp(); setShowIpModal(true); }}>
                Register IP Asset
              </Button>
            </section>
          ) : null}

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

      {/* IP Registration Modal */}
      <Dialog open={showIpModal} onOpenChange={(open) => {
        if (!open && ipStatus !== "uploading" && ipStatus !== "signing" && ipStatus !== "confirming" && ipStatus !== "recording") {
          setShowIpModal(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register IP Asset</DialogTitle>
            <DialogDescription>
              Choose license terms for your intellectual property on Story Protocol
            </DialogDescription>
          </DialogHeader>

          <StepIP
            data={{ pilTerms, pilPreset }}
            onChange={handleStepIpChange}
          />

          {/* Status feedback */}
          {ipStatus !== "idle" && ipStatus !== "done" && (
            <div className="flex items-center gap-3 rounded-xl border p-4">
              {ipStatus === "error" ? (
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
              <p className={`text-sm ${ipStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {ipStatusMessages[ipStatus]}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIpModal(false)}
              disabled={ipStatus === "uploading" || ipStatus === "signing" || ipStatus === "confirming" || ipStatus === "recording"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegisterIp}
              disabled={!pilTerms || !primaryWallet || ipStatus === "uploading" || ipStatus === "signing" || ipStatus === "confirming" || ipStatus === "recording"}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {ipStatus === "uploading" || ipStatus === "signing" || ipStatus === "confirming" || ipStatus === "recording" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Register
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
