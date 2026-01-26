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
    <nav aria-label="Progress steps" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", !isLast && "flex-1")}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Step circle and label */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    isCompleted &&
                      "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30",
                    isCurrent &&
                      "border-2 border-violet-500 bg-violet-50 text-violet-600 ring-4 ring-violet-100 dark:bg-violet-950 dark:ring-violet-900/30",
                    !isCompleted &&
                      !isCurrent &&
                      "border-2 border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                  )}
                  aria-label={`Step ${step.id}: ${step.label}${isCompleted ? " - completed" : isCurrent ? " - current" : ""}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium transition-colors hidden sm:block",
                    isCompleted && "text-violet-600 dark:text-violet-400",
                    isCurrent && "text-violet-600 dark:text-violet-400",
                    !isCompleted && !isCurrent && "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 px-2 sm:px-4" aria-hidden="true">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full transition-colors duration-300",
                      isCompleted
                        ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
