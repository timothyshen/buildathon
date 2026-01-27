"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <div className={cn("inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded transition-all",
            value === option.value
              ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
