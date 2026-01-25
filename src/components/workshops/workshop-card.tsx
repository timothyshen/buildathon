"use client";

import { Workshop, WorkshopRSVP } from "@/types";
import { getRSVPsByWorkshop } from "@/data/mock-data";
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
import { Clock, Users, MapPin, ChevronDown, Calendar } from "lucide-react";

interface WorkshopCardProps {
  workshop: Workshop;
  rsvpCount?: number;
  userRsvp?: WorkshopRSVP;
  onViewDetails: (workshop: Workshop) => void;
  onRsvp: (workshop: Workshop) => void;
  onAddToCalendar: (workshop: Workshop, type: "google" | "outlook" | "ical") => void;
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
  const actualRsvpCount = rsvpCount ?? getRSVPsByWorkshop(workshop.id).length;
  const duration = formatDuration(workshop);
  const hasUserRsvp = userRsvp && userRsvp.status === "registered";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {workshop.partnerLogo && (
              <img
                src={workshop.partnerLogo}
                alt={workshop.partnerName || "Partner"}
                className="h-10 w-10 rounded-full object-cover"
              />
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
          <Badge className={getCategoryBadgeClasses(workshop.category)}>
            {workshop.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 mt-2">
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
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/60">|</span>
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
              {actualRsvpCount}
              {workshop.maxAttendees && ` / ${workshop.maxAttendees}`} attending
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(workshop)}
          >
            View Details
          </Button>
          <Button
            variant={hasUserRsvp ? "secondary" : "default"}
            size="sm"
            onClick={() => onRsvp(workshop)}
          >
            {hasUserRsvp ? "Cancel RSVP" : "RSVP"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4" />
                Add to Calendar
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
