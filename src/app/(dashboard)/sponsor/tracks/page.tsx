"use client";

import Link from "next/link";
import { mockTracks, mockCohorts, mockSponsorOrgs, mockCohortSponsors } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Calendar, ArrowRight } from "lucide-react";

const tierColors: Record<string, string> = {
  platinum: "bg-slate-200 text-slate-800",
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-600",
  bronze: "bg-orange-100 text-orange-800",
  community: "bg-green-100 text-green-800",
};

export default function SponsorTracksPage() {
  const { user } = useAuth();

  const sponsor = mockSponsorOrgs.find((s) => s.id === user?.sponsorOrgId);
  const sponsorCohortLinks = mockCohortSponsors.filter((cs) => cs.sponsorOrgId === sponsor?.id);
  const sponsorTracks = mockTracks.filter((t) => t.sponsorOrgId === sponsor?.id);

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
            const cohort = mockCohorts.find((c) => c.id === cohortSponsor.cohortId);
            if (!cohort) return null;

            const cohortTracks = sponsorTracks.filter((t) => t.cohortId === cohort.id);

            return (
              <Card key={cohortSponsor.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{cohort.name}</h3>
                      <Badge className={tierColors[cohortSponsor.tier]}>
                        {cohortSponsor.tier}
                      </Badge>
                      <Badge
                        className={
                          cohort.status === "active"
                            ? "bg-green-100 text-green-800"
                            : cohort.status === "judging"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
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
