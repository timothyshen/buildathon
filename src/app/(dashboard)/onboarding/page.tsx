"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { StepProfile } from "./components/step-profile";
import { StepSocial } from "./components/step-social";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Profile" },
  { id: 2, label: "Socials" },
];

interface OnboardingData {
  name: string;
  avatar: string;
  bio: string;
  twitter: string;
  github: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: user?.name || "",
    avatar: user?.avatar || "",
    bio: "",
    twitter: "",
    github: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.hasCompletedOnboarding) {
      router.replace("/dashboard");
    }
  }, [user?.hasCompletedOnboarding, router]);

  if (user?.hasCompletedOnboarding) {
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.name || data.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }
    }

    // Step 2 has no required fields

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const success = await completeOnboarding({
        name: data.name.trim(),
        avatar: data.avatar || undefined,
        bio: data.bio.trim() || undefined,
        twitter: data.twitter.trim() || undefined,
        github: data.github.trim() || undefined,
      });

      if (success) {
        // Credit any pending referrals (non-blocking)
        try {
          await fetch("/api/referrals/credit", { method: "POST" });
        } catch {
          // Referral crediting failure should not block onboarding
        }

        toast.success("Welcome aboard! Your profile is set up.");
        router.replace("/dashboard");
      } else {
        toast.error("Failed to complete setup. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Complete Your Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </p>
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-2">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`h-2 w-16 rounded-full transition-colors ${
              step.id <= currentStep
                ? "bg-gradient-to-r from-violet-600 to-indigo-600"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <StepProfile
            data={{ name: data.name, bio: data.bio, avatar: data.avatar }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <StepSocial
            data={{ twitter: data.twitter, github: data.github }}
            onChange={handleChange}
            errors={errors}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
