"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { mockWorkshops, getRSVPsByWorkshop, mockWorkshopRSVPs } from "@/data/mock-data";
import { Workshop, WorkshopRSVP } from "@/types";
import { CalendarMonthView } from "@/components/workshops/calendar-month-view";
import { CalendarAgendaView } from "@/components/workshops/calendar-agenda-view";
import { WorkshopDetailModal } from "@/components/workshops/workshop-detail-modal";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateGoogleCalendarUrl, downloadICSFile } from "@/lib/calendar-utils";
import { Calendar, List, LogIn, BookOpen } from "lucide-react";

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function WorkshopsPage() {
  const { user } = useAuth();

  // State management
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localRsvps, setLocalRsvps] = useState<WorkshopRSVP[]>(mockWorkshopRSVPs);

  // Get published workshops only
  const publishedWorkshops = useMemo(() => {
    return mockWorkshops.filter((w) => w.status === "published" && w.scheduledAt);
  }, []);

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

  // Get workshops the user has RSVPed to
  const rsvpedWorkshops = useMemo(() => {
    if (!user) return [];
    const rsvpWorkshopIds = userRsvps.map((r) => r.workshopId);
    return publishedWorkshops.filter((w) => rsvpWorkshopIds.includes(w.id));
  }, [user, userRsvps, publishedWorkshops]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">
            Workshops & Learning Sessions
          </h1>
          <p className="mt-4 text-lg text-teal-100 max-w-2xl mx-auto">
            Join live sessions, RSVP for upcoming workshops, and learn from Story Protocol experts.
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/workshops/resources">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Learning Resources
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
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
                              rsvpCount={getRSVPsByWorkshop(workshop.id).length}
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
