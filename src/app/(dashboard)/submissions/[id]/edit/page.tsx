"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  submissionsService,
  tracksService,
  cohortsService,
  sponsorsService,
} from "@/services";
import type { Submission, Track, Cohort, SponsorOrg } from "@/types";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StepDetails } from "@/app/(dashboard)/submit/components/step-details";
import { StepMedia } from "@/app/(dashboard)/submit/components/step-media";
import { StepLinksTech } from "@/app/(dashboard)/submit/components/step-links-tech";
import { StepTracks } from "@/app/(dashboard)/submit/components/step-tracks";
import { Loader2, Save, ArrowLeft } from "lucide-react";

interface EditSubmissionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSubmissionPage({ params }: EditSubmissionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [presentationUrl, setPresentationUrl] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [builtWithStory, setBuiltWithStory] = useState(false);
  const [cohortId, setCohortId] = useState("");
  const [trackIds, setTrackIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user || authLoading) return;

      const [subResult, cohortsResult, tracksResult, sponsorsResult] =
        await Promise.all([
          submissionsService.getById(id),
          cohortsService.list(),
          tracksService.list(),
          sponsorsService.listOrgs(),
        ]);

      if (!subResult.success || !subResult.data) {
        toast.error("Submission not found");
        router.push("/submissions");
        return;
      }

      // Auth check BEFORE exposing data to render
      const s = subResult.data;
      const isTeamMember = s.team?.members.some((m) => m.userId === user.id);
      const isSoloOwner = !s.teamId && s.createdBy === user.id;
      const isAdmin = user.role === "admin";
      if (!isTeamMember && !isSoloOwner && !isAdmin) {
        router.push("/submissions");
        return;
      }

      // Only set state that triggers render after auth check passes
      setSubmission(s);
      setTitle(s.title);
      setTagline(s.tagline || "");
      setLogoUrl(s.logoUrl || "");
      setDescription(s.description);
      setDemoUrl(s.demoUrl || "");
      setRepoUrl(s.repoUrl || "");
      setVideoUrl(s.videoUrl || "");
      setPresentationUrl(s.presentationUrl || "");
      setScreenshots(s.screenshots || []);
      setTechStack(s.techStack || []);
      setBuiltWithStory(s.builtWithStory);
      setCohortId(s.cohortId);
      setTrackIds(s.trackIds || []);

      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (tracksResult.success) setTracks(tracksResult.data);
      if (sponsorsResult.success) setSponsorOrgs(sponsorsResult.data);

      setIsLoadingData(false);
    }
    loadData();
  }, [id, user, authLoading, router]);

  const handleChange = useCallback(
    (field: string, value: string | string[] | boolean) => {
      setErrors((prev) => ({ ...prev, [field]: "" }));
      switch (field) {
        case "title":
          setTitle(value as string);
          break;
        case "tagline":
          setTagline(value as string);
          break;
        case "logoUrl":
          setLogoUrl(value as string);
          break;
        case "description":
          setDescription(value as string);
          break;
        case "demoUrl":
          setDemoUrl(value as string);
          break;
        case "repoUrl":
          setRepoUrl(value as string);
          break;
        case "videoUrl":
          setVideoUrl(value as string);
          break;
        case "presentationUrl":
          setPresentationUrl(value as string);
          break;
        case "screenshots":
          setScreenshots(value as string[]);
          break;
        case "techStack":
          setTechStack(value as string[]);
          break;
        case "builtWithStory":
          setBuiltWithStory(value as boolean);
          break;
        case "cohortId":
          setCohortId(value as string);
          break;
        case "trackIds":
          setTrackIds(value as string[]);
          break;
      }
    },
    []
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title || title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (
      !description ||
      description.replace(/<[^>]*>/g, "").trim().length < 50
    ) {
      newErrors.description = "Description must be at least 50 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsSaving(true);
    try {
      const result = await submissionsService.update(id, {
        title,
        tagline: tagline || undefined,
        logoUrl: logoUrl || undefined,
        description,
        demoUrl: demoUrl || undefined,
        repoUrl: repoUrl || undefined,
        videoUrl: videoUrl || undefined,
        presentationUrl: presentationUrl || undefined,
        screenshots,
        techStack,
        builtWithStory,
        cohortId,
        trackIds,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save submission");
        return;
      }

      toast.success("Submission updated");
      router.push(`/submissions/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Submission not found</h2>
          <Button asChild className="mt-4">
            <Link href="/submissions">Back to Submissions</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Only allow editing draft or submitted, and before submission deadline
  const canEditByStatus = submission.status === "draft" || submission.status === "submitted";
  const deadlinePassed = submission.cohort?.submissionDeadline
    ? new Date() > submission.cohort.submissionDeadline
    : false;

  if (!canEditByStatus || deadlinePassed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Cannot edit this submission</h2>
          <p className="text-muted-foreground mt-2">
            {deadlinePassed
              ? "The submission deadline has passed."
              : "Submissions can only be edited while in draft or submitted status."}
          </p>
          <Button asChild className="mt-4">
            <Link href={`/submissions/${id}`}>Back to Submission</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Breadcrumb
        items={[
          { label: "Submissions", href: "/submissions" },
          { label: submission.title, href: `/submissions/${id}` },
          { label: "Edit" },
        ]}
        showHome={false}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/submissions/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Submission</h1>
            <p className="text-muted-foreground mt-1">{submission.title}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <StepDetails
          data={{ title, tagline, logoUrl, description }}
          onChange={handleChange}
          errors={errors}
        />

        <StepMedia
          data={{ screenshots }}
          onChange={handleChange}
          errors={errors}
        />

        <StepLinksTech
          data={{
            demoUrl,
            repoUrl,
            videoUrl,
            presentationUrl,
            techStack,
            builtWithStory,
          }}
          onChange={handleChange}
          errors={errors}
        />

        <StepTracks
          data={{ cohortId, trackIds }}
          onChange={handleChange}
          errors={errors}
          cohorts={cohorts}
          tracks={tracks}
          sponsorOrgs={sponsorOrgs}
        />
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="outline" asChild>
          <Link href={`/submissions/${id}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
