"use client";

import { useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workshop } from "@/types";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 7;   // 7 AM
const END_HOUR = 22;    // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarWeekViewProps {
  currentDate: Date;
  events: Workshop[];
  sponsorEventIds: Set<string>;
  onDateChange: (date: Date) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onEventClick: (workshop: Workshop) => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day + 1); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleString("en-US", { month: "short" });
  const endMonth = weekEnd.toLocaleString("en-US", { month: "short" });
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${year}`;
  }
  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${year}`;
}

interface EventBlock {
  workshop: Workshop;
  top: number;
  height: number;
  isSponsor: boolean;
}

function getEventBlocksForDay(
  day: Date,
  events: Workshop[],
  sponsorIds: Set<string>
): EventBlock[] {
  return events
    .filter((e) => e.scheduledAt && isSameDay(e.scheduledAt, day))
    .map((e) => {
      const start = e.scheduledAt!;
      const end = e.endTime || new Date(start.getTime() + 60 * 60 * 1000); // default 1h
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();
      const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
      return {
        workshop: e,
        top,
        height,
        isSponsor: sponsorIds.has(e.id),
      };
    })
    .filter((b) => b.top + b.height > 0 && b.top < TOTAL_HOURS * HOUR_HEIGHT);
}

export function CalendarWeekView({
  currentDate,
  events,
  sponsorEventIds,
  onDateChange,
  onSlotClick,
  onEventClick,
}: CalendarWeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const scrollTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT - 100;
      scrollRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, []);

  const navigateWeek = (direction: -1 | 1) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + direction * 7);
    onDateChange(next);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Current time indicator position
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowTop = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;
  const isCurrentWeek = weekDays.some((d) => isSameDay(d, today));

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header: navigation + day labels */}
      <div className="border-b bg-background">
        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium ml-1">
              {formatWeekRange(weekStart)}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
            Today
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div /> {/* time column spacer */}
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={cn(
                  "py-2 text-center border-l",
                  isToday && "bg-muted/50"
                )}
              >
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {DAY_LABELS[day.getDay()]}
                </div>
                <div
                  className={cn(
                    "text-sm font-medium mt-0.5",
                    isToday && "bg-foreground text-background rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[600px] relative">
        <div className="grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="relative">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute right-2 text-[11px] text-muted-foreground tabular-nums"
                style={{ top: i * HOUR_HEIGHT - 7 }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            const blocks = getEventBlocksForDay(day, events, sponsorEventIds);

            return (
              <div
                key={dayIndex}
                className={cn("relative border-l", isToday && "bg-muted/30")}
              >
                {/* Hour grid lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-b border-border/40 cursor-pointer hover:bg-muted/50 transition-colors"
                    style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(day, START_HOUR + i)}
                  />
                ))}

                {/* Event blocks */}
                {blocks.map((block) => (
                  <div
                    key={block.workshop.id}
                    className={cn(
                      "absolute inset-x-1 rounded-md px-1.5 py-1 cursor-pointer overflow-hidden z-10 transition-opacity hover:opacity-80",
                      block.isSponsor
                        ? "bg-foreground/10 border-l-2 border-foreground"
                        : "bg-muted border-l-2 border-muted-foreground/50"
                    )}
                    style={{ top: block.top, height: block.height }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(block.workshop);
                    }}
                  >
                    <p className="text-[11px] font-medium truncate leading-tight">
                      {block.workshop.title}
                    </p>
                    {block.height > 30 && block.workshop.scheduledAt && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {block.workshop.scheduledAt.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}
                  </div>
                ))}

                {/* Current time indicator */}
                {isToday && isCurrentWeek && showNowLine && (
                  <div
                    className="absolute inset-x-0 z-20 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="flex items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-[5px]" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
