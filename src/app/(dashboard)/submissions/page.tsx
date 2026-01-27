"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, tracksService, cohortsService } from "@/services";
import type { Submission, Track, Cohort } from "@/types";
import { getSubmissionStatusColor } from "@/lib/utils/status";
import { getSubmissionPrizes, type PrizeInfo } from "@/lib/prize-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrizeBadges } from "@/components/ui/prize-badges";
import { PlusCircle, FileText, ExternalLink, Github, Loader2 } from "lucide-react";

interface EnrichedSubmission extends Submission {
  prizes: PrizeInfo[];
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [userSubmissions, setUserSubmissions] = useState<EnrichedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, success } = await submissionsService.getByUser(user.id);
      if (!success) {
        setIsLoading(false);
        return;
      }

      // Load cohorts and tracks to compute prizes
      const cohortIds = [...new Set(data.map((s: Submission) => s.cohortId).filter(Boolean))];
      const [cohortsResult, ...trackResults] = await Promise.all([
        cohortsService.list(),
        ...cohortIds.map((id) => tracksService.getByCohort(id as string)),
      ]);

      const cohortMap = new Map<string, Cohort>(
        cohortsResult.data.map((c: Cohort) => [c.id, c])
      );
      const trackMap = new Map<string, Track[]>();
      cohortIds.forEach((id, index) => {
        trackMap.set(id as string, trackResults[index].data);
      });

      // Enrich submissions with prizes
      const enriched: EnrichedSubmission[] = data.map((submission: Submission) => {
        const cohort = submission.cohortId ? cohortMap.get(submission.cohortId) : undefined;
        const tracks = submission.cohortId ? (trackMap.get(submission.cohortId) || []) : [];
        const track = tracks.find((t) => t.id === submission.trackId);
        const prizes = getSubmissionPrizes(submission, cohort, track);

        return {
          ...submission,
          prizes,
        };
      });

      setUserSubmissions(enriched);
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


  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your buildathon project submissions
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Submission
          </Link>
        </Button>
      </div>

      {userSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No submissions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first buildathon submission to get started.
            </p>
            <Button asChild className="mt-4">
              <Link href="/submit">Create Submission</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {userSubmissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle>{submission.title}</CardTitle>
                      <Badge className={getSubmissionStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      {submission.prizes.length > 0 && (
                        <PrizeBadges prizes={submission.prizes} maxVisible={3} size="sm" />
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {submission.tagline}
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/submissions/${submission.id}`}>
                      {submission.status === "draft" ? "Edit" : "View"}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {submission.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {submission.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Cohort: <strong>{submission.cohort?.name}</strong>
                    </span>
                    {submission.track && (
                      <span>
                        Track: <strong>{submission.track.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {submission.demoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={submission.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Demo
                        </a>
                      </Button>
                    )}
                    {submission.repoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={submission.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="mr-2 h-4 w-4" />
                          Repo
                        </a>
                      </Button>
                    )}
                  </div>

                  {submission.ipAssetId && (
                    <div className="rounded-lg bg-green-50 p-3">
                      <p className="text-sm font-medium text-green-800">
                        IP Registered on Story Protocol
                      </p>
                      <p className="text-xs text-green-600">
                        Asset ID: {submission.ipAssetId}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
