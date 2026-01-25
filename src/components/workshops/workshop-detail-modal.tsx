"use client";

import { Workshop, WorkshopRSVP } from "@/types";
import { getRSVPsByWorkshop } from "@/data/mock-data";
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
  Users,
  MapPin,
  Calendar,
  Video,
  FileText,
  ExternalLink,
} from "lucide-react";

interface WorkshopDetailModalProps {
  workshop: Workshop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRsvp?: WorkshopRSVP;
  onRsvp: () => void;
  onAddToCalendar: (type: "google" | "apple" | "ics") => void;
}

function getCategoryBadgeClasses(category: string): string {
  switch (category.toLowerCase()) {
    case "basics":
      return "bg-green-100 text-green-800 border-green-200";
    case "advanced":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "business":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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

function formatDuration(workshop: Workshop): string {
  if (workshop.duration) {
    return workshop.duration;
  }
  if (workshop.scheduledAt && workshop.endTime) {
    const start = new Date(workshop.scheduledAt);
    const end = new Date(workshop.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins >= 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${diffMins} min`;
  }
  return "";
}

export function WorkshopDetailModal({
  workshop,
  open,
  onOpenChange,
  userRsvp,
  onRsvp,
  onAddToCalendar,
}: WorkshopDetailModalProps) {
  if (!workshop) return null;

  const rsvps = getRSVPsByWorkshop(workshop.id);
  const attendeeCount = rsvps.length;
  const duration = formatDuration(workshop);
  const hasUserRsvp = userRsvp && userRsvp.status === "registered";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Partner Logo and Title */}
          <div className="flex items-start gap-4">
            {workshop.partnerLogo && (
              <img
                src={workshop.partnerLogo}
                alt={workshop.partnerName || "Partner"}
                className="h-12 w-12 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-xl leading-tight">
                  {workshop.title}
                </DialogTitle>
                <Badge className={getCategoryBadgeClasses(workshop.category)}>
                  {workshop.category}
                </Badge>
              </div>
              {workshop.partnerName && (
                <p className="text-sm text-muted-foreground mt-1">
                  by {workshop.partnerName}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Full Description */}
        <DialogDescription className="text-base text-foreground">
          {workshop.description}
        </DialogDescription>

        {/* Info Section */}
        <div className="space-y-3 py-4 border-y">
          {workshop.scheduledAt && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{formatDateTime(workshop.scheduledAt)}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{duration}</span>
            </div>
          )}
          {workshop.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{workshop.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>
              {attendeeCount}
              {workshop.maxAttendees && ` / ${workshop.maxAttendees}`} attending
            </span>
          </div>
        </div>

        {/* Resource Buttons */}
        {(workshop.videoUrl || workshop.articleUrl) && (
          <div className="flex flex-wrap gap-2">
            {workshop.videoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={workshop.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Watch Video
                </a>
              </Button>
            )}
            {workshop.articleUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={workshop.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Read Article
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Meeting Link Button (only if user has RSVP and meeting URL exists) */}
        {hasUserRsvp && workshop.meetingUrl && (
          <Button variant="secondary" className="w-full" asChild>
            <a
              href={workshop.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Meeting
            </a>
          </Button>
        )}

        {/* Note about RSVP to receive meeting link */}
        {!hasUserRsvp && workshop.meetingUrl && (
          <p className="text-sm text-muted-foreground text-center py-2">
            RSVP to receive the meeting link
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant={hasUserRsvp ? "secondary" : "default"}
            onClick={onRsvp}
          >
            {hasUserRsvp ? "Cancel RSVP" : "RSVP"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onAddToCalendar("google")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Google Calendar
            </Button>
            <Button
              variant="outline"
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
