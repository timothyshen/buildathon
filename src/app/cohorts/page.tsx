"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cohortsService, tracksService, sponsorsService, submissionsService } from "@/services";
import type { Cohort, Track, Submission } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Trophy, Clock, ArrowUpRight, Star, Loader2 } from "lucide-react";

/**
 * Cohort Listing Page - Magazine Style
 *
 * Features:
 * - Clean, neutral color palette
 * - Editorial layout with large featured image
 * - Typography-focused design
 * - Full-width hero card for active cohort
 * - Stacked list for other cohorts
 */

// Enriched cohort type with related data
interface EnrichedCohort extends Cohort {
  tracks: Track[];
  sponsors: CohortSponsorWithOrg[];
  submissions: Submission[];
}

function getCountdown(deadline: Date) {
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

function HeroCard({ cohort }: { cohort: EnrichedCohort }) {
  const { tracks, sponsors, submissions } = cohort;
  const countdown = getCountdown(cohort.submissionDeadline);
  const totalPrize = cohort.prizes?.reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "") || "0"), 0) || 0;
  const featuredProject = submissions.find(s => s.status === "winner") || submissions[0];

  return (
    <Link href={`/cohorts/${cohort.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
          {/* Content */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-status-active/20 text-status-active border-status-active/30">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-status-active animate-pulse" />
                Live Now
              </Badge>
              {countdown && (
                <Badge variant="outline" className="text-slate-300 border-slate-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {countdown.days}d {countdown.hours}h left
                </Badge>
              )}
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              {cohort.name}
            </h2>

            {cohort.tagline && (
              <p className="mt-4 text-xl text-slate-400">{cohort.tagline}</p>
            )}

            {/* Stats */}
            <div className="mt-8 flex gap-8">
              <div>
                <div className="text-4xl font-bold text-white">{tracks.length}</div>
                <div className="text-slate-500">Tracks</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">{submissions.length}</div>
                <div className="text-slate-500">Builders</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">${(totalPrize / 1000).toFixed(0)}k</div>
                <div className="text-slate-500">In Prizes</div>
              </div>
            </div>

            {/* Sponsors */}
            {sponsors.length > 0 && (
              <div className="mt-8">
                <div className="text-sm text-slate-500 mb-3">Presented by</div>
                <div className="flex items-center gap-4">
                  {sponsors.slice(0, 4).map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="relative h-12 w-12 rounded-xl bg-slate-800 p-2"
                    >
                      <Image unoptimized src={sponsor.logo} alt={sponsor.name} fill className="object-contain p-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8">
              <Button size="lg" className="bg-background text-foreground hover:bg-accent group-hover:gap-3 transition-all">
                Explore Buildathon
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Featured project preview */}
          <div className="relative hidden lg:block">
            <div className="absolute -right-8 -top-8 h-[120%] w-[120%] rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden transform rotate-3 group-hover:rotate-1 transition-transform duration-500">
              {featuredProject?.screenshots?.[0] ? (
                <Image
                  unoptimized
                  src={featuredProject.screenshots[0]}
                  alt={`Screenshot from ${featuredProject.title}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Star className="h-16 w-16 text-slate-700" />
                </div>
              )}

              {/* Featured badge */}
              {featuredProject && (
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-slate-900/90 backdrop-blur p-4">
                  <div className="text-xs text-slate-500 mb-1">Featured Project</div>
                  <div className="text-white font-semibold">{featuredProject.title}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ cohort }: { cohort: EnrichedCohort }) {
  const { tracks, sponsors, submissions } = cohort;
  const totalPrize = cohort.prizes?.reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "") || "0"), 0) || 0;

  return (
    <Link href={`/cohorts/${cohort.slug}`} className="group block">
      <div className="flex gap-6 rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:border-foreground/20">
        {/* Thumbnail */}
        <div className="relative hidden sm:block h-32 w-32 shrink-0 rounded-xl bg-muted overflow-hidden">
          {cohort.bannerImage ? (
            <Image unoptimized src={cohort.bannerImage} alt={`${cohort.name} banner`} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="capitalize">{cohort.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(cohort.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                {cohort.name}
              </h3>
              {cohort.tagline && (
                <p className="mt-1 text-muted-foreground">{cohort.tagline}</p>
              )}
            </div>

            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          </div>

          {/* Stats and sponsors */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{tracks.length} tracks</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{submissions.length} projects</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>${(totalPrize / 1000).toFixed(0)}k prizes</span>
            </div>

            {sponsors.length > 0 && (
              <div className="ml-auto flex items-center -space-x-2">
                {sponsors.slice(0, 3).map((s) => (
                  <Image key={s.id} unoptimized src={s.logo} alt={`${s.name} logo`} width={24} height={24} className="rounded-full border-2 border-background bg-background" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CohortsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [enrichedCohorts, setEnrichedCohorts] = useState<EnrichedCohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load all cohorts
        const { data: cohorts, success, error: cohortsError } = await cohortsService.list();
        if (!success) {
          setError(cohortsError || "Failed to load cohorts");
          setIsLoading(false);
          return;
        }

        const publicCohorts = cohorts.filter((c: Cohort) => c.isPublic);

        // Load tracks, sponsors, and submissions for each cohort in parallel
        const enriched = await Promise.all(
          publicCohorts.map(async (cohort: Cohort) => {
            const [tracksRes, sponsorsRes, submissionsRes] = await Promise.all([
              tracksService.getByCohort(cohort.id),
              sponsorsService.getCohortSponsors(cohort.id),
              submissionsService.getByCohort(cohort.id),
            ]);
            return {
              ...cohort,
              tracks: tracksRes.data,
              sponsors: sponsorsRes.data,
              submissions: submissionsRes.data,
            };
          })
        );

        setEnrichedCohorts(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCohorts = enrichedCohorts.filter((c) => {
    if (filter === "all") return true;
    if (filter === "completed") return c.status === "completed" || c.status === "judging";
    return c.status === filter;
  });

  const activeCohort = filteredCohorts.find((c) => c.status === "active");
  const otherCohorts = filteredCohorts.filter((c) => c.id !== activeCohort?.id);

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
        <div className="text-destructive text-lg">Failed to load cohorts</div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Typography-focused header */}
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Story Protocol</p>
          <h1 className="mt-4 text-6xl font-bold text-foreground">
            Buildathons
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-xl mx-auto">
            Where innovators come together to shape the future of programmable intellectual property
          </p>
        </div>
      </div>

      {/* Featured section */}
      {activeCohort && (
        <div className="mx-auto max-w-6xl px-4 mb-12">
          <HeroCard cohort={activeCohort} />
        </div>
      )}

      {/* Filter & List */}
      <div className="mx-auto max-w-6xl px-4 pb-16 min-h-[50vh]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            {filter === "all" ? "All Buildathons" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Buildathons`}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            {["all", "upcoming", "completed"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {otherCohorts.map((cohort) => (
            <ListCard key={cohort.id} cohort={cohort} />
          ))}
        </div>

        {filteredCohorts.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No buildathons found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === "upcoming" && "Check back soon for upcoming buildathons!"}
              {filter === "completed" && "No completed buildathons yet."}
              {filter === "all" && "No buildathons available at this time."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
