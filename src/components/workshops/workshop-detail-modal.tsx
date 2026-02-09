"use client";

import Image from "next/image";
import { CalendarEvent } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Calendar,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Briefcase,
  Check,
} from "lucide-react";

interface WorkshopDetailModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRsvped: boolean;
  onRsvp: () => void;
  onAddToCalendar: (type: "google" | "apple" | "ics") => void;
}

function getCategoryBadge(category: string) {
  switch (category.toLowerCase()) {
    case "basics":
      return {
        className: "bg-category-technical/10 text-category-technical border-category-technical/20",
        icon: <GraduationCap className="h-3 w-3 mr-1" />,
      };
    case "advanced":
      return {
        className: "bg-category-design/10 text-category-design border-category-design/20",
        icon: <Sparkles className="h-3 w-3 mr-1" />,
      };
    case "business":
      return {
        className: "bg-category-business/10 text-category-business border-category-business/20",
        icon: <Briefcase className="h-3 w-3 mr-1" />,
      };
    default:
      return {
        className: "bg-muted text-muted-foreground border-border",
        icon: null,
      };
  }
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
  const categoryBadge = getCategoryBadge(event.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Cover Image */}
        {event.coverUrl && (
          <div className="-mx-6 -mt-6 mb-4 relative h-48">
            <Image
              src={event.coverUrl}
              alt={event.title}
              fill
              unoptimized
              className="object-cover rounded-t-lg"
            />
          </div>
        )}

        <DialogHeader>
          {/* Host and Title */}
          <div className="flex items-start gap-4">
            {event.hostAvatar ? (
              <Image
                src={event.hostAvatar}
                alt={event.hostName || "Host"}
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-xl object-cover flex-shrink-0 bg-muted"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <Badge className={categoryBadge.className}>
                  {categoryBadge.icon}
                  {event.category}
                </Badge>
                {isRsvped && (
                  <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                    <Check className="h-3 w-3 mr-1" />
                    RSVP&apos;d
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl leading-tight">
                {event.title}
              </DialogTitle>
              {event.hostName && (
                <p className="text-sm text-muted-foreground mt-1">
                  by {event.hostName}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Full Description */}
        <DialogDescription className="text-base text-foreground">
          {event.description}
        </DialogDescription>

        {/* Info Section */}
        <div className="space-y-3 py-4 border-y">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{formatDateTime(event.startAt)}</span>
          </div>
          {duration && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{duration}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* View on Luma */}
        {event.eventUrl && /^https?:\/\//i.test(event.eventUrl) && (
          <Button variant="outline" className="w-full" asChild>
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Luma
            </a>
          </Button>
        )}

        {/* Meeting Link (only if RSVP'd) */}
        {isRsvped && event.meetingUrl && /^https?:\/\//i.test(event.meetingUrl) && (
          <Button variant="secondary" className="w-full" asChild>
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Meeting
            </a>
          </Button>
        )}

        {/* Note about RSVP to receive meeting link */}
        {!isRsvped && event.meetingUrl && (
          <p className="text-sm text-muted-foreground text-center py-2">
            RSVP to receive the meeting link
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button
            variant={isRsvped ? "outline" : "default"}
            size="lg"
            onClick={onRsvp}
            className={isRsvped ? "" : "bg-foreground text-background hover:bg-foreground/90"}
          >
            {isRsvped ? "RSVP'd" : "RSVP for this Event"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAddToCalendar("google")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Google Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAddToCalendar("ics")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Download .ics
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
