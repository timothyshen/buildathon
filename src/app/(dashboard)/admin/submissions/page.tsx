"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submissionsService, cohortsService } from "@/services";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ExternalLink, Eye, Loader2 } from "lucide-react";
import type { Submission, Cohort } from "@/types";
import { getSubmissionStatusColor } from "@/lib/utils/status";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      const [submissionsResult, cohortsResult] = await Promise.all([
        submissionsService.list(),
        cohortsService.list(),
      ]);

      if (submissionsResult.success) setSubmissions(submissionsResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      search === "" ||
      submission.title.toLowerCase().includes(search.toLowerCase()) ||
      (submission.team?.name || "Solo").toLowerCase().includes(search.toLowerCase());

    const matchesCohort =
      selectedCohort === "all" || submission.cohortId === selectedCohort;

    const matchesStatus =
      selectedStatus === "all" || submission.status === selectedStatus;

    return matchesSearch && matchesCohort && matchesStatus;
  });


  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Submissions" }
        ]}
      />
      <AdminNav />

      <div>
        <h1 className="text-3xl font-bold">All Submissions</h1>
        <p className="mt-2 text-muted-foreground">
          Manage all buildathon submissions across cohorts
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCohort} onValueChange={setSelectedCohort}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Cohorts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            {cohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {cohort.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="winner">Winner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="hidden md:table-cell">Team</TableHead>
                <TableHead className="hidden md:table-cell">Cohort</TableHead>
                <TableHead className="hidden md:table-cell">Track</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{submission.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.tagline?.slice(0, 40)}
                        {submission.tagline && submission.tagline.length > 40 ? "..." : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{submission.team?.name || "Solo"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{submission.cohort?.name}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{submission.track?.name || "Open"}</TableCell>
                  <TableCell>
                    <Badge className={getSubmissionStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {submission.demoUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={submission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing {filteredSubmissions.length} of {submissions.length} submissions
      </p>
    </div>
  );
}
