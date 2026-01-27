"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Github, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const handleCardClick = () => {
    router.push(`/projects/${submission.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex flex-col h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md transition-colors hover:border-black dark:hover:border-white overflow-hidden cursor-pointer",
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
            <h3 className="font-semibold text-black dark:text-white truncate group-hover:underline">
              {submission.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {submission.tagline || submission.description}
            </p>
          </div>
          {isWinner && prizes.length > 0 && (
            <div className="shrink-0">
              <PrizeBadges prizes={prizes} maxVisible={3} size="sm" />
            </div>
          )}
        </div>

        {/* Tech stack - monospace */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleTech.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
            >
              {tech}
            </span>
          ))}
          {remainingTech > 0 && (
            <span className="px-2 py-0.5 text-xs font-mono text-neutral-400 dark:text-neutral-500">
              +{remainingTech}
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          {submission.cohort && <span>{submission.cohort.name}</span>}
          {submission.cohort && submission.track && (
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
          )}
          {submission.track && <span>{submission.track.name}</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
        <div className="flex-1 text-sm text-neutral-500 dark:text-neutral-400">
          {submission.team?.name}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {submission.demoUrl && (
            <a
              href={submission.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded hover:border-black dark:hover:border-white transition-colors"
            >
              <Github className="h-3 w-3" />
              Code
            </a>
          )}
          {submission.ipAssetId && (
            <a
              href="#"
              title="Fork on Story Protocol"
              className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <GitFork className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
