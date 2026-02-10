"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  sponsorsService,
  cohortsService,
  tracksService,
  submissionsService,
  workshopsService,
} from "@/services";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Target,
  CheckCircle,
  ChevronRight,
  Building2,
  Loader2,
} from "lucide-react";
import type { SponsorOrg, CohortSponsor, Cohort, Track, Submission, Workshop } from "@/types";

export function SponsorDashboard() {
  const { user } = useAuth();
  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [sponsorCohorts, setSponsorCohorts] = useState<CohortSponsor[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.sponsorOrgId) {
        setIsLoading(false);
        return;
      }

      const orgId = user.sponsorOrgId;

      // Load all data in a single parallel batch using sponsorOrgId from auth context
      const [
        sponsorResult,
        cohortSponsorsResult,
        cohortsResult,
        tracksResult,
        submissionsResult,
        workshopsResult,
      ] = await Promise.all([
        sponsorsService.getOrgById(orgId),
        sponsorsService.getSponsorCohorts(orgId),
        cohortsService.list(),
        tracksService.getBySponsor(orgId),
        submissionsService.getByTrackSponsor(orgId),
        workshopsService.getBySponsor(orgId),
      ]);

      if (sponsorResult.success) setSponsor(sponsorResult.data);
      if (cohortSponsorsResult.success) setSponsorCohorts(cohortSponsorsResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (tracksResult.success) setTracks(tracksResult.data);
      if (submissionsResult.success) setSubmissions(submissionsResult.data);
      if (workshopsResult.success) setWorkshops(workshopsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [user?.sponsorOrgId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-3 text-sm font-medium">No Organization Found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You are not associated with a sponsor organization.
          </p>
        </div>
      </div>
    );
  }

  // Get sponsor's cohort participation
  const activeCohortIds = sponsorCohorts.map((sc) => sc.cohortId);
  const activeCohorts = cohorts.filter(
    (c) => activeCohortIds.includes(c.id) && (c.status === "active" || c.status === "judging")
  );

  // Get sponsor's tracks
  const sponsorTracks = tracks;

  // Submissions are already scoped to sponsor tracks via getByTrackSponsor
  const trackSubmissions = submissions;
  const pendingSubmissions = trackSubmissions.filter((s) => s.status === "submitted" || s.status === "under_review");

  // Get sponsor's workshops
  const sponsorWorkshops = workshops;
  const publishedWorkshops = sponsorWorkshops.filter((w) => w.status === "published");

  // Calculate total contribution
  const totalContribution = sponsorCohorts.reduce((sum, sc) => sum + sc.prizePoolContribution, 0);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {sponsor.logo && (
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="h-10 w-10 rounded-lg object-contain bg-muted"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{sponsor.name}</h1>
            <p className="text-sm text-muted-foreground">Sponsor Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/sponsor/tracks">
              <Target className="mr-1.5 h-3.5 w-3.5" />
              Tracks
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/sponsor/workshops">
              Workshops
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {pendingSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending Reviews</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {trackSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Track Submissions</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {publishedWorkshops.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Workshops</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-violet-600">
            ${totalContribution.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Prize Pool</div>
        </div>
      </div>

      {/* Review Queue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Review Queue
          </h2>
          {pendingSubmissions.length > 0 && (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/sponsor/reviews">View all</Link>
            </Button>
          )}
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs mt-1">No pending submissions to review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingSubmissions.slice(0, 5).map((submission) => {
              const track = tracks.find((t) => t.id === submission.trackId);
              return (
                <Link
                  key={submission.id}
                  href={`/submissions/${submission.id}`}
                  className="flex items-center justify-between rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{submission.title}</span>
                    {submission.tagline && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {submission.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {submission.team?.name || "Solo"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">&middot;</span>
                      <span className="text-[11px] text-muted-foreground">
                        {track?.name || "Open Track"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Two Column Layout */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Your Tracks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Your Tracks
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/sponsor/tracks">View all</Link>
            </Button>
          </div>

          {sponsorTracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No tracks created yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sponsorTracks.slice(0, 4).map((track) => {
                const cohort = cohorts.find((c) => c.id === track.cohortId);
                const submissionCount = trackSubmissions.filter(
                  (s) => s.trackId === track.id || s.trackIds?.includes(track.id)
                ).length;
                return (
                  <div key={track.id} className="flex items-center justify-between rounded-xl border py-3 px-4">
                    <div>
                      <p className="text-sm font-medium">{track.name}</p>
                      <p className="text-[11px] text-muted-foreground">{cohort?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums">{track.prizePool || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{submissionCount} submissions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Your Workshops */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Your Workshops
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/sponsor/workshops">View all</Link>
            </Button>
          </div>

          {sponsorWorkshops.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No workshops created yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sponsorWorkshops.slice(0, 4).map((workshop) => (
                <div key={workshop.id} className="flex items-center justify-between rounded-xl border py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{workshop.title}</p>
                    <p className="text-[11px] text-muted-foreground">{workshop.category}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground capitalize">{workshop.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Active Cohorts */}
      {activeCohorts.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            Active Cohorts
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeCohorts.map((cohort) => {
              const cohortSponsor = sponsorCohorts.find((sc) => sc.cohortId === cohort.id);
              return (
                <div key={cohort.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{cohort.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        cohort.status === "active" ? "bg-emerald-500" : "bg-violet-500"
                      }`} />
                      <span className="text-[11px] text-muted-foreground capitalize">{cohort.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <p>Tier: <span className="capitalize font-medium text-foreground">{cohortSponsor?.tier}</span></p>
                    <p>Contribution: <span className="font-mono font-medium tabular-nums text-foreground">${cohortSponsor?.prizePoolContribution.toLocaleString()}</span></p>
                    {cohortSponsor?.hasDedicatedTrack && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>Has dedicated track</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" size="sm" asChild>
                    <Link href={`/sponsor/cohorts/${cohort.id}`}>Manage Sponsorship</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
