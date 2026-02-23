"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Track, SponsorOrg } from "@/types";

const MAX_TRACKS = 5;

interface StepTracksProps {
  data: {
    cohortId: string;
    trackIds: string[];
    trackDescriptions: Record<string, string>;
    submissionMode?: "team" | "solo";
  };
  onChange: (field: string, value: string | string[] | Record<string, string>) => void;
  errors: Record<string, string>;
  tracks: Track[];
  sponsorOrgs: SponsorOrg[];
}

export function StepTracks({ data, onChange, errors, tracks, sponsorOrgs }: StepTracksProps) {
  const cohortTracks = tracks.filter((t) => t.cohortId === data.cohortId);
  const atLimit = data.trackIds.length >= MAX_TRACKS;

  const toggleTrack = (trackId: string) => {
    const isSelected = data.trackIds.includes(trackId);
    if (!isSelected && atLimit) return;

    const newTrackIds = isSelected
      ? data.trackIds.filter((id) => id !== trackId)
      : [...data.trackIds, trackId];
    onChange("trackIds", newTrackIds);

    // Clear description when deselecting a track
    if (isSelected && data.trackDescriptions[trackId]) {
      const newDescs = { ...data.trackDescriptions };
      delete newDescs[trackId];
      onChange("trackDescriptions", newDescs);
    }
  };

  const handleDescriptionChange = (trackId: string, value: string) => {
    onChange("trackDescriptions", { ...data.trackDescriptions, [trackId]: value });
  };

  const getSponsorForTrack = (track: Track) => {
    if (track.sponsorOrgId) {
      return sponsorOrgs.find((s) => s.id === track.sponsorOrgId);
    }
    return null;
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Track selection */}
        {data.cohortId && cohortTracks.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label>
                Track(s) *{" "}
                <span className="text-muted-foreground font-normal">
                  (select at least one, max {MAX_TRACKS})
                </span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the track(s) your project is competing in.
                {data.trackIds.length > 0 && (
                  <span className="ml-1 font-medium">
                    {data.trackIds.length}/{MAX_TRACKS} selected
                  </span>
                )}
              </p>
            </div>
            <div className="grid gap-3">
              {cohortTracks.map((track) => {
                const sponsor = getSponsorForTrack(track);
                const isSelected = data.trackIds.includes(track.id);
                const isDisabled = !isSelected && atLimit;
                return (
                  <div key={track.id} className="space-y-0">
                    <div
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-disabled={isDisabled}
                      aria-label={`${track.name}${track.prizePool ? ` - ${track.prizePool}` : ""}`}
                      tabIndex={isDisabled ? -1 : 0}
                      onClick={() => toggleTrack(track.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleTrack(track.id);
                        }
                      }}
                      className={cn(
                        "relative rounded-lg border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        isSelected
                          ? "border-primary bg-primary/10 cursor-pointer"
                          : isDisabled
                            ? "border-border opacity-50 cursor-not-allowed"
                            : "border-border cursor-pointer hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 aria-hidden="true" className="absolute top-3 right-3 h-5 w-5 text-primary" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Trophy aria-hidden="true" className="h-5 w-5 text-prize-grand" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{track.name}</h4>
                            {track.prizePool && (
                              <Badge variant="secondary" className="text-xs">
                                {track.prizePool}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {track.description}
                          </p>
                          {sponsor && (
                            <div className="flex items-center gap-2 mt-2">
                              {sponsor.logo && (
                                <img
                                  src={sponsor.logo}
                                  alt={sponsor.name}
                                  className="h-5 w-5 rounded object-contain"
                                />
                              )}
                              <span className="text-xs text-muted-foreground">
                                Sponsored by {sponsor.name}
                              </span>
                            </div>
                          )}
                          {track.requirements && track.requirements.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Requirements:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {track.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-center gap-1">
                                    <span className="text-primary">*</span> {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Integration description for selected sponsor tracks */}
                    {isSelected && sponsor && (
                      <div className="ml-4 mt-2 mb-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          How did you integrate {sponsor.name}&apos;s technology? *
                        </Label>
                        <Textarea
                          placeholder={`Describe how your project uses ${sponsor.name}'s technology...`}
                          value={data.trackDescriptions[track.id] || ""}
                          onChange={(e) => handleDescriptionChange(track.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          rows={3}
                          className="text-sm"
                        />
                        {errors[`trackDescription_${track.id}`] && (
                          <p className="text-xs text-destructive">
                            {errors[`trackDescription_${track.id}`]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {errors.trackIds && (
              <p className="text-sm text-destructive">{errors.trackIds}</p>
            )}
          </div>
        )}

        {data.cohortId && cohortTracks.length === 0 && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              No tracks available for this cohort. Your submission will be entered into the general pool.
            </p>
          </div>
        )}

        {!data.cohortId && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Please select a cohort in the Details step to see available tracks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
