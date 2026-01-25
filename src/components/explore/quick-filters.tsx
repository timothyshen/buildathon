"use client";

import { Button } from "@/components/ui/button";
import { Trophy, Cpu, Code2, Blocks } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFilter {
  label: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickFilters: QuickFilter[] = [
  { label: "Winners", query: "prize:winner", icon: Trophy },
  { label: "AI Projects", query: "tech:ai", icon: Cpu },
  { label: "React", query: "tech:react", icon: Code2 },
  { label: "Story Protocol", query: "tech:story", icon: Blocks },
];

interface QuickFiltersProps {
  currentQuery: string;
  onFilterToggle: (query: string) => void;
  className?: string;
}

export function QuickFilters({
  currentQuery,
  onFilterToggle,
  className,
}: QuickFiltersProps) {
  const isFilterActive = (filterQuery: string) => {
    return currentQuery.toLowerCase().includes(filterQuery.toLowerCase());
  };

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {quickFilters.map((filter) => {
        const active = isFilterActive(filter.query);
        const Icon = filter.icon;

        return (
          <Button
            key={filter.query}
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterToggle(filter.query)}
            className={cn(
              "shrink-0 gap-1.5",
              active && "bg-primary text-primary-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
