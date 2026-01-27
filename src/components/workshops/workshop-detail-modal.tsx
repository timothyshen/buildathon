"use client";

import { Workshop, WorkshopRSVP } from "@/types";
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
  GraduationCap,
  Sparkles,
  Briefcase,
  Check,
} from "lucide-react";

interface WorkshopDetailModalProps {
  workshop: Workshop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRsvp?: WorkshopRSVP;
  rsvpCount?: number;
  onRsvp: () => void;
  onAddToCalendar: (type: "google" | "apple" | "ics") => void;
}

function getCategoryBadge(category: string) {
  switch (category.toLowerCase()) {
    case "basics":
      return {
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: <GraduationCap className="h-3 w-3 mr-1" />,
      };
    case "advanced":
      return {
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: <Sparkles className="h-3 w-3 mr-1" />,
      };
    case "business":
      return {
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: <Briefcase className="h-3 w-3 mr-1" />,
      };
    default:
      return {
        className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
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
  rsvpCount = 0,
  onRsvp,
  onAddToCalendar,
}: WorkshopDetailModalProps) {
  if (!workshop) return null;

  const attendeeCount = rsvpCount;
  const duration = formatDuration(workshop);
  const hasUserRsvp = userRsvp && userRsvp.status === "registered";
  const categoryBadge = getCategoryBadge(workshop.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Partner Logo and Title */}
          <div className="flex items-start gap-4">
            {workshop.partnerLogo ? (
              <img
                src={workshop.partnerLogo}
                alt={workshop.partnerName || "Partner"}
                className="h-14 w-14 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-7 w-7 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <Badge className={categoryBadge.className}>
                  {categoryBadge.icon}
                  {workshop.category}
                </Badge>
                {hasUserRsvp && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    <Check className="h-3 w-3 mr-1" />
                    RSVP'd
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl leading-tight">
                {workshop.title}
              </DialogTitle>
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
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button
            variant={hasUserRsvp ? "outline" : "default"}
            size="lg"
            onClick={onRsvp}
            className={hasUserRsvp ? "" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"}
          >
            {hasUserRsvp ? "Cancel RSVP" : "RSVP for this Workshop"}
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
