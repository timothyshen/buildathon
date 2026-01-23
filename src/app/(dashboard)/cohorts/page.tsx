"use client";

import Link from "next/link";
import { mockCohorts, mockSubmissions, mockTracks } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, Users, FileText, Settings } from "lucide-react";

export default function CohortsPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "judging":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cohorts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage buildathon cohorts and tracks
          </p>
        </div>
        <Button asChild>
          <Link href="/cohorts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Cohort
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {mockCohorts.map((cohort) => {
          const submissions = mockSubmissions.filter((s) => s.cohortId === cohort.id);
          const tracks = mockTracks.filter((t) => t.cohortId === cohort.id);

          return (
            <Card key={cohort.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{cohort.name}</CardTitle>
                      <Badge className={getStatusColor(cohort.status)}>
                        {cohort.status}
                      </Badge>
                      {!cohort.isPublic && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {cohort.tagline || cohort.description}
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/cohorts/${cohort.id}`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">Dates</p>
                      <p className="text-muted-foreground">
                        {new Date(cohort.startDate).toLocaleDateString()} -{" "}
                        {new Date(cohort.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">Submissions</p>
                      <p className="text-muted-foreground">{submissions.length} projects</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">Tracks</p>
                      <p className="text-muted-foreground">{tracks.length} tracks</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Prizes</p>
                    <p className="text-muted-foreground">
                      {cohort.prizes?.map((p) => p.amount).join(", ") || "TBD"}
                    </p>
                  </div>
                </div>

                {tracks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tracks.map((track) => (
                      <Badge key={track.id} variant="secondary">
                        {track.name}
                        {track.prizePool && ` - ${track.prizePool}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
