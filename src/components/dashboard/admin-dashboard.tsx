"use client";

import Link from "next/link";
import { mockCohorts, mockSubmissions, mockReviews, mockUsers } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  FileText,
  Users,
  Star,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

export function AdminDashboard() {
  const activeCohorts = mockCohorts.filter((c) => c.status === "active");
  const totalSubmissions = mockSubmissions.length;
  const pendingReviews = mockReviews.filter((r) => r.status === "pending").length;
  const totalJudges = mockUsers.filter((u) => u.role === "judge").length;

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage buildathons, submissions, and judges.
          </p>
        </div>
        <Button asChild>
          <Link href="/cohorts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Cohort
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCohorts.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockCohorts.length} total cohorts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Across all cohorts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting judge review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Judges</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJudges}</div>
            <p className="text-xs text-muted-foreground">
              Reviewing submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cohorts</CardTitle>
            <CardDescription>All buildathon cohorts</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/cohorts">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCohorts.map((cohort) => {
              const cohortSubmissions = mockSubmissions.filter(
                (s) => s.cohortId === cohort.id
              );
              return (
                <div
                  key={cohort.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cohort.name}</h3>
                      <Badge className={getStatusColor(cohort.status)}>
                        {cohort.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cohortSubmissions.length} submissions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cohort.startDate).toLocaleDateString()} -{" "}
                      {new Date(cohort.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/cohorts/${cohort.id}`}>Manage</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest project submissions</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/submissions">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSubmissions.slice(0, 5).map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{submission.title}</h3>
                    <Badge variant="outline">{submission.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    by {submission.team?.name} • {submission.cohort?.name}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/submissions/${submission.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
