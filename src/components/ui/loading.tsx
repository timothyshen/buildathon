"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional label text */
  label?: string;
  /** Full screen centered */
  fullScreen?: boolean;
  /** Minimum height container */
  minHeight?: string;
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Loading({
  size = "md",
  label,
  fullScreen = false,
  minHeight = "min-h-[400px]",
  className,
}: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <Loader2
        className={cn(
          "animate-spin text-neutral-400",
          sizeClasses[size]
        )}
      />
      {label && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "flex h-screen items-center justify-center bg-white dark:bg-neutral-950",
        className
      )}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center",
      minHeight,
      className
    )}>
      {content}
    </div>
  );
}

/** Inline loading spinner for buttons, etc */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  );
}
