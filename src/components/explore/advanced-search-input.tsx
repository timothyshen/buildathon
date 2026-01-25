"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchSyntaxHelp } from "./search-syntax-help";
import { cn } from "@/lib/utils";

interface AdvancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export function AdvancedSearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search projects... try tech:react or @react",
  className,
}: AdvancedSearchInputProps) {
  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <SearchSyntaxHelp />
    </div>
  );
}
