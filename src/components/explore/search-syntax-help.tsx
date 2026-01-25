"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function SearchSyntaxHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Search syntax help</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Search Syntax</h4>
            <p className="text-xs text-muted-foreground">
              Use prefixes or symbols to filter by specific fields.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prefixes
            </h5>
            <div className="grid gap-1.5 text-sm">
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">tech:react</code>
                <span className="text-muted-foreground text-xs">Filter by technology</span>
              </div>
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">cohort:2024</code>
                <span className="text-muted-foreground text-xs">Filter by cohort</span>
              </div>
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">prize:winner</code>
                <span className="text-muted-foreground text-xs">Filter by prize</span>
              </div>
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">team:name</code>
                <span className="text-muted-foreground text-xs">Filter by team</span>
              </div>
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">track:ai</code>
                <span className="text-muted-foreground text-xs">Filter by track</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Shortcuts
            </h5>
            <div className="grid gap-1.5 text-sm">
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">@react</code>
                <span className="text-muted-foreground text-xs">= tech:react</span>
              </div>
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">#2024</code>
                <span className="text-muted-foreground text-xs">= cohort:2024</span>
              </div>
              <div className="flex justify-between">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">!winner</code>
                <span className="text-muted-foreground text-xs">= prize:winner</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Example
            </h5>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              @react #2024 AI agent
            </code>
            <p className="text-xs text-muted-foreground mt-1">
              React projects from 2024 with &quot;AI agent&quot; in title
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
