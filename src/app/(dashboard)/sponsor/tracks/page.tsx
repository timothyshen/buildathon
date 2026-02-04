"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { tracksService, cohortsService, sponsorsService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { Track, Cohort, SponsorOrg, CohortSponsor } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { getSponsorTierColor, getCohortStatusColor } from "@/lib/utils/colors";

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
  }, [user]);

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
        <p className="text-muted-foreground">
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Sponsorships</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your tracks and sponsorship details for each cohort
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorCohortLinks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorTracks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPrizePool > 0 ? `$${totalPrizePool.toLocaleString()}` : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort List */}
      {sponsorCohortLinks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Sponsorships Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You are not sponsoring any cohorts yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sponsorCohortLinks.map((cohortSponsor) => {
            const cohort = cohorts.find((c) => c.id === cohortSponsor.cohortId);
            if (!cohort) return null;

            const cohortTracks = sponsorTracks.filter((t) => t.cohortId === cohort.id);

            return (
              <Card key={cohortSponsor.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{cohort.name}</h3>
                      <Badge className={getSponsorTierColor(cohortSponsor.tier)}>
                        {cohortSponsor.tier}
                      </Badge>
                      <Badge className={getCohortStatusColor(cohort.status)}>
                        {cohort.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        ${cohortSponsor.prizePoolContribution.toLocaleString()} contribution
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {cohortTracks.length} track{cohortTracks.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Track Preview */}
                    {cohortTracks.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cohortTracks.map((track) => (
                          <Badge key={track.id} variant="outline">
                            {track.name}
                            {track.prizePool && (
                              <span className="ml-1 text-muted-foreground">
                                ({track.prizePool})
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button asChild>
                    <Link href={`/sponsor/cohorts/${cohort.id}`}>
                      Manage
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
