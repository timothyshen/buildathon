"use client";

import { Workshop, WorkshopRSVP } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, Users, MapPin, ChevronDown, Calendar, Sparkles, GraduationCap, Briefcase, Check } from "lucide-react";

interface WorkshopCardProps {
  workshop: Workshop;
  rsvpCount: number;
  userRsvp?: WorkshopRSVP;
  onViewDetails: (workshop: Workshop) => void;
  onRsvp: (workshop: Workshop) => void;
  onAddToCalendar: (workshop: Workshop, type: "google" | "outlook" | "ical") => void;
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

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
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

export function WorkshopCard({
  workshop,
  rsvpCount,
  userRsvp,
  onViewDetails,
  onRsvp,
  onAddToCalendar,
}: WorkshopCardProps) {
  const duration = formatDuration(workshop);
  const hasUserRsvp = userRsvp && userRsvp.status === "registered";
  const categoryBadge = getCategoryBadge(workshop.category);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {workshop.partnerLogo ? (
              <img
                src={workshop.partnerLogo}
                alt={workshop.partnerName || "Partner"}
                className="h-12 w-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">{workshop.title}</CardTitle>
              {workshop.partnerName && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  by {workshop.partnerName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUserRsvp && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                <Check className="h-3 w-3 mr-1" />
                RSVP'd
              </Badge>
            )}
            <Badge className={categoryBadge.className}>
              {categoryBadge.icon}
              {workshop.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-3">
          {workshop.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Workshop Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {workshop.scheduledAt && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatTime(workshop.scheduledAt)}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>•</span>
              <span>{duration}</span>
            </div>
          )}
          {workshop.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{workshop.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {rsvpCount}
              {workshop.maxAttendees && ` / ${workshop.maxAttendees}`} attending
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(workshop)}
          >
            View Details
          </Button>
          <Button
            variant={hasUserRsvp ? "outline" : "default"}
            size="sm"
            onClick={() => onRsvp(workshop)}
          >
            {hasUserRsvp ? "Cancel RSVP" : "RSVP"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-auto">
                <Calendar className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onAddToCalendar(workshop, "google")}
              >
                Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddToCalendar(workshop, "outlook")}
              >
                Outlook
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddToCalendar(workshop, "ical")}
              >
                iCal / Apple Calendar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
