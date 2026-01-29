"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { cohortsService, sponsorsService, tracksService } from "@/services";
import type { Cohort, CohortSponsor, Track, SponsorOrg } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trophy,
  Calendar,
  PlusCircle,
  Pencil,
  Trash2,
  Target,
} from "lucide-react";

interface SponsorCohortPageProps {
  params: Promise<{ cohortId: string }>;
}

const tierColors: Record<string, string> = {
  platinum: "bg-slate-200 text-slate-800",
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-600",
  bronze: "bg-orange-100 text-orange-800",
  community: "bg-green-100 text-green-800",
};

export default function SponsorCohortPage({ params }: SponsorCohortPageProps) {
  const { cohortId } = use(params);
  const { user } = useAuth();

  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [cohortSponsor, setCohortSponsor] = useState<CohortSponsor | null>(null);
  const [sponsorTracks, setSponsorTracks] = useState<Track[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [newTrack, setNewTrack] = useState({ name: "", prizePool: "", description: "" });
  const [showNewTrackForm, setShowNewTrackForm] = useState(false);
  const [deleteTrackTarget, setDeleteTrackTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      const sponsorResult = await sponsorsService.getOrgByUser(user.id);
      if (!sponsorResult.success || !sponsorResult.data) {
        setIsLoadingData(false);
        return;
      }

      setSponsor(sponsorResult.data);

      const [cohortResult, cohortSponsorResult, tracksResult] = await Promise.all([
        cohortsService.getById(cohortId),
        sponsorsService.getCohortSponsor(cohortId, sponsorResult.data.id),
        tracksService.getByCohort(cohortId),
      ]);

      if (cohortResult.success) setCohort(cohortResult.data);
      if (cohortSponsorResult.success && cohortSponsorResult.data) {
        setCohortSponsor(cohortSponsorResult.data);
        setDescription(cohortSponsorResult.data.description || "");
      }
      if (tracksResult.success) {
        // Filter tracks to only show this sponsor's tracks
        setSponsorTracks(tracksResult.data.filter((t) => t.sponsorOrgId === sponsorResult.data!.id));
      }

      setIsLoadingData(false);
    }
    loadData();
  }, [cohortId, user]);

  if (isLoadingData) {
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

  if (!cohort) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Cohort not found</h2>
          <p className="text-muted-foreground mt-2">
            The cohort you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sponsor/tracks">Back to Sponsor Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!cohortSponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Not Sponsoring This Cohort</h2>
          <p className="text-muted-foreground mt-2">
            {sponsor.name} is not a sponsor of {cohort.name}.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sponsor/tracks">Back to Sponsor Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveDescription = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = async () => {
    if (!newTrack.name) return;
    setNewTrack({ name: "", prizePool: "", description: "" });
    setShowNewTrackForm(false);
  };

  const handleDeleteTrack = (trackId: string) => {
    const track = sponsorTracks.find((t) => t.id === trackId);
    if (track) {
      setDeleteTrackTarget({ id: track.id, name: track.name });
    }
  };

  const confirmDeleteTrack = () => {
    if (deleteTrackTarget) {
      // TODO: Implement track deletion
      console.log("Delete track:", deleteTrackTarget.id);
      setDeleteTrackTarget(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Sponsor", href: "/sponsor/tracks" },
          { label: cohort.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sponsor/tracks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{cohort.name}</h1>
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
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                ${cohortSponsor.prizePoolContribution.toLocaleString()} contribution
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sponsor Description */}
          <Card>
            <CardHeader>
              <CardTitle>Your Sponsor Message</CardTitle>
              <CardDescription>
                Describe your sponsorship, bounty focus, or message to participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Tell participants about your company, what you're looking for, and any special requirements for your track..."
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveDescription} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Description
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Tracks</CardTitle>
                  <CardDescription>
                    Bounty tracks for this cohort
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowNewTrackForm(true)}
                  disabled={showNewTrackForm}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Track
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Track Form */}
              {showNewTrackForm && (
                <div className="rounded-lg border p-4 space-y-4 bg-muted/50">
                  <h4 className="font-medium">New Track</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="trackName">Track Name *</Label>
                      <Input
                        id="trackName"
                        value={newTrack.name}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, name: e.target.value })
                        }
                        placeholder="Best Use of..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prizePool">Prize Pool</Label>
                      <Input
                        id="prizePool"
                        value={newTrack.prizePool}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, prizePool: e.target.value })
                        }
                        placeholder="$5,000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trackDescription">Description</Label>
                    <Input
                      id="trackDescription"
                      value={newTrack.description}
                      onChange={(e) =>
                        setNewTrack({ ...newTrack, description: e.target.value })
                      }
                      placeholder="What are you looking for?"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" onClick={handleAddTrack} disabled={!newTrack.name}>
                      Add Track
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewTrackForm(false);
                        setNewTrack({ name: "", prizePool: "", description: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Track List */}
              {sponsorTracks.length === 0 && !showNewTrackForm ? (
                <div className="py-8 text-center">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Tracks Yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create a bounty track for participants to submit to.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsorTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{track.name}</h4>
                          {track.prizePool && (
                            <Badge variant="secondary">{track.prizePool}</Badge>
                          )}
                        </div>
                        {track.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {track.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTrackId(track.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDeleteTrack(track.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sponsorship Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tier</span>
                <Badge className={tierColors[cohortSponsor.tier]}>
                  {cohortSponsor.tier}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contribution</span>
                <span className="font-medium">
                  ${cohortSponsor.prizePoolContribution.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dedicated Track</span>
                <Badge variant={cohortSponsor.hasDedicatedTrack ? "default" : "outline"}>
                  {cohortSponsor.hasDedicatedTrack ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Tracks</span>
                <span className="font-medium">{sponsorTracks.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cohort Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>{formatDate(cohort.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submissions Due</span>
                <span>{formatDate(cohort.submissionDeadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Judging</span>
                <span>
                  {formatDate(cohort.judgingStart)} - {formatDate(cohort.judgingEnd)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>{formatDate(cohort.endDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" asChild>
            <Link href={`/cohorts/${cohort.slug}`}>View Public Page</Link>
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteTrackTarget} onOpenChange={(open) => !open && setDeleteTrackTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTrackTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTrack} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
