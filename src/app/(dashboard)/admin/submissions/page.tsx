"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submissionsService, cohortsService } from "@/services";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Submissions" }
        ]}
      />
      <AdminNav />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Submissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
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
      <div className="rounded-xl border overflow-hidden">
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
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No submissions found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{submission.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.tagline?.slice(0, 40)}
                        {submission.tagline && submission.tagline.length > 40 ? "..." : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {submission.team?.name || "Solo"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {submission.cohort?.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {submission.track?.name || "Open"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        submission.status === "submitted" ? "bg-emerald-500"
                          : submission.status === "accepted" ? "bg-blue-500"
                          : submission.status === "winner" ? "bg-violet-500"
                          : submission.status === "under_review" ? "bg-blue-500"
                          : submission.status === "draft" ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs capitalize">{submission.status.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {submission.demoUrl && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a
                            href={submission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filteredSubmissions.length} of {submissions.length} submissions
      </p>
    </div>
  );
}
