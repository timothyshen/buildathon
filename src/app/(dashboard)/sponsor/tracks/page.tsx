"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { tracksService, cohortsService, sponsorsService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { Track, Cohort, SponsorOrg, CohortSponsor } from "@/types";
import { Button } from "@/components/ui/button";
import { Target, ChevronRight, Loader2 } from "lucide-react";

export default function SponsorTracksPage() {
  const { user } = useAuth();

  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [sponsorCohortLinks, setSponsorCohortLinks] = useState<CohortSponsor[]>([]);
  const [sponsorTracks, setSponsorTracks] = useState<Track[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const sponsorResult = await sponsorsService.getOrgByUser(user.id);
      if (!sponsorResult.success || !sponsorResult.data) {
        setIsLoading(false);
        return;
      }

      setSponsor(sponsorResult.data);

      const [cohortLinksResult, tracksResult, cohortsResult] = await Promise.all([
        sponsorsService.getSponsorCohorts(sponsorResult.data.id),
        tracksService.getBySponsor(sponsorResult.data.id),
        cohortsService.list(),
      ]);

      if (cohortLinksResult.success) setSponsorCohortLinks(cohortLinksResult.data);
      if (tracksResult.success) setSponsorTracks(tracksResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

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
        <p className="text-sm text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  // Calculate total prize pool
  const totalPrizePool = sponsorTracks.reduce((sum, track) => {
    const amount = track.prizePool?.replace(/[^0-9]/g, "") || "0";
    return sum + parseInt(amount, 10);
  }, 0);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Sponsorships</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your tracks and sponsorship details for each cohort
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {sponsorCohortLinks.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Cohorts</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {sponsorTracks.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Tracks</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {totalPrizePool > 0 ? `$${totalPrizePool.toLocaleString()}` : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total Prize Pool</div>
        </div>
      </div>

      {/* Cohort List */}
      {sponsorCohortLinks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No Sponsorships Yet</p>
          <p className="text-xs mt-1">You are not sponsoring any cohorts yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sponsorCohortLinks.map((cohortSponsor) => {
            const cohort = cohorts.find((c) => c.id === cohortSponsor.cohortId);
            if (!cohort) return null;

            const cohortTracks = sponsorTracks.filter((t) => t.cohortId === cohort.id);

            return (
              <Link
                key={cohortSponsor.id}
                href={`/sponsor/cohorts/${cohort.id}`}
                className="flex items-center justify-between rounded-xl border p-5 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium">{cohort.name}</span>
                    <span className="capitalize text-xs text-muted-foreground">{cohortSponsor.tier}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        cohort.status === "active" ? "bg-emerald-500"
                          : cohort.status === "judging" ? "bg-violet-500"
                          : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">{cohort.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{formatDate(cohort.startDate)} – {formatDate(cohort.endDate)}</span>
                    <span className="hidden md:inline">&middot;</span>
                    <span>${cohortSponsor.prizePoolContribution.toLocaleString()} contribution</span>
                    <span className="hidden md:inline">&middot;</span>
                    <span>{cohortTracks.length} track{cohortTracks.length !== 1 ? "s" : ""}</span>
                  </div>

                  {cohortTracks.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                      {cohortTracks.map((t) => `${t.name}${t.prizePool ? ` (${t.prizePool})` : ""}`).join(", ")}
                    </p>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
