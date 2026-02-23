"use client";

import Image from "next/image";
import { CalendarEvent } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Calendar,
  ExternalLink,
  GraduationCap,
  Video,
  Check,
  Globe,
} from "lucide-react";

interface WorkshopDetailModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRsvped: boolean;
  onRsvp: () => void;
  onAddToCalendar: (type: "google" | "apple" | "ics") => void;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
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

function formatDuration(event: CalendarEvent): string {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${diffMins} min`;
}

export function WorkshopDetailModal({
  event,
  open,
  onOpenChange,
  isRsvped,
  onRsvp,
  onAddToCalendar,
}: WorkshopDetailModalProps) {
  if (!event) return null;

  const duration = formatDuration(event);
  const isPast = new Date(event.endAt) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Cover Image */}
        {event.coverUrl && (
          <div className="relative h-52 w-full">
            <Image
              src={event.coverUrl}
              alt={event.title}
              fill
              unoptimized
              className="object-cover"
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}

        <div className="px-6 pb-6">
          {/* Header */}
          <DialogHeader className={event.coverUrl ? "pt-5" : "pt-6"}>
            <div className="flex items-start gap-3.5">
              {event.hostAvatar ? (
                <Image
                  src={event.hostAvatar}
                  alt={event.hostName || "Host"}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 rounded-lg object-cover flex-shrink-0 bg-muted"
                />
              ) : (
                <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold leading-snug tracking-tight">
                  {event.title}
                </DialogTitle>
                {event.hostName && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {event.hostName}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Info strip */}
          <div className="mt-5 rounded-lg border divide-y text-sm">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium">{formatDate(event.startAt)}</p>
                <p className="text-muted-foreground">
                  {formatTime(event.startAt)} – {formatTime(event.endAt)}
                  <span className="mx-1.5 text-border">·</span>
                  {duration}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            {event.timezone && (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{event.timezone.replace(/_/g, " ")}</span>
              </div>
            )}
          </div>

          {/* RSVP status & attendee count */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            {isRsvped && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span className="font-medium">You&apos;re registered</span>
              </div>
            )}
            {typeof event.attendeeCount === "number" && event.attendeeCount > 0 && (
              <span className="text-muted-foreground">
                {event.attendeeCount} {event.attendeeCount === 1 ? "attendee" : "attendees"}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              About this event
            </h3>
            {event.descriptionMd ? (
              <MarkdownDisplay content={event.descriptionMd} />
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {event.description}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="mt-6 flex flex-col gap-2">
            {event.eventUrl && /^https?:\/\//i.test(event.eventUrl) && (
              <Button variant="outline" size="sm" asChild>
                <a href={event.eventUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View on Luma
                </a>
              </Button>
            )}

            {isRsvped && event.meetingUrl && /^https?:\/\//i.test(event.meetingUrl) && (
              <Button variant="outline" size="sm" asChild>
                <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="h-3.5 w-3.5 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}

            {!isRsvped && event.meetingUrl && (
              <p className="text-xs text-muted-foreground">
                RSVP to receive the meeting link
              </p>
            )}
          </div>

          {/* Action buttons */}
          {!isPast && (
            <div className="mt-6 pt-5 border-t space-y-3">
              <Button
                onClick={onRsvp}
                className={
                  isRsvped
                    ? ""
                    : "w-full bg-foreground text-background hover:bg-foreground/90"
                }
                variant={isRsvped ? "outline" : "default"}
                size="lg"
              >
                {isRsvped ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    RSVP&apos;d
                  </>
                ) : (
                  "RSVP for this Event"
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddToCalendar("google")}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Google Calendar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-muted-foreground hover:text-foreground"
                  onClick={() => onAddToCalendar("ics")}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Download .ics
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
