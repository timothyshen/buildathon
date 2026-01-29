"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Loader2, ArrowLeft, ArrowRight, Save } from "lucide-react";
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
  teamId: string;
  title: string;
  tagline: string;
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
  teamId: "",
  title: "",
  tagline: "",
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

  // Load draft or preselected cohort on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
        setCurrentStep(parsed.currentStep || 1);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else if (preselectedCohort) {
      setData((prev) => ({ ...prev, cohortId: preselectedCohort }));
    }
  }, [preselectedCohort]);

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
      if (!data.teamId) {
        newErrors.teamId = "Please select a team";
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
      if (!data.cohortId) {
        newErrors.cohortId = "Please select a cohort";
      }
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

  const handleSaveAndExit = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, currentStep }));
    toast.success("Draft saved");
    router.push("/submissions");
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await submissionsService.create({
        cohortId: data.cohortId,
        teamId: data.teamId,
        title: data.title,
        tagline: data.tagline || undefined,
        description: data.description,
        demoUrl: data.demoUrl || undefined,
        repoUrl: data.repoUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        presentationUrl: data.presentationUrl || undefined,
        screenshots: data.screenshots,
        techStack: data.techStack,
        builtWithStory: data.builtWithStory,
        trackIds: data.trackIds,
        status: "submitted",
      });

      if (!result.success) {
        toast.error(result.error || "Failed to submit project");
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      toast.success("Project submitted successfully!");
      router.push("/submissions");
    } finally {
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
        <h1 className="text-3xl font-bold">Submit Project</h1>
        <p className="mt-2 text-muted-foreground">
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
                <CardTitle>Select Team</CardTitle>
                <CardDescription>Choose which team is submitting this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="team">Team *</Label>
                  <Select
                    value={data.teamId}
                    onValueChange={(value) => handleChange("teamId", value)}
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
                  {userTeams.filter((t) => {
                    const cohort = cohorts.find((c) => c.id === t.cohortId);
                    return cohort?.status === "active";
                  }).length === 0 && (
                    <p className="text-sm text-amber-600">
                      You need to <Link href="/teams/new" className="underline">create a team</Link> first.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <StepDetails
              data={{ title: data.title, tagline: data.tagline, description: data.description }}
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
            data={{ cohortId: data.cohortId, trackIds: data.trackIds }}
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
