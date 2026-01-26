"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress steps">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li
              key={step.id}
              className="flex items-center"
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted && "border-violet-600 bg-violet-600 text-white",
                    isCurrent && "border-violet-600 text-violet-600",
                    !isCompleted && !isCurrent && "border-slate-300 text-slate-400"
                  )}
                  aria-label={`Step ${step.id}: ${step.label}${isCompleted ? " - completed" : isCurrent ? " - current" : ""}`}
                >
                  {isCompleted ? <Check className="h-5 w-5" aria-hidden="true" /> : step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent ? "text-violet-600" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-12 sm:w-20",
                    isCompleted ? "bg-violet-600" : "bg-slate-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
