import { Cohort } from "@/types";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CohortTimelineProps {
  cohort: Cohort;
}

interface TimelineEvent {
  label: string;
  date: Date;
  isCompleted: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
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

  const events: TimelineEvent[] = [
    {
      label: "Buildathon Starts",
      date: cohort.startDate,
      isCompleted: new Date(cohort.startDate) <= now,
    },
    {
      label: "Submission Deadline",
      date: cohort.submissionDeadline,
      isCompleted: new Date(cohort.submissionDeadline) <= now,
    },
    {
      label: "Judging Begins",
      date: cohort.judgingStart,
      isCompleted: new Date(cohort.judgingStart) <= now,
    },
    {
      label: "Winners Announced",
      date: cohort.judgingEnd,
      isCompleted: new Date(cohort.judgingEnd) <= now,
    },
  ];

  return (
    <div className="py-6">
      <h2 className="text-xl font-semibold mb-6">Timeline</h2>
      <div className="relative">
        {events.map((event, index) => (
          <div key={event.label} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connecting Line */}
            {index < events.length - 1 && (
              <div
                className={cn(
                  "absolute left-[11px] top-6 w-0.5 h-full -translate-x-1/2",
                  event.isCompleted ? "bg-green-500" : "bg-border"
                )}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              {event.isCompleted ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-medium",
                  event.isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {event.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(event.date)} at {formatTime(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
