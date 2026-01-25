"use client";

import Link from "next/link";
import { ExternalLink, Github, GitFork } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrizeBadge } from "./prize-badge";
import { cn } from "@/lib/utils";
import type { EnrichedSubmission } from "@/lib/search-utils";
import type { PrizeInfo } from "@/lib/prize-utils";

interface ProjectCardExploreProps {
  submission: EnrichedSubmission;
  className?: string;
}

export function ProjectCardExplore({
  submission,
  className,
}: ProjectCardExploreProps) {
  const maxTechBadges = 4;
  const visibleTech = submission.techStack.slice(0, maxTechBadges);
  const remainingTech = submission.techStack.length - maxTechBadges;
  const primaryPrize = submission.prizes[0];

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden", className)}>
      <CardHeader className="pb-3">
        {/* Prize badges and cohort info */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            {primaryPrize && (
              <PrizeBadge
                type={primaryPrize.type}
                label={primaryPrize.label}
                size="sm"
              />
            )}
          </div>
          {submission.cohort && (
            <Badge variant="outline" className="text-xs shrink-0">
              {submission.cohort.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <Link href={`/projects/${submission.id}`} className="hover:underline">
          <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
            {submission.title}
          </CardTitle>
        </Link>

        {/* Tagline or description */}
        <CardDescription className="line-clamp-2 mt-1">
          {submission.tagline || submission.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="space-y-3">
          {/* Tech stack */}
          <div className="flex flex-wrap gap-1.5">
            {visibleTech.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {remainingTech > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remainingTech} more
              </Badge>
            )}
          </div>

          {/* Track info */}
          {submission.track && (
            <div className="text-xs text-muted-foreground">
              Track: {submission.track.name}
            </div>
          )}

          {/* Team */}
          {submission.team && (
            <div className="text-sm text-muted-foreground">
              by {submission.team.name}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {submission.demoUrl && (
            <Button size="sm" asChild className="flex-1">
              <a
                href={submission.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Demo
              </a>
            </Button>
          )}
          {submission.repoUrl && (
            <Button size="sm" variant="outline" asChild className="flex-1">
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-3.5 w-3.5 mr-1.5" />
                Code
              </a>
            </Button>
          )}
          {submission.ipAssetId && (
            <Button size="sm" variant="outline" asChild>
              <a href="#" title="Fork on Story Protocol">
                <GitFork className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
