"use client";

import { useState } from "react";
import { mockCohorts } from "@/data/mock-data";
import { CohortCard } from "@/components/cohorts/cohort-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";

type FilterStatus = "all" | "upcoming" | "active" | "completed";

export default function CohortsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");

  // Only show public cohorts
  const publicCohorts = mockCohorts.filter((cohort) => cohort.isPublic);

  // Filter cohorts based on selected filter
  const filteredCohorts = publicCohorts.filter((cohort) => {
    if (filter === "all") return true;
    if (filter === "completed") {
      // Include both completed and judging status for "completed" filter
      return cohort.status === "completed" || cohort.status === "judging";
    }
    return cohort.status === filter;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Explore Buildathons
          </h1>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            Join our buildathons to build innovative projects, learn new skills,
            and connect with fellow builders in the Story Protocol ecosystem.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Tabs */}
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as FilterStatus)}
          className="w-full"
        >
          <TabsList className="mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {filteredCohorts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCohorts.map((cohort) => (
                  <CohortCard key={cohort.id} cohort={cohort} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No buildathons found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {filter === "upcoming" && "Check back soon for upcoming buildathons!"}
                  {filter === "active" && "No buildathons are currently active."}
                  {filter === "completed" && "No completed buildathons yet."}
                  {filter === "all" && "No buildathons available at this time."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
