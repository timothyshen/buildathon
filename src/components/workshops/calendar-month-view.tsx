"use client";

import { CalendarEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Get first day of month and how many days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Get the day of week the month starts on (0 = Sunday)
  const startDayOfWeek = firstDayOfMonth.getDay();

  // Get days from previous month to fill the first week
  const days: Date[] = [];
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  // Add all days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((event) => isSameDay(new Date(event.startAt), date));
}

export function CalendarMonthView({
  currentDate,
  events,
  onDateChange,
  onDateSelect,
  selectedDate,
}: CalendarMonthViewProps) {
  const today = new Date();
  const days = getMonthDays(currentDate);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{monthYear}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date, events);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                className={cn(
                  "bg-card min-h-[100px] p-2 text-left transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
                  !isCurrentMonth && "text-muted-foreground/50",
                  isSelected && "bg-accent",
                  isToday && "ring-2 ring-primary ring-inset"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday && "bg-primary text-primary-foreground font-semibold",
                    isSelected && !isToday && "bg-accent-foreground/10"
                  )}
                >
                  {date.getDate()}
                </span>

                {/* Event indicators */}
                {hasEvents && (
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const isPast = new Date(event.endAt) < today;
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate font-medium",
                            isPast && "opacity-50 line-through",
                            event.category.toLowerCase() === "basics" &&
                              "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                            event.category.toLowerCase() === "advanced" &&
                              "bg-violet-500/20 text-violet-700 dark:text-violet-400",
                            event.category.toLowerCase() === "business" &&
                              "bg-blue-500/20 text-blue-700 dark:text-blue-400",
                            !["basics", "advanced", "business"].includes(
                              event.category.toLowerCase()
                            ) && "bg-muted text-muted-foreground"
                          )}
                          title={isPast ? `${event.title} (Ended)` : event.title}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
