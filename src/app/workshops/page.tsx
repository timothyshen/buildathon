"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { workshopsService } from "@/services";
import { Workshop, WorkshopRSVP } from "@/types";
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

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function WorkshopsPage() {
  const { user } = useAuth();

  // Data loading state
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State management
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localRsvps, setLocalRsvps] = useState<WorkshopRSVP[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});

  // Load workshops and RSVPs
  useEffect(() => {
    async function loadData() {
      try {
        const { data: workshopList, success, error: workshopsError } = await workshopsService.list();
        if (!success) {
          setError(workshopsError || "Failed to load workshops");
          setIsLoading(false);
          return;
        }

        setWorkshops(workshopList);

        // Load RSVPs for all published workshops
        const publishedIds = workshopList
          .filter((w) => w.status === "published" && w.scheduledAt)
          .map((w) => w.id);

        const rsvpPromises = publishedIds.map(async (id) => {
          const { data } = await workshopsService.getRSVPs(id);
          return { id, rsvps: data };
        });

        const rsvpResults = await Promise.all(rsvpPromises);

        const counts: Record<string, number> = {};
        const allRsvps: WorkshopRSVP[] = [];
        for (const { id, rsvps } of rsvpResults) {
          counts[id] = rsvps.length;
          allRsvps.push(...rsvps);
        }

        setRsvpCounts(counts);
        setLocalRsvps(allRsvps);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Get published workshops only
  const publishedWorkshops = useMemo(() => {
    return workshops.filter((w) => w.status === "published" && w.scheduledAt);
  }, [workshops]);

  // Get upcoming workshops (next 5)
  const upcomingWorkshops = useMemo(() => {
    const now = new Date();
    return publishedWorkshops
      .filter((w) => w.scheduledAt && new Date(w.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 5);
  }, [publishedWorkshops]);

  // Get workshops for selected date
  const workshopsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return publishedWorkshops.filter((w) => {
      if (!w.scheduledAt) return false;
      return isSameDay(new Date(w.scheduledAt), selectedDate);
    });
  }, [selectedDate, publishedWorkshops]);

  // Get user's RSVPs
  const userRsvps = useMemo(() => {
    if (!user) return [];
    return localRsvps.filter((r) => r.userId === user.id && r.status === "registered");
  }, [user, localRsvps]);

  // Get workshops the user has RSVPed to
  const rsvpedWorkshops = useMemo(() => {
    if (!user) return [];
    const rsvpWorkshopIds = userRsvps.map((r) => r.workshopId);
    return publishedWorkshops.filter((w) => rsvpWorkshopIds.includes(w.id));
  }, [user, userRsvps, publishedWorkshops]);

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
        <div className="text-destructive text-lg">Failed to load workshops</div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Get user's RSVP for a specific workshop
  const getUserRsvpForWorkshop = (workshopId: string): WorkshopRSVP | undefined => {
    if (!user) return undefined;
    return localRsvps.find(
      (r) => r.workshopId === workshopId && r.userId === user.id && r.status === "registered"
    );
  };

  // Handler functions
  const handleViewDetails = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setModalOpen(true);
  };

  const handleRsvp = (workshop: Workshop) => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login";
      return;
    }

    const existingRsvp = getUserRsvpForWorkshop(workshop.id);

    if (existingRsvp) {
      // Cancel RSVP - update status to cancelled
      setLocalRsvps((prev) =>
        prev.map((r) =>
          r.id === existingRsvp.id ? { ...r, status: "cancelled" as const } : r
        )
      );
    } else {
      // Create new RSVP
      const newRsvp: WorkshopRSVP = {
        id: `rsvp-${Date.now()}`,
        workshopId: workshop.id,
        userId: user.id,
        user: user,
        status: "registered",
        registeredAt: new Date(),
      };
      setLocalRsvps((prev) => [...prev, newRsvp]);
    }
  };

  const handleAddToCalendar = (workshop: Workshop, type: "google" | "outlook" | "ical" | "apple" | "ics") => {
    if (type === "google") {
      const url = generateGoogleCalendarUrl(workshop);
      if (url) {
        window.open(url, "_blank");
      }
    } else if (type === "ical" || type === "ics" || type === "apple") {
      downloadICSFile(workshop);
    } else if (type === "outlook") {
      // Outlook Web also supports Google Calendar URL format
      const url = generateGoogleCalendarUrl(workshop);
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 mb-4">
            <Calendar className="h-3 w-3 mr-1.5" />
            Live Sessions
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-white">
            Workshops & Learning
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
            Join live sessions, RSVP for upcoming workshops, and learn from Story Protocol experts.
          </p>
          <Button asChild className="mt-8 bg-white text-slate-900 hover:bg-slate-100">
            <Link href="/workshops/resources">
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
                    workshops={publishedWorkshops}
                    onDateChange={setCurrentDate}
                    onDateSelect={setSelectedDate}
                    selectedDate={selectedDate ?? undefined}
                  />

                  {/* Workshops for selected date */}
                  {selectedDate && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">
                        Workshops on{" "}
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h2>
                      {workshopsForSelectedDate.length === 0 ? (
                        <p className="text-muted-foreground">
                          No workshops scheduled for this date.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {workshopsForSelectedDate.map((workshop) => (
                            <WorkshopCard
                              key={workshop.id}
                              workshop={workshop}
                              rsvpCount={rsvpCounts[workshop.id] || 0}
                              userRsvp={getUserRsvpForWorkshop(workshop.id)}
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
                  workshops={publishedWorkshops}
                  userRsvps={userRsvps}
                  rsvpCounts={rsvpCounts}
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
                      Sign in to RSVP for workshops and track your sessions.
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
                  {upcomingWorkshops.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming workshops scheduled.
                    </p>
                  ) : (
                    upcomingWorkshops.map((workshop) => (
                      <div
                        key={workshop.id}
                        className="border-b last:border-b-0 pb-3 last:pb-0"
                      >
                        <button
                          onClick={() => handleViewDetails(workshop)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {workshop.title}
                          </p>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {workshop.scheduledAt &&
                            new Date(workshop.scheduledAt).toLocaleDateString("en-US", {
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
              {user && rsvpedWorkshops.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your RSVPs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rsvpedWorkshops.map((workshop) => (
                      <div
                        key={workshop.id}
                        className="border-b last:border-b-0 pb-3 last:pb-0"
                      >
                        <button
                          onClick={() => handleViewDetails(workshop)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <p className="font-medium text-sm line-clamp-1">
                            {workshop.title}
                          </p>
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {workshop.scheduledAt &&
                            new Date(workshop.scheduledAt).toLocaleDateString("en-US", {
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

      {/* Workshop Detail Modal */}
      <WorkshopDetailModal
        workshop={selectedWorkshop}
        open={modalOpen}
        onOpenChange={setModalOpen}
        userRsvp={selectedWorkshop ? getUserRsvpForWorkshop(selectedWorkshop.id) : undefined}
        rsvpCount={selectedWorkshop ? (rsvpCounts[selectedWorkshop.id] || 0) : 0}
        onRsvp={() => {
          if (selectedWorkshop) {
            handleRsvp(selectedWorkshop);
          }
        }}
        onAddToCalendar={(type) => {
          if (selectedWorkshop) {
            handleAddToCalendar(selectedWorkshop, type);
          }
        }}
      />
    </div>
  );
}
