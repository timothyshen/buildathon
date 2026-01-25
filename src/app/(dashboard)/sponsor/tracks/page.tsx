"use client";

import { useState } from "react";
import { mockTracks, mockCohorts, mockSponsorOrgs, mockCohortSponsors } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { TrackForm } from "@/components/sponsor/tracks/track-form";
import type { Track } from "@/types";
import type { TrackFormData } from "@/lib/schemas";

export default function SponsorTracksPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | undefined>();

  const sponsor = mockSponsorOrgs.find((s) => s.id === user?.sponsorOrgId);
  const sponsorTracks = mockTracks.filter((t) => t.sponsorOrgId === sponsor?.id);
  const sponsorCohortIds = mockCohortSponsors
    .filter((cs) => cs.sponsorOrgId === sponsor?.id)
    .map((cs) => cs.cohortId);

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setIsFormOpen(true);
  };

  const handleDelete = (track: Track) => {
    if (confirm(`Delete track "${track.name}"?`)) {
      console.log("Delete:", track.id);
    }
  };

  const handleSubmit = (data: TrackFormData) => {
    console.log("Track form submitted:", data);
    setEditingTrack(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingTrack(undefined);
  };

  const getCohortName = (cohortId: string) => {
    return mockCohorts.find((c) => c.id === cohortId)?.name || "Unknown";
  };

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tracks</h1>
          <p className="mt-2 text-muted-foreground">
            Manage bounty tracks for {sponsor.name}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Track
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
              {sponsorTracks.map((t) => t.prizePool || "$0").join(" + ") || "$0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorCohortIds.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Prize Pool</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorTracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{track.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {track.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCohortName(track.cohortId)}</Badge>
                  </TableCell>
                  <TableCell>{track.prizePool || "-"}</TableCell>
                  <TableCell>{track.requirements?.length || 0} requirements</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(track)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(track)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sponsorTracks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No tracks yet. Create a track to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TrackForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        track={editingTrack}
        onSubmit={handleSubmit}
        allowedCohortIds={sponsorCohortIds}
      />
    </div>
  );
}
