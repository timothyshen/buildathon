"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cohortsService, submissionsService, reviewsService, usersService } from "@/services";
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
import { Loading } from "@/components/ui/loading";
import type { Cohort, Submission, Review, User } from "@/types";
import { getCohortStatusColor } from "@/lib/utils/status";

export function AdminDashboard() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [judges, setJudges] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [cohortsResult, submissionsResult, reviewsResult, usersResult] = await Promise.all([
        cohortsService.list(),
        submissionsService.list(),
        reviewsService.list(),
        usersService.list(),
      ]);

      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (submissionsResult.success) setSubmissions(submissionsResult.data);
      if (reviewsResult.success) setReviews(reviewsResult.data);
      if (usersResult.success) setJudges(usersResult.data.filter((u) => u.role === "judge"));

      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  const activeCohorts = cohorts.filter((c) => c.status === "active");
  const totalSubmissions = submissions.length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const totalJudges = judges.length;


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCohorts.length}</div>
            <p className="text-xs text-muted-foreground">
              {cohorts.length} total cohorts
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
            <Link href="/admin/cohorts">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cohorts.map((cohort) => {
              const cohortSubmissions = submissions.filter(
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
                      <Badge className={getCohortStatusColor(cohort.status)}>
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
                    <Link href={`/admin/cohorts/${cohort.id}`}>Manage</Link>
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
            {submissions.slice(0, 5).map((submission) => (
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
