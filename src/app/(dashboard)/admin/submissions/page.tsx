"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { submissionsService, cohortsService, reviewsService } from "@/services";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { Search, ExternalLink, Eye, Loader2 } from "lucide-react";
import type { Submission, Cohort } from "@/types";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewCounts, setReviewCounts] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(1); }, 300);
  }, []);

  // Load cohorts once
  useEffect(() => {
    cohortsService.list().then((result) => {
      if (result.success) setCohorts(result.data);
    });
  }, []);

  // Re-fetch submissions when server-side filters change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    submissionsService
      .list({
        page,
        pageSize,
        status: selectedStatus !== "all" ? (selectedStatus as Submission["status"]) : undefined,
        cohortId: selectedCohort !== "all" ? selectedCohort : undefined,
        search: debouncedSearch || undefined,
      })
      .then(async (result) => {
        if (cancelled) return;
        if (result.success) {
          setSubmissions(result.data);
          setTotalCount(result.total);
          // Fetch review counts for all submissions
          const ids = result.data.map((s) => s.id);
          if (ids.length > 0) {
            const countsResult = await reviewsService.getReviewCountsBySubmission(ids);
            if (!cancelled && countsResult.success) setReviewCounts(countsResult.data);
          }
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedStatus, selectedCohort, debouncedSearch, page, pageSize]);

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
            placeholder="Search by title..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCohort} onValueChange={(v) => { setSelectedCohort(v); setPage(1); }}>
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
        <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1); }}>
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
      <div className="rounded-xl border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No submissions found.</p>
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
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
                  <TableCell className="text-xs text-muted-foreground">
                    {submission.team?.name || "Solo"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {submission.cohort?.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
                  <TableCell>
                    {submission.status !== "draft" ? (() => {
                      const count = reviewCounts.get(submission.id) || 0;
                      const needed = submission.cohort?.minReviewsPerSubmission || 3;
                      return (
                        <span className={`font-mono text-xs tabular-nums ${count >= needed ? "text-emerald-600" : "text-amber-600"}`}>
                          {count}/{needed}
                        </span>
                      );
                    })() : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {submission.demoUrl && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" asChild>
                          <a
                            href={submission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 md:h-3.5 md:w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" asChild>
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Eye className="h-4 w-4 md:h-3.5 md:w-3.5" />
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

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={totalCount}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}
