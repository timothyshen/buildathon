"use client";

import { CalendarEvent } from "@/types";
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
import { Clock, MapPin, ChevronDown, Calendar, Sparkles, GraduationCap, Briefcase, Check, ExternalLink } from "lucide-react";

interface WorkshopCardProps {
  event: CalendarEvent;
  isRsvped: boolean;
  onViewDetails: (event: CalendarEvent) => void;
  onRsvp: (event: CalendarEvent) => void;
  onAddToCalendar: (event: CalendarEvent, type: "google" | "outlook" | "ical") => void;
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

export function WorkshopCard({
  event,
  isRsvped,
  onViewDetails,
  onRsvp,
  onAddToCalendar,
}: WorkshopCardProps) {
  const duration = formatDuration(event);
  const categoryBadge = getCategoryBadge(event.category);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {event.hostAvatar ? (
              <img
                src={event.hostAvatar}
                alt={event.hostName || "Host"}
                className="h-12 w-12 rounded-xl object-cover bg-muted"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
              {event.hostName && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  by {event.hostName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRsvped && (
              <Badge className="bg-status-active/10 text-status-active border-status-active/20">
                <Check className="h-3 w-3 mr-1" />
                RSVP&apos;d
              </Badge>
            )}
            <Badge className={categoryBadge.className}>
              {categoryBadge.icon}
              {event.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-3">
          {event.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatTime(event.startAt)}</span>
          </div>
          {duration && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>&bull;</span>
              <span>{duration}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(event)}
          >
            View Details
          </Button>
          <Button
            variant={isRsvped ? "outline" : "default"}
            size="sm"
            onClick={() => onRsvp(event)}
          >
            {isRsvped ? "RSVP'd" : "RSVP"}
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" asChild>
            <a href={event.eventUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onAddToCalendar(event, "google")}
              >
                Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddToCalendar(event, "outlook")}
              >
                Outlook
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddToCalendar(event, "ical")}
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
