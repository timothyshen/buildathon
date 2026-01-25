import { Cohort } from "@/types";
import { Check, Rocket, FileCheck, Scale, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CohortTimelineProps {
  cohort: Cohort;
}

interface TimelineEvent {
  label: string;
  date: Date;
  isCompleted: boolean;
  isCurrent: boolean;
  icon: React.ReactNode;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function CohortTimeline({ cohort }: CohortTimelineProps) {
  const now = new Date();

  const baseEvents = [
    {
      label: "Buildathon Starts",
      date: cohort.startDate,
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      label: "Submission Deadline",
      date: cohort.submissionDeadline,
      icon: <FileCheck className="h-4 w-4" />,
    },
    {
      label: "Judging Begins",
      date: cohort.judgingStart,
      icon: <Scale className="h-4 w-4" />,
    },
    {
      label: "Winners Announced",
      date: cohort.judgingEnd,
      icon: <Trophy className="h-4 w-4" />,
    },
  ];

  // Find the current event (first incomplete event)
  const currentIndex = baseEvents.findIndex(
    (event) => new Date(event.date) > now
  );

  const events: TimelineEvent[] = baseEvents.map((event, index) => ({
    ...event,
    isCompleted: new Date(event.date) <= now,
    isCurrent: index === currentIndex,
  }));

  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
        Timeline
      </h3>
      <div className="relative pl-1">
        {events.map((event, index) => (
          <div
            key={event.label}
            className={cn(
              "relative flex gap-4 pb-6 last:pb-0",
              event.isCurrent && "animate-pulse-subtle"
            )}
          >
            {/* Connecting Line */}
            {index < events.length - 1 && (
              <div
                className={cn(
                  "absolute left-[15px] top-8 w-0.5 h-[calc(100%-16px)]",
                  event.isCompleted
                    ? "bg-gradient-to-b from-green-500 to-green-400"
                    : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            )}

            {/* Icon Container */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                  event.isCompleted
                    ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/25"
                    : event.isCurrent
                    ? "border-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400 shadow-md shadow-violet-500/25 ring-4 ring-violet-100 dark:ring-violet-900/50"
                    : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                )}
              >
                {event.isCompleted ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  event.icon
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <h4
                  className={cn(
                    "font-medium text-sm",
                    event.isCompleted
                      ? "text-foreground"
                      : event.isCurrent
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground"
                  )}
                >
                  {event.label}
                </h4>
                {event.isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                    NEXT
                  </span>
                )}
                {event.isCompleted && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    DONE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(event.date)} • {formatTime(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
