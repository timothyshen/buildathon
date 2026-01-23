"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { mockCohorts, mockSubmissions, mockTeams } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Trophy, Clock } from "lucide-react";

export function ParticipantDashboard() {
  const { user } = useAuth();

  // Get user's submissions
  const userSubmissions = mockSubmissions.filter((s) =>
    s.team?.members.some((m) => m.userId === user?.id)
  );

  // Get active cohorts
  const activeCohorts = mockCohorts.filter((c) => c.status === "active" && c.isPublic);
  const upcomingCohorts = mockCohorts.filter((c) => c.status === "upcoming" && c.isPublic);

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s what&apos;s happening with your buildathon journey.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              {userSubmissions.filter((s) => s.status === "submitted").length} submitted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCohorts.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingCohorts.length} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wins</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userSubmissions.filter((s) => s.status === "winner").length}
            </div>
            <p className="text-xs text-muted-foreground">Keep building!</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Cohorts */}
      {activeCohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Buildathons</CardTitle>
            <CardDescription>Join now and start building!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeCohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-semibold">{cohort.name}</h3>
                    <p className="text-sm text-muted-foreground">{cohort.tagline}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Submissions due:{" "}
                      {new Date(cohort.submissionDeadline).toLocaleDateString()}
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/submit?cohort=${cohort.id}`}>Submit Project</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Submissions</CardTitle>
            <CardDescription>Your buildathon projects</CardDescription>
          </div>
          <Button asChild>
            <Link href="/submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Submission
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {userSubmissions.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No submissions yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start your first buildathon project!
              </p>
              <Button asChild className="mt-4">
                <Link href="/submit">Create Submission</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{submission.title}</h3>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {submission.tagline || submission.description.slice(0, 100)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {submission.cohort?.name}
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/submissions/${submission.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
