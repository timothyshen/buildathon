import { Trophy } from "lucide-react";
import type { Submission } from "@/types";

interface ProjectWinnerBannerProps {
  project: Submission;
  trackName?: string;
}

export function ProjectWinnerBanner({ project, trackName }: ProjectWinnerBannerProps) {
  if (project.status !== "winner") return null;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 px-5 py-4 flex items-center gap-3">
      <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Winner
        </p>
        {trackName && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {trackName} Track
          </p>
        )}
      </div>
    </div>
  );
}
