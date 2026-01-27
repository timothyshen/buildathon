"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { Pencil, ExternalLink } from "lucide-react";
import type { Cohort, Track } from "@/types";

interface SubmissionData {
  title: string;
  tagline: string;
  description: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  presentationUrl: string;
  techStack: string[];
  builtWithStory: boolean;
  cohortId: string;
  trackIds: string[];
  licenseType: string;
}

interface StepReviewProps {
  data: SubmissionData;
  onEdit: (step: number) => void;
  cohorts: Cohort[];
  tracks: Track[];
}

export function StepReview({ data, onEdit, cohorts, tracks }: StepReviewProps) {
  const cohort = cohorts.find((c) => c.id === data.cohortId);
  const selectedTracks = tracks.filter((t) => data.trackIds.includes(t.id));

  const links = [
    { label: "Demo", url: data.demoUrl },
    { label: "Repository", url: data.repoUrl },
    { label: "Video", url: data.videoUrl },
    { label: "Presentation", url: data.presentationUrl },
  ].filter((l) => l.url);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Project Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)} aria-label="Edit project details">
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{data.title || "—"}</p>
          </div>
          {data.tagline && (
            <div>
              <p className="text-sm text-muted-foreground">Tagline</p>
              <p>{data.tagline}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <div className="rounded-lg bg-muted p-3">
              <RichTextDisplay content={data.description} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Links & Tech</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)} aria-label="Edit links and tech stack">
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.label} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24">{link.label}:</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-600 hover:underline flex items-center gap-1"
                    aria-label={`${link.label}: ${link.url} (opens in new tab)`}
                  >
                    {link.url}
                    <ExternalLink aria-hidden="true" className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No links added</p>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Tech Stack</p>
            {data.techStack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No technologies added</p>
            )}
          </div>

          {data.builtWithStory && (
            <Badge className="bg-violet-100 text-violet-700">
              Built with Story Protocol
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cohort & Tracks</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(3)} aria-label="Edit cohort and tracks">
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Cohort</p>
            <p className="font-medium">{cohort?.name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tracks</p>
            {selectedTracks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTracks.map((track) => (
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
            ) : (
              <p className="text-sm text-muted-foreground">General pool</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
