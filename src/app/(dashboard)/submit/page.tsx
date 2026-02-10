"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, ArrowRight, Save, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepIndicator } from "./components/step-indicator";
import { StepDetails } from "./components/step-details";
import { StepMedia } from "./components/step-media";
import { StepLinksTech } from "./components/step-links-tech";
import { StepTracks } from "./components/step-tracks";
import { StepReview } from "./components/step-review";
import { teamsService, cohortsService, tracksService, sponsorsService, submissionsService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { Team, Cohort, Track, SponsorOrg } from "@/types";

const STORAGE_KEY = "submission-draft";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Media" },
  { id: 3, label: "Links & Tech" },
  { id: 4, label: "Tracks" },
  { id: 5, label: "Review" },
];

interface SubmissionDraft {
  draftId: string;
  submissionMode: "team" | "solo";
  teamId: string;
  title: string;
  tagline: string;
  logoUrl: string;
  description: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  presentationUrl: string;
  screenshots: string[];
  techStack: string[];
  builtWithStory: boolean;
  cohortId: string;
  trackIds: string[];
  licenseType: string;
  currentStep: number;
}

const initialData: SubmissionDraft = {
  draftId: "",
  submissionMode: "team",
  teamId: "",
  title: "",
  tagline: "",
  logoUrl: "",
  description: "",
  demoUrl: "",
  repoUrl: "",
  videoUrl: "",
  presentationUrl: "",
  screenshots: [],
  techStack: [],
  builtWithStory: false,
  cohortId: "",
  trackIds: [],
  licenseType: "",
  currentStep: 1,
};

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCohort = searchParams.get("cohort");
  const { user } = useAuth();

  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [data, setData] = useState<SubmissionDraft>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Load teams, cohorts, tracks, and sponsors
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      const [teamsResult, cohortsResult, tracksResult, sponsorsResult] = await Promise.all([
        teamsService.getByUser(user.id),
        cohortsService.list(),
        tracksService.list(),
        sponsorsService.listOrgs(),
      ]);

      if (teamsResult.success) setUserTeams(teamsResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (tracksResult.success) setTracks(tracksResult.data);
      if (sponsorsResult.success) setSponsorOrgs(sponsorsResult.data);

      setIsLoadingData(false);
    }
    loadData();
  }, [user]);

  // Load draft or preselected cohort (runs once teams are loaded)
  useEffect(() => {
    if (isLoadingData) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Default submissionMode for old drafts
        if (!parsed.submissionMode) {
          parsed.submissionMode = parsed.teamId ? "team" : "solo";
        }
        // Migrate stale drafts: ensure cohortId matches team's cohort
        if (parsed.submissionMode === "team" && parsed.teamId && userTeams.length > 0) {
          const team = userTeams.find((t: Team) => t.id === parsed.teamId);
          if (!team) {
            parsed.teamId = "";
            parsed.cohortId = "";
            parsed.trackIds = [];
          } else if (team.cohortId !== parsed.cohortId) {
            parsed.cohortId = team.cohortId;
            parsed.trackIds = [];
          }
        }
        setData(parsed);
        setCurrentStep(parsed.currentStep || 1);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else if (preselectedCohort) {
      const teamForCohort = userTeams.find((t) => t.cohortId === preselectedCohort);
      if (teamForCohort) {
        setData((prev) => ({
          ...prev,
          submissionMode: "team",
          cohortId: preselectedCohort,
          teamId: teamForCohort.id,
        }));
      } else {
        setData((prev) => ({
          ...prev,
          submissionMode: "solo",
          cohortId: preselectedCohort,
          teamId: "",
        }));
      }
    }
  }, [preselectedCohort, userTeams, isLoadingData]);

  // Auto-save on data change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, currentStep }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [data, currentStep]);

  const handleChange = useCallback((field: string, value: string | string[] | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (data.submissionMode === "team") {
        if (!data.teamId || !data.cohortId) {
          newErrors.teamId = "Please select a team";
        }
      } else {
        if (!data.cohortId) {
          newErrors.cohortId = "Please select a cohort";
        }
      }
      if (!data.title || data.title.length < 3) {
        newErrors.title = "Title must be at least 3 characters";
      }
      if (!data.description || data.description.replace(/<[^>]*>/g, "").trim().length < 50) {
        newErrors.description = "Description must be at least 50 characters";
      }
    }

    if (step === 2) {
      if (data.screenshots.length < 3) {
        newErrors.screenshots = "Please upload at least 3 screenshots";
      }
    }

    if (step === 3) {
      const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
      if (data.demoUrl && !urlPattern.test(data.demoUrl)) {
        newErrors.demoUrl = "Please enter a valid URL";
      }
      if (data.repoUrl && !urlPattern.test(data.repoUrl)) {
        newErrors.repoUrl = "Please enter a valid URL";
      }
      if (data.videoUrl && !urlPattern.test(data.videoUrl)) {
        newErrors.videoUrl = "Please enter a valid URL";
      }
      if (data.presentationUrl && !urlPattern.test(data.presentationUrl)) {
        newErrors.presentationUrl = "Please enter a valid URL";
      }
    }

    if (step === 4) {
      const cohortTracks = tracks.filter((t) => t.cohortId === data.cohortId);
      if (cohortTracks.length > 0 && data.trackIds.length === 0) {
        newErrors.trackIds = "Please select at least one track";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error("Please fix the errors before continuing");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleSaveAndExit = async () => {
    // Require at least cohort + title to save a draft to the database
    const hasRequiredForSave = data.cohortId && data.title &&
      (data.submissionMode === "solo" || data.teamId);

    if (!hasRequiredForSave) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, currentStep }));
      toast.success("Draft saved locally");
      router.push("/submissions");
      return;
    }

    setIsLoading(true);
    try {
      const submissionData = {
        cohortId: data.cohortId,
        teamId: data.submissionMode === "team" ? data.teamId : undefined,
        createdBy: user!.id,
        title: data.title,
        tagline: data.tagline || undefined,
        logoUrl: data.logoUrl || undefined,
        description: data.description || "",
        demoUrl: data.demoUrl || undefined,
        repoUrl: data.repoUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        presentationUrl: data.presentationUrl || undefined,
        screenshots: data.screenshots || [],
        techStack: data.techStack || [],
        builtWithStory: data.builtWithStory,
        trackIds: data.trackIds,
        status: "draft" as const,
      };

      let result;
      if (data.draftId) {
        result = await submissionsService.update(data.draftId, submissionData);
      } else {
        result = await submissionsService.create(submissionData);
      }

      if (!result.success) {
        toast.error(result.error || "Failed to save draft");
        return;
      }

      const savedId = data.draftId || result.data?.id;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, draftId: savedId, currentStep })
      );
      toast.success("Draft saved");
      router.push("/submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Validate ALL steps before final submission
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        toast.error(`Please fix the errors in step ${step} before submitting`);
        setCurrentStep(step);
        isSubmittingRef.current = false;
        return;
      }
    }

    setIsLoading(true);
    try {
      const submissionData = {
        cohortId: data.cohortId,
        teamId: data.submissionMode === "team" ? data.teamId : undefined,
        createdBy: user!.id,
        title: data.title,
        tagline: data.tagline || undefined,
        logoUrl: data.logoUrl || undefined,
        description: data.description,
        demoUrl: data.demoUrl || undefined,
        repoUrl: data.repoUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        presentationUrl: data.presentationUrl || undefined,
        screenshots: data.screenshots,
        techStack: data.techStack,
        builtWithStory: data.builtWithStory,
        trackIds: data.trackIds,
        status: "submitted" as const,
      };

      let result;
      if (data.draftId) {
        result = await submissionsService.update(data.draftId, submissionData);
      } else {
        result = await submissionsService.create(submissionData);
      }

      if (!result.success) {
        toast.error(result.error || "Failed to submit project");
        return;
      }

      // Fire-and-forget notification trigger
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "submission_submitted",
          data: { submissionId: result.data.id, title: result.data.title, cohortId: result.data.cohortId },
        }),
      }).catch(() => {});

      localStorage.removeItem(STORAGE_KEY);
      toast.success("Project submitted successfully!");
      router.push("/submissions");
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Submit Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your buildathon project with the community
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Type</CardTitle>
                <CardDescription>Are you submitting as a team or solo?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Toggle */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    role="radio"
                    aria-checked={data.submissionMode === "team"}
                    tabIndex={0}
                    onClick={() => {
                      handleChange("submissionMode", "team");
                      if (!data.teamId) {
                        handleChange("cohortId", "");
                        handleChange("trackIds", []);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleChange("submissionMode", "team");
                        if (!data.teamId) {
                          handleChange("cohortId", "");
                          handleChange("trackIds", []);
                        }
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-4 text-center transition-all",
                      data.submissionMode === "team"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">Team</p>
                    <p className="text-sm text-muted-foreground">Submit with your team</p>
                  </div>
                  <div
                    role="radio"
                    aria-checked={data.submissionMode === "solo"}
                    tabIndex={0}
                    onClick={() => {
                      handleChange("submissionMode", "solo");
                      handleChange("teamId", "");
                      handleChange("trackIds", []);
                      handleChange("cohortId", "");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleChange("submissionMode", "solo");
                        handleChange("teamId", "");
                        handleChange("trackIds", []);
                        handleChange("cohortId", "");
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-4 text-center transition-all",
                      data.submissionMode === "solo"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <User className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">Solo</p>
                    <p className="text-sm text-muted-foreground">Submit individually</p>
                  </div>
                </div>

                {/* Team selector (team mode) */}
                {data.submissionMode === "team" && (
                  <div className="space-y-2">
                    <Label htmlFor="team">Team *</Label>
                    <Select
                      value={data.teamId}
                      onValueChange={(value) => {
                        const selectedTeam = userTeams.find((t) => t.id === value);
                        handleChange("teamId", value);
                        if (selectedTeam) {
                          handleChange("cohortId", selectedTeam.cohortId);
                          handleChange("trackIds", []);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your team" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTeams
                          .filter((t) => {
                            const cohort = cohorts.find((c) => c.id === t.cohortId);
                            return cohort?.status === "active";
                          })
                          .map((team) => {
                            const cohort = cohorts.find((c) => c.id === team.cohortId);
                            return (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name} ({cohort?.name})
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    {errors.teamId && (
                      <p className="text-sm text-destructive">{errors.teamId}</p>
                    )}
                    {data.teamId && data.cohortId && (
                      <p className="text-sm text-muted-foreground">
                        Cohort: {cohorts.find((c) => c.id === data.cohortId)?.name}
                      </p>
                    )}
                    {userTeams.filter((t) => {
                      const cohort = cohorts.find((c) => c.id === t.cohortId);
                      return cohort?.status === "active";
                    }).length === 0 && (
                      <p className="text-sm text-amber-600">
                        You need to <Link href="/teams/new" className="underline">create a team</Link> first.
                      </p>
                    )}
                  </div>
                )}

                {/* Cohort selector (solo mode) */}
                {data.submissionMode === "solo" && (
                  <div className="space-y-2">
                    <Label htmlFor="cohort">Cohort *</Label>
                    <Select
                      value={data.cohortId}
                      onValueChange={(value) => {
                        handleChange("cohortId", value);
                        handleChange("trackIds", []);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cohort" />
                      </SelectTrigger>
                      <SelectContent>
                        {cohorts
                          .filter((c) => c.status === "active")
                          .map((cohort) => (
                            <SelectItem key={cohort.id} value={cohort.id}>
                              {cohort.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.cohortId && (
                      <p className="text-sm text-destructive">{errors.cohortId}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <StepDetails
              data={{ title: data.title, tagline: data.tagline, logoUrl: data.logoUrl, description: data.description }}
              onChange={handleChange}
              errors={errors}
            />
          </div>
        )}
        {currentStep === 2 && (
          <StepMedia
            data={{ screenshots: data.screenshots }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <StepLinksTech
            data={{
              demoUrl: data.demoUrl,
              repoUrl: data.repoUrl,
              videoUrl: data.videoUrl,
              presentationUrl: data.presentationUrl,
              techStack: data.techStack,
              builtWithStory: data.builtWithStory,
            }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <StepTracks
            data={{ cohortId: data.cohortId, trackIds: data.trackIds, submissionMode: data.submissionMode }}
            onChange={handleChange}
            errors={errors}
            cohorts={cohorts}
            tracks={tracks}
            sponsorOrgs={sponsorOrgs}
          />
        )}
        {currentStep === 5 && (
          <StepReview
            data={data}
            onEdit={handleEdit}
            cohorts={cohorts}
            tracks={tracks}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={handleSaveAndExit}>
            <Save className="h-4 w-4 mr-2" />
            Save & Exit
          </Button>
        </div>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Project"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
