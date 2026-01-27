"use client";

import { Workshop, WorkshopRSVP } from "@/types";
import { WorkshopCard } from "./workshop-card";
import { Calendar } from "lucide-react";

interface CalendarAgendaViewProps {
  workshops: Workshop[];
  userRsvps: WorkshopRSVP[];
  rsvpCounts: Record<string, number>;
  onViewDetails: (workshop: Workshop) => void;
  onRsvp: (workshop: Workshop) => void;
  onAddToCalendar: (workshop: Workshop, type: "google" | "outlook" | "ical") => void;
}

interface GroupedWorkshops {
  date: Date;
  label: string;
  workshops: Workshop[];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getDateLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) {
    return "Today";
  }
  if (isSameDay(date, tomorrow)) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupWorkshopsByDate(workshops: Workshop[]): GroupedWorkshops[] {
  // Filter only workshops with scheduledAt and sort by date
  const scheduledWorkshops = workshops
    .filter((w) => w.scheduledAt)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
    );

  const groups: GroupedWorkshops[] = [];
  let currentGroup: GroupedWorkshops | null = null;

  for (const workshop of scheduledWorkshops) {
    const workshopDate = new Date(workshop.scheduledAt!);
    // Normalize to start of day
    const normalizedDate = new Date(
      workshopDate.getFullYear(),
      workshopDate.getMonth(),
      workshopDate.getDate()
    );

    if (!currentGroup || !isSameDay(currentGroup.date, normalizedDate)) {
      currentGroup = {
        date: normalizedDate,
        label: getDateLabel(normalizedDate),
        workshops: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.workshops.push(workshop);
  }

  return groups;
}

export function CalendarAgendaView({
  workshops,
  userRsvps,
  rsvpCounts,
  onViewDetails,
  onRsvp,
  onAddToCalendar,
}: CalendarAgendaViewProps) {
  const groupedWorkshops = groupWorkshopsByDate(workshops);

  if (groupedWorkshops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Upcoming Workshops</h3>
        <p className="text-muted-foreground max-w-sm">
          There are no workshops scheduled at this time. Check back later for
          new workshops and events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedWorkshops.map((group) => (
        <div key={group.date.toISOString()}>
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 mb-4 border-b">
            <h2 className="text-lg font-semibold">{group.label}</h2>
            <p className="text-sm text-muted-foreground">
              {group.workshops.length}{" "}
              {group.workshops.length === 1 ? "workshop" : "workshops"}
            </p>
          </div>

          {/* Workshop Cards */}
          <div className="space-y-4">
            {group.workshops.map((workshop) => {
              const userRsvp = userRsvps.find(
                (r) => r.workshopId === workshop.id
              );

              return (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  rsvpCount={rsvpCounts[workshop.id] || 0}
                  userRsvp={userRsvp}
                  onViewDetails={onViewDetails}
                  onRsvp={onRsvp}
                  onAddToCalendar={onAddToCalendar}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
