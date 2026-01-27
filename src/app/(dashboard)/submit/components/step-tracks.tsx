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
  };
  onChange: (field: string, value: string | string[]) => void;
  errors: Record<string, string>;
  cohorts: Cohort[];
  tracks: Track[];
  sponsorOrgs: SponsorOrg[];
}

export function StepTracks({ data, onChange, errors, cohorts, tracks, sponsorOrgs }: StepTracksProps) {
  const activeCohorts = cohorts.filter(
    (c) => c.status === "active" && c.isPublic
  );
  const cohortTracks = tracks.filter((t) => t.cohortId === data.cohortId);

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
        <CardTitle>Buildathon</CardTitle>
        <CardDescription>Select the cohort and track</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cohort">Cohort *</Label>
          <Select
            value={data.cohortId}
            onValueChange={(value) => {
              onChange("cohortId", value);
              onChange("trackIds", []); // Reset tracks when cohort changes
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a cohort" />
            </SelectTrigger>
            <SelectContent>
              {activeCohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cohortId && (
            <p className="text-sm text-destructive">{errors.cohortId}</p>
          )}
        </div>

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
      </CardContent>
    </Card>
  );
}
