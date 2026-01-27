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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  FileText,
  GraduationCap,
  Target,
  Clock,
  CheckCircle,
  Eye,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import type { SponsorOrg, CohortSponsor, Cohort, Track, Submission, Workshop } from "@/types";
import { getSubmissionStatusColor, getCohortStatusColor, getWorkshopStatusColor } from "@/lib/utils/colors";

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
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // First, get the sponsor org for this user
      const sponsorResult = await sponsorsService.getOrgByUser(user.id);

      if (!sponsorResult.success || !sponsorResult.data) {
        setIsLoading(false);
        return;
      }

      const sponsorOrg = sponsorResult.data;
      setSponsor(sponsorOrg);

      // Load all related data in parallel
      const [
        cohortSponsorsResult,
        cohortsResult,
        tracksResult,
        submissionsResult,
        workshopsResult,
      ] = await Promise.all([
        sponsorsService.getSponsorCohorts(sponsorOrg.id),
        cohortsService.list(),
        tracksService.getBySponsor(sponsorOrg.id),
        submissionsService.list(),
        workshopsService.getBySponsor(sponsorOrg.id),
      ]);

      if (cohortSponsorsResult.success) setSponsorCohorts(cohortSponsorsResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (tracksResult.success) setTracks(tracksResult.data);
      if (submissionsResult.success) setSubmissions(submissionsResult.data);
      if (workshopsResult.success) setWorkshops(workshopsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

  if (isLoading) {
    return <Loading />;
  }

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Organization Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
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
  const sponsorTrackIds = sponsorTracks.map((t) => t.id);

  // Get submissions to sponsor tracks (review queue)
  const trackSubmissions = submissions.filter(
    (s) =>
      (s.trackId && sponsorTrackIds.includes(s.trackId)) ||
      (s.trackIds && s.trackIds.some((id) => sponsorTrackIds.includes(id)))
  );
  const pendingSubmissions = trackSubmissions.filter((s) => s.status === "submitted" || s.status === "under_review");
  const reviewedSubmissions = trackSubmissions.filter((s) => s.status === "accepted" || s.status === "winner");

  // Get sponsor's workshops
  const sponsorWorkshops = workshops;
  const publishedWorkshops = sponsorWorkshops.filter((w) => w.status === "published");
  const draftWorkshops = sponsorWorkshops.filter((w) => w.status === "draft");

  // Calculate total contribution
  const totalContribution = sponsorCohorts.reduce((sum, sc) => sum + sc.prizePoolContribution, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {sponsor.logo && (
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-12 w-12 rounded-lg object-contain bg-muted"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{sponsor.name}</h1>
              <p className="text-muted-foreground">Sponsor Dashboard</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" asChild>
            <Link href="/sponsor/tracks">
              <Target className="mr-2 h-4 w-4" />
              Manage Tracks
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sponsor/workshops">
              <GraduationCap className="mr-2 h-4 w-4" />
              Manage Workshops
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-warning-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">Submissions to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Track Submissions</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">Total to your tracks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Workshops</CardTitle>
            <GraduationCap className="h-4 w-4 text-category-design" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedWorkshops.length}</div>
            <p className="text-xs text-muted-foreground">{draftWorkshops.length} drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalContribution.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total contribution</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>Submissions to your sponsored tracks</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/sponsor/reviews">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-success-foreground" />
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No pending submissions to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.slice(0, 5).map((submission) => {
                const track = tracks.find((t) => t.id === submission.trackId);
                return (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <h3 className="font-semibold">{submission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {submission.tagline || submission.team?.name}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{track?.name || "Open Track"}</Badge>
                        <Badge className={getSubmissionStatusColor(submission.status)}>
                          {submission.status === "submitted" ? "New" : "Under Review"}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/submissions/${submission.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Your Tracks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Tracks</CardTitle>
                <CardDescription>Bounty tracks you sponsor</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sponsor/tracks">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sponsorTracks.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No tracks created yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sponsorTracks.slice(0, 4).map((track) => {
                  const cohort = cohorts.find((c) => c.id === track.cohortId);
                  const submissionCount = trackSubmissions.filter(
                    (s) => s.trackId === track.id || s.trackIds?.includes(track.id)
                  ).length;
                  return (
                    <div key={track.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{track.name}</p>
                        <p className="text-xs text-muted-foreground">{cohort?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{track.prizePool || "-"}</p>
                        <p className="text-xs text-muted-foreground">{submissionCount} submissions</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Workshops */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Workshops</CardTitle>
                <CardDescription>Learning content you've created</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sponsor/workshops">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sponsorWorkshops.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No workshops created yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sponsorWorkshops.slice(0, 4).map((workshop) => (
                  <div key={workshop.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground">{workshop.category}</p>
                    </div>
                    <Badge className={getWorkshopStatusColor(workshop.status)}>
                      {workshop.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Cohorts */}
      {activeCohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Cohorts</CardTitle>
            <CardDescription>Buildathons you are sponsoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeCohorts.map((cohort) => {
                const cohortSponsor = sponsorCohorts.find((sc) => sc.cohortId === cohort.id);
                return (
                  <div key={cohort.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{cohort.name}</h3>
                      <Badge className={getCohortStatusColor(cohort.status)}>
                        {cohort.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Tier: <span className="capitalize font-medium text-foreground">{cohortSponsor?.tier}</span></p>
                      <p>Contribution: <span className="font-medium text-foreground">${cohortSponsor?.prizePoolContribution.toLocaleString()}</span></p>
                      {cohortSponsor?.hasDedicatedTrack && (
                        <div className="flex items-center gap-1 mt-2">
                          <Trophy className="h-3 w-3 text-prize-grand" />
                          <span className="text-xs">Has dedicated track</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full mt-3" size="sm" asChild>
                      <Link href={`/sponsor/cohorts/${cohort.id}`}>Manage Sponsorship</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
