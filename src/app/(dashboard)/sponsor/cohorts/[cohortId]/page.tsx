"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { cohortsService, sponsorsService, tracksService } from "@/services";
import type { Cohort, CohortSponsor, Track, SponsorOrg } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Target,
} from "lucide-react";

interface SponsorCohortPageProps {
  params: Promise<{ cohortId: string }>;
}

function formatCurrency(value: string): string {
  // Strip everything except digits
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  // Format with commas and prepend $
  return "$" + Number(digits).toLocaleString("en-US");
}

export default function SponsorCohortPage({ params }: SponsorCohortPageProps) {
  const { cohortId } = use(params);
  const { user } = useAuth();

  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [cohortSponsor, setCohortSponsor] = useState<CohortSponsor | null>(null);
  const [sponsorTracks, setSponsorTracks] = useState<Track[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [description, setDescription] = useState("");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTrack, setEditTrack] = useState({ name: "", prizePool: "", description: "" });
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
        <p className="text-sm text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium">Cohort not found</p>
        <p className="text-xs text-muted-foreground mt-1">
          The cohort you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-4">
          <Link href="/sponsor/tracks">Back to Sponsorships</Link>
        </Button>
      </div>
    );
  }

  if (!cohortSponsor) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium">Not Sponsoring This Cohort</p>
        <p className="text-xs text-muted-foreground mt-1">
          {sponsor.name} is not a sponsor of {cohort.name}.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-4">
          <Link href="/sponsor/tracks">Back to Sponsorships</Link>
        </Button>
      </div>
    );
  }

  const handleSaveDescription = async () => {
    setIsLoading(true);
    try {
      const result = await sponsorsService.updateCohortSponsor(cohortSponsor.id, {
        description,
      });
      if (!result.success) {
        toast.error(result.error || "Failed to save description");
        return;
      }
      toast.success("Description saved");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = async () => {
    if (!newTrack.name || isMutating) return;
    setIsMutating(true);
    try {
      const result = await tracksService.create({
        cohortId,
        sponsorOrgId: sponsor.id,
        name: newTrack.name,
        description: newTrack.description || "",
        prizePool: newTrack.prizePool || undefined,
        requirements: [],
        sponsorName: sponsor.name,
        sponsorLogo: sponsor.logo,
      });
      if (!result.success) {
        toast.error(result.error || "Failed to create track");
        return;
      }
      setSponsorTracks((prev) => [...prev, result.data]);
      setNewTrack({ name: "", prizePool: "", description: "" });
      setShowNewTrackForm(false);
      toast.success("Track created");
    } finally {
      setIsMutating(false);
    }
  };

  const startEditingTrack = (trackId: string) => {
    const track = sponsorTracks.find((t) => t.id === trackId);
    if (track) {
      setEditTrack({ name: track.name, prizePool: track.prizePool || "", description: track.description || "" });
      setEditingTrackId(trackId);
    }
  };

  const handleSaveTrack = async () => {
    if (!editingTrackId || !editTrack.name || isMutating) return;
    setIsMutating(true);
    try {
      const result = await tracksService.update(editingTrackId, {
        name: editTrack.name,
        description: editTrack.description || "",
        prizePool: editTrack.prizePool || undefined,
      });
      if (!result.success) {
        toast.error(result.error || "Failed to update track");
        return;
      }
      setSponsorTracks((prev) => prev.map((t) => (t.id === editingTrackId ? result.data : t)));
      setEditingTrackId(null);
      toast.success("Track updated");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    const track = sponsorTracks.find((t) => t.id === trackId);
    if (track) {
      setDeleteTrackTarget({ id: track.id, name: track.name });
    }
  };

  const confirmDeleteTrack = async () => {
    if (!deleteTrackTarget || isMutating) return;
    setIsMutating(true);
    try {
      const result = await tracksService.delete(deleteTrackTarget.id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete track");
        setDeleteTrackTarget(null);
        return;
      }
      setSponsorTracks((prev) => prev.filter((t) => t.id !== deleteTrackTarget.id));
      setDeleteTrackTarget(null);
      toast.success("Track deleted");
    } finally {
      setIsMutating(false);
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
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Sponsorships", href: "/sponsor/tracks" },
          { label: cohort.name },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/sponsor/tracks"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{cohort.name}</h1>
            <span className="capitalize text-sm text-muted-foreground">{cohortSponsor.tier}</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${
                cohort.status === "active" ? "bg-emerald-500"
                  : cohort.status === "judging" ? "bg-violet-500"
                  : "bg-muted-foreground"
              }`} />
              <span className="text-xs text-muted-foreground capitalize">{cohort.status}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(cohort.startDate)} – {formatDate(cohort.endDate)} &middot; ${cohortSponsor.prizePoolContribution.toLocaleString()} contribution
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sponsor Description */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">
              Your Sponsor Message
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Describe your sponsorship, bounty focus, or message to participants
            </p>
            <div className="rounded-xl border p-5 space-y-4">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Tell participants about your company, what you're looking for, and any special requirements for your track..."
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveDescription}
                  disabled={isLoading}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Description"
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Tracks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Your Tracks
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTrackForm(true)}
                disabled={showNewTrackForm}
                className="text-muted-foreground hover:text-foreground"
              >
                + Add Track
              </Button>
            </div>

            <div className="space-y-2">
              {/* New Track Form */}
              {showNewTrackForm && (
                <div className="rounded-xl border p-4 space-y-4">
                  <p className="text-xs font-medium">New Track</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="trackName" className="text-xs text-muted-foreground">Track Name *</Label>
                      <Input
                        id="trackName"
                        value={newTrack.name}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, name: e.target.value })
                        }
                        placeholder="Best Use of..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="prizePool" className="text-xs text-muted-foreground">Prize Pool</Label>
                      <Input
                        id="prizePool"
                        value={newTrack.prizePool}
                        onChange={(e) =>
                          setNewTrack({ ...newTrack, prizePool: formatCurrency(e.target.value) })
                        }
                        placeholder="$5,000"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trackDescription" className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      id="trackDescription"
                      value={newTrack.description}
                      onChange={(e) =>
                        setNewTrack({ ...newTrack, description: e.target.value })
                      }
                      placeholder="What are you looking for?"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddTrack}
                      disabled={!newTrack.name || isMutating}
                      className="bg-foreground text-background hover:bg-foreground/90"
                    >
                      {isMutating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Track"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
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
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No Tracks Yet</p>
                  <p className="text-xs mt-1">
                    Create a bounty track for participants to submit to.
                  </p>
                </div>
              ) : (
                sponsorTracks.map((track) =>
                  editingTrackId === track.id ? (
                    <div key={track.id} className="rounded-xl border p-4 space-y-4">
                      <p className="text-xs font-medium">Edit Track</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`editName-${track.id}`} className="text-xs text-muted-foreground">Track Name *</Label>
                          <Input
                            id={`editName-${track.id}`}
                            value={editTrack.name}
                            onChange={(e) => setEditTrack({ ...editTrack, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`editPrize-${track.id}`} className="text-xs text-muted-foreground">Prize Pool</Label>
                          <Input
                            id={`editPrize-${track.id}`}
                            value={editTrack.prizePool}
                            onChange={(e) => setEditTrack({ ...editTrack, prizePool: formatCurrency(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`editDesc-${track.id}`} className="text-xs text-muted-foreground">Description</Label>
                        <Input
                          id={`editDesc-${track.id}`}
                          value={editTrack.description}
                          onChange={(e) => setEditTrack({ ...editTrack, description: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveTrack}
                          disabled={!editTrack.name || isMutating}
                          className="bg-foreground text-background hover:bg-foreground/90"
                        >
                          {isMutating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTrackId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={track.id}
                      className="flex items-center justify-between rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{track.name}</span>
                          {track.prizePool && (
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">
                              {track.prizePool}
                            </span>
                          )}
                        </div>
                        {track.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {track.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isMutating}
                          onClick={() => startEditingTrack(track.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isMutating}
                          onClick={() => handleDeleteTrack(track.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sponsorship Details */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Sponsorship Details
            </h2>
            <div className="rounded-xl border p-5 divide-y">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs text-muted-foreground">Tier</span>
                <span className="text-sm font-medium capitalize">{cohortSponsor.tier}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">Contribution</span>
                <span className="font-mono text-sm font-medium tabular-nums">
                  ${cohortSponsor.prizePoolContribution.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">Dedicated Track</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    cohortSponsor.hasDedicatedTrack ? "bg-emerald-500" : "bg-muted-foreground"
                  }`} />
                  <span className="text-sm">{cohortSponsor.hasDedicatedTrack ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-muted-foreground">Your Tracks</span>
                <span className="font-mono text-sm font-medium tabular-nums">{sponsorTracks.length}</span>
              </div>
            </div>
          </section>

          {/* Cohort Timeline */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Cohort Timeline
            </h2>
            <div className="rounded-xl border p-5 divide-y text-sm">
              <div className="flex justify-between pb-3">
                <span className="text-xs text-muted-foreground">Start</span>
                <span>{formatDate(cohort.startDate)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-xs text-muted-foreground">Submissions Due</span>
                <span>{formatDate(cohort.submissionDeadline)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-xs text-muted-foreground">Judging</span>
                <span>
                  {formatDate(cohort.judgingStart)} – {formatDate(cohort.judgingEnd)}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-xs text-muted-foreground">End</span>
                <span>{formatDate(cohort.endDate)}</span>
              </div>
            </div>
          </section>

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
            <AlertDialogAction onClick={confirmDeleteTrack} disabled={isMutating} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
