"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cohort, Track, SponsorOrg } from "@/types";

interface StepTracksProps {
  data: {
    cohortId: string;
    trackIds: string[];
    submissionMode?: "team" | "solo";
  };
  onChange: (field: string, value: string | string[]) => void;
  errors: Record<string, string>;
  cohorts: Cohort[];
  tracks: Track[];
  sponsorOrgs: SponsorOrg[];
}

export function StepTracks({ data, onChange, errors, cohorts, tracks, sponsorOrgs }: StepTracksProps) {
  const cohortTracks = tracks.filter((t) => t.cohortId === data.cohortId);
  const cohort = cohorts.find((c) => c.id === data.cohortId);
  const isTeamMode = data.submissionMode === "team";

  const handleCohortChange = (cohortId: string) => {
    onChange("cohortId", cohortId);
    // Clear track selections when cohort changes
    onChange("trackIds", []);
  };

  const toggleTrack = (trackId: string) => {
    const newTrackIds = data.trackIds.includes(trackId)
      ? data.trackIds.filter((id) => id !== trackId)
      : [...data.trackIds, trackId];
    onChange("trackIds", newTrackIds);
  };

  const getSponsorForTrack = (track: Track) => {
    if (track.sponsorOrgId) {
      return sponsorOrgs.find((s) => s.id === track.sponsorOrgId);
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracks</CardTitle>
        <CardDescription>Select the cohort and tracks for your submission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cohort selector */}
        <div className="space-y-2">
          <Label htmlFor="cohort-select">Cohort *</Label>
          {isTeamMode ? (
            // Team mode: cohort is tied to team, show read-only
            cohort ? (
              <p className="text-sm font-medium">{cohort.name}</p>
            ) : (
              <p className="text-sm text-amber-600">
                Please select a team in the Details step first.
              </p>
            )
          ) : (
            // Solo mode: allow changing cohort
            <Select
              value={data.cohortId}
              onValueChange={handleCohortChange}
            >
              <SelectTrigger id="cohort-select">
                <SelectValue placeholder="Select a cohort" />
              </SelectTrigger>
              <SelectContent>
                {cohorts
                  .filter((c) => c.status === "active")
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {errors.cohortId && (
            <p className="text-sm text-destructive">{errors.cohortId}</p>
          )}
        </div>

        {/* Track selection */}
        {data.cohortId && cohortTracks.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label>
                Track(s) *{" "}
                <span className="text-muted-foreground font-normal">
                  (select at least one)
                </span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the track(s) your project is competing in. You can select multiple tracks.
              </p>
            </div>
            <div className="grid gap-3">
              {cohortTracks.map((track) => {
                const sponsor = getSponsorForTrack(track);
                const isSelected = data.trackIds.includes(track.id);
                return (
                  <div
                    key={track.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`${track.name}${track.prizePool ? ` - ${track.prizePool}` : ""}`}
                    tabIndex={0}
                    onClick={() => toggleTrack(track.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTrack(track.id);
                      }
                    }}
                    className={cn(
                      "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border"
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
              Please select a cohort to see available tracks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
