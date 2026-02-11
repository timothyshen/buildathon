"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Github, GitFork } from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
import { PrizeBadges, prizeBadgeConfig } from "@/components/ui/prize-badges";
import type { EnrichedSubmission } from "@/lib/search-utils";

interface ProjectCardExploreProps {
  submission: EnrichedSubmission;
  className?: string;
}

export function ProjectCardExplore({
  submission,
  className,
}: ProjectCardExploreProps) {
  const router = useRouter();
  const maxTechBadges = 4;
  const visibleTech = submission.techStack.slice(0, maxTechBadges);
  const remainingTech = submission.techStack.length - maxTechBadges;
  const isWinner = submission.status === "winner";
  const prizes = submission.prizes || [];
  const primaryPrize = prizes[0];
  const prizeConfig = primaryPrize ? prizeBadgeConfig[primaryPrize.type] : null;

  // Collect sponsor logos from all won tracks
  const sponsorTracks = isWinner
    ? (submission.tracks || (submission.track ? [submission.track] : []))
        .filter((t) => t.sponsorLogo)
    : [];

  const handleCardClick = () => {
    router.push(`/projects/${submission.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col h-full bg-card border rounded-md transition-colors hover:border-foreground overflow-hidden cursor-pointer",
        className
      )}
    >
      {/* Winner indicator line - color based on prize type */}
      {isWinner && prizeConfig && (
        <div className={cn("absolute top-0 left-4 right-4 h-0.5", prizeConfig.line)} />
      )}

      {/* Main content */}
      <div className="flex-1 p-5">
        {/* Header with title and winner badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:underline">
              {submission.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {submission.tagline || stripHtml(submission.description)}
            </p>
          </div>
          {isWinner && sponsorTracks.length > 0 ? (
            <div className="shrink-0 flex items-center -space-x-1.5">
              {sponsorTracks.slice(0, 3).map((t) => (
                <img
                  key={t.id}
                  src={t.sponsorLogo!}
                  alt={t.sponsorName || "Sponsor"}
                  className="h-7 w-7 rounded-md object-contain border bg-white ring-2 ring-card"
                  title={`${t.sponsorName || "Sponsor"} Bounty Winner`}
                />
              ))}
              {sponsorTracks.length > 3 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                  +{sponsorTracks.length - 3}
                </span>
              )}
            </div>
          ) : isWinner && prizes.length > 0 ? (
            <div className="shrink-0">
              <PrizeBadges prizes={prizes} maxVisible={3} size="sm" />
            </div>
          ) : null}
        </div>

        {/* Tech stack - monospace */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleTech.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs font-mono bg-muted text-muted-foreground rounded"
            >
              {tech}
            </span>
          ))}
          {remainingTech > 0 && (
            <span className="px-2 py-0.5 text-xs font-mono text-muted-foreground">
              +{remainingTech}
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          {submission.cohort && <span>{submission.cohort.name}</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center border-t px-5 py-3">
        <div className="flex-1 text-sm text-muted-foreground">
          {submission.team?.name || "Solo"}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {submission.demoUrl && (
            <a
              href={submission.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded hover:bg-foreground/90 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Demo
            </a>
          )}
          {submission.repoUrl && (
            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded hover:border-foreground transition-colors"
            >
              <Github className="h-3 w-3" />
              Code
            </a>
          )}
          {submission.ipAssetId && (
            <a
              href="#"
              title="Fork on Story Protocol"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitFork className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
