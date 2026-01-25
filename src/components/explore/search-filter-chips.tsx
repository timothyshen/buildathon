"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type ParsedQuery,
  getFilterTypeColor,
  getFilterTypeLabel,
} from "@/lib/search-utils";

interface SearchFilterChipsProps {
  query: ParsedQuery;
  onRemoveFilter: (type: keyof ParsedQuery, value: string) => void;
  onClearAll: () => void;
  className?: string;
}

interface FilterChip {
  type: keyof ParsedQuery;
  value: string;
  label: string;
}

export function SearchFilterChips({
  query,
  onRemoveFilter,
  onClearAll,
  className,
}: SearchFilterChipsProps) {
  // Build flat list of filter chips
  const chips: FilterChip[] = [];

  if (query.text) {
    chips.push({ type: "text", value: query.text, label: `"${query.text}"` });
  }
  query.techs.forEach((v) =>
    chips.push({ type: "techs", value: v, label: `tech:${v}` })
  );
  query.cohorts.forEach((v) =>
    chips.push({ type: "cohorts", value: v, label: `cohort:${v}` })
  );
  query.prizes.forEach((v) =>
    chips.push({ type: "prizes", value: v, label: `prize:${v}` })
  );
  query.teams.forEach((v) =>
    chips.push({ type: "teams", value: v, label: `team:${v}` })
  );
  query.tracks.forEach((v) =>
    chips.push({ type: "tracks", value: v, label: `track:${v}` })
  );

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Filters:</span>

      {chips.map((chip, index) => (
        <span
          key={`${chip.type}-${chip.value}-${index}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            getFilterTypeColor(chip.type)
          )}
        >
          {chip.label}
          <button
            onClick={() => onRemoveFilter(chip.type, chip.value)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {chip.label} filter</span>
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
