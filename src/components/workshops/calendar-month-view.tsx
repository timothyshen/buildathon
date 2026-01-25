"use client";

import { Workshop } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  currentDate: Date;
  workshops: Workshop[];
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

function getWorkshopsForDate(date: Date, workshops: Workshop[]): Workshop[] {
  return workshops.filter((workshop) => {
    if (!workshop.scheduledAt) return false;
    return isSameDay(new Date(workshop.scheduledAt), date);
  });
}

export function CalendarMonthView({
  currentDate,
  workshops,
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
            const dayWorkshops = getWorkshopsForDate(date, workshops);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const hasWorkshops = dayWorkshops.length > 0;

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

                {/* Workshop indicators */}
                {hasWorkshops && (
                  <div className="mt-1 space-y-1">
                    {dayWorkshops.slice(0, 2).map((workshop) => (
                      <div
                        key={workshop.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate",
                          workshop.category.toLowerCase() === "basics" &&
                            "bg-green-100 text-green-800",
                          workshop.category.toLowerCase() === "advanced" &&
                            "bg-purple-100 text-purple-800",
                          workshop.category.toLowerCase() === "business" &&
                            "bg-blue-100 text-blue-800",
                          !["basics", "advanced", "business"].includes(
                            workshop.category.toLowerCase()
                          ) && "bg-gray-100 text-gray-800"
                        )}
                        title={workshop.title}
                      >
                        {workshop.title}
                      </div>
                    ))}
                    {dayWorkshops.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayWorkshops.length - 2} more
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
