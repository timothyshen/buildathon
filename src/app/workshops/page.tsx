"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { eventsService } from "@/services";
import { CalendarEvent } from "@/types";
import { CalendarMonthView } from "@/components/workshops/calendar-month-view";
import { CalendarAgendaView } from "@/components/workshops/calendar-agenda-view";
import { WorkshopDetailModal } from "@/components/workshops/workshop-detail-modal";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/lib/calendar-utils";
import { Calendar, List, LogIn, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function WorkshopsPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Data loading state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State management
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());

  // Load events from Luma via our API proxy
  // Wait for auth to resolve before fetching so RSVPs load alongside events
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadData() {
      try {
        const result = await eventsService.listEvents();
        if (cancelled) return;
        setEvents(result.events);

        // Load user's existing RSVPs
        if (user) {
          const rsvps = await eventsService.getUserRsvps();
          if (cancelled) return;
          setRsvpedEventIds(new Set(rsvps));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  // Get upcoming events (next 5)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.startAt) >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [events]);

  // Get events for selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => isSameDay(new Date(e.startAt), selectedDate));
  }, [selectedDate, events]);

  // Get events the user has RSVPed to
  const rsvpedEvents = useMemo(() => {
    if (!user) return [];
    return events.filter((e) => rsvpedEventIds.has(e.id));
  }, [user, rsvpedEventIds, events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive text-lg">Failed to load events</div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Handler functions
  const handleViewDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleRsvp = async (event: CalendarEvent) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (rsvpedEventIds.has(event.id)) {
      // Already RSVP'd — no cancel through Luma API, just show toast
      toast.info("You're already registered for this event");
      return;
    }

    const result = await eventsService.rsvp(event.lumaApiId);

    if (result.success) {
      setRsvpedEventIds((prev) => new Set([...prev, event.id]));
      // Optimistically increment attendee count
      const updatedCount = (event.attendeeCount || 0) + 1;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, attendeeCount: updatedCount }
            : e
        )
      );
      // Update the modal's selected event too
      if (selectedEvent?.id === event.id) {
        setSelectedEvent({ ...event, attendeeCount: updatedCount });
      }
      toast.success("RSVP confirmed! You're registered for this event.");
    } else {
      toast.error(result.error || "Failed to RSVP. Please try again.");
    }
  };

  const handleAddToCalendar = (event: CalendarEvent, type: "google" | "outlook" | "ical" | "apple" | "ics") => {
    if (type === "google") {
      const url = generateGoogleCalendarUrl(event);
      if (url) window.open(url, "_blank");
    } else if (type === "ical" || type === "ics" || type === "apple") {
      downloadICSFile(event);
    } else if (type === "outlook") {
      const url = generateGoogleCalendarUrl(event);
      if (url) window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 mx-4 mt-4 rounded-3xl">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-8 py-16 text-center">
          <Badge className="bg-category-technical/20 text-category-technical border-category-technical/30 mb-4">
            <Calendar className="h-3 w-3 mr-1.5" />
            Live Sessions
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-white">
            Workshops & Events
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
            Join live sessions, RSVP for upcoming events, and learn from Story Protocol experts.
          </p>
          <Button asChild className="mt-8 bg-background text-foreground hover:bg-accent">
            <Link href="/resources">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Learning Resources
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 min-h-[50vh]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Calendar Area (3 columns) */}
            <div className="lg:col-span-3 space-y-6">
              {/* View Toggle Tabs */}
              <Tabs value={view} onValueChange={(v) => setView(v as "month" | "agenda")}>
                <TabsList>
                  <TabsTrigger value="month" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="agenda" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Agenda
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Calendar Views */}
              {view === "month" ? (
                <>
                  <CalendarMonthView
                    currentDate={currentDate}
                    events={events}
                    onDateChange={setCurrentDate}
                    onDateSelect={setSelectedDate}
                    selectedDate={selectedDate ?? undefined}
                  />

                  {/* Events for selected date */}
                  {selectedDate && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">
                        Events on{" "}
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h2>
                      {eventsForSelectedDate.length === 0 ? (
                        <p className="text-muted-foreground">
                          No events scheduled for this date.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {eventsForSelectedDate.map((event) => (
                            <WorkshopCard
                              key={event.id}
                              event={event}
                              isRsvped={rsvpedEventIds.has(event.id)}
                              onViewDetails={handleViewDetails}
                              onRsvp={handleRsvp}
                              onAddToCalendar={handleAddToCalendar}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <CalendarAgendaView
                  events={events}
                  rsvpedEventIds={rsvpedEventIds}
                  onViewDetails={handleViewDetails}
                  onRsvp={handleRsvp}
                  onAddToCalendar={handleAddToCalendar}
                />
              )}
            </div>

            {/* Sidebar (1 column) */}
            <div className="space-y-6">
              {/* Login Prompt Card */}
              {!user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sign In Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign in to RSVP for events and track your sessions.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Sessions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming events scheduled.
                    </p>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border-b last:border-b-0 pb-3 last:pb-0"
                      >
                        <button
                          onClick={() => handleViewDetails(event)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {event.title}
                          </p>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.startAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Your RSVPs Card (only if user has RSVPs) */}
              {user && rsvpedEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your RSVPs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rsvpedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border-b last:border-b-0 pb-3 last:pb-0"
                      >
                        <button
                          onClick={() => handleViewDetails(event)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {event.title}
                          </p>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.startAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Event Detail Modal */}
      <WorkshopDetailModal
        event={selectedEvent}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isRsvped={selectedEvent ? rsvpedEventIds.has(selectedEvent.id) : false}
        onRsvp={() => {
          if (selectedEvent) {
            handleRsvp(selectedEvent);
          }
        }}
        onAddToCalendar={(type) => {
          if (selectedEvent) {
            handleAddToCalendar(selectedEvent, type);
          }
        }}
      />
    </div>
  );
}
