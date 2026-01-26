"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { StepIndicator } from "./components/step-indicator";
import { StepDetails } from "./components/step-details";
import { StepLinksTech } from "./components/step-links-tech";
import { StepTracks } from "./components/step-tracks";
import { StepReview } from "./components/step-review";
import { mockTracks } from "@/data/mock-data";

const STORAGE_KEY = "submission-draft";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Links & Tech" },
  { id: 3, label: "Tracks" },
  { id: 4, label: "Review" },
];

interface SubmissionDraft {
  title: string;
  tagline: string;
  description: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  presentationUrl: string;
  techStack: string[];
  builtWithStory: boolean;
  cohortId: string;
  trackIds: string[];
  licenseType: string;
  currentStep: number;
}

const initialData: SubmissionDraft = {
  title: "",
  tagline: "",
  description: "",
  demoUrl: "",
  repoUrl: "",
  videoUrl: "",
  presentationUrl: "",
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

  const [data, setData] = useState<SubmissionDraft>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.title || parsed.description || parsed.cohortId) {
          setShowDraftBanner(true);
        }
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

  const loadDraft = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      setCurrentStep(parsed.currentStep || 1);
    }
    setShowDraftBanner(false);
  };

  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(preselectedCohort ? { ...initialData, cohortId: preselectedCohort } : initialData);
    setCurrentStep(1);
    setShowDraftBanner(false);
  };

  const handleChange = useCallback((field: string, value: string | string[] | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.title || data.title.length < 3) {
        newErrors.title = "Title must be at least 3 characters";
      }
      if (!data.description || data.description.replace(/<[^>]*>/g, "").trim().length < 50) {
        newErrors.description = "Description must be at least 50 characters";
      }
    }

    if (step === 2) {
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

    if (step === 3) {
      if (!data.cohortId) {
        newErrors.cohortId = "Please select a cohort";
      }
      const cohortTracks = mockTracks.filter((t) => t.cohortId === data.cohortId);
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
    if (!validateStep(3)) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Project submitted successfully!");
      router.push("/submissions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Draft Recovery Banner */}
      {showDraftBanner && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
          <p className="font-medium">Resume your draft?</p>
          <p className="text-sm text-muted-foreground mt-1">
            You have an unsaved submission draft.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={loadDraft}>
              Continue Draft
            </Button>
            <Button size="sm" variant="outline" onClick={startFresh}>
              Start Fresh
            </Button>
          </div>
        </div>
      )}

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
          <StepDetails
            data={{ title: data.title, tagline: data.tagline, description: data.description }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
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
        {currentStep === 3 && (
          <StepTracks
            data={{ cohortId: data.cohortId, trackIds: data.trackIds }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <StepReview data={data} onEdit={handleEdit} />
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
