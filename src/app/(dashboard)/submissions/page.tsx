"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService } from "@/services";
import type { Submission } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, ExternalLink, Github, Loader2 } from "lucide-react";

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, success } = await submissionsService.getByUser(user.id);
      if (success) setUserSubmissions(data);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "winner":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "under_review":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
                    <div className="flex items-center gap-2">
                      <CardTitle>{submission.title}</CardTitle>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
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
