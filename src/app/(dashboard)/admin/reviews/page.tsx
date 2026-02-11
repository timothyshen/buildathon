"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { reviewsService, cohortsService, usersService } from "@/services";
import type { Review, Cohort, User } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Search, Eye, Star, Loader2 } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [judges, setJudges] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedJudge, setSelectedJudge] = useState<string>("all");

  // Load cohorts and judges once
  useEffect(() => {
    Promise.all([
      cohortsService.list(),
      usersService.list({ role: "judge" }),
    ]).then(([cohortsResult, usersResult]) => {
      if (cohortsResult.success) setCohorts(cohortsResult.data);
      if (usersResult.success) setJudges(usersResult.data as User[]);
    });
  }, []);

  // Re-fetch reviews when server-side filters change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    reviewsService
      .list({
        pageSize: 100,
        status: selectedStatus !== "all" ? (selectedStatus as Review["status"]) : undefined,
        cohortId: selectedCohort !== "all" ? selectedCohort : undefined,
      })
      .then((result) => {
        if (cancelled) return;
        if (result.success) setReviews(result.data);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedStatus, selectedCohort]);

  // Status and cohort are filtered server-side; search and judge are client-side
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      search === "" ||
      review.judge?.name.toLowerCase().includes(search.toLowerCase()) ||
      review.submission?.title?.toLowerCase().includes(search.toLowerCase());

    const matchesJudge =
      selectedJudge === "all" || review.judgeId === selectedJudge;

    return matchesSearch && matchesJudge;
  });

  const completedReviews = reviews.filter((r) => r.status === "completed").length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const inProgressReviews = reviews.filter((r) => r.status === "in_progress").length;

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Reviews" },
        ]}
      />
      <AdminNav />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Judge Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and monitor all judge reviews across cohorts
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border grid grid-cols-2 md:grid-cols-4 md:divide-x">
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground mb-1">Total Reviews</p>
          <p className="text-3xl font-mono font-semibold tabular-nums">{reviews.length}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">{completedReviews}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-3xl font-mono font-semibold tabular-nums text-blue-600">{inProgressReviews}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-mono font-semibold tabular-nums text-amber-600">{pendingReviews}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by judge or submission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCohort} onValueChange={setSelectedCohort}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
        <Select value={selectedJudge} onValueChange={setSelectedJudge}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Judges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Judges</SelectItem>
            {judges.map((judge) => (
              <SelectItem key={judge.id} value={judge.id}>
                {judge.name}
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews Table */}
      <div className="rounded-xl border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Judge</TableHead>
              <TableHead>Submission</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No reviews found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.judge?.avatar} />
                        <AvatarFallback>
                          {review.judge?.name ? getInitials(review.judge.name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{review.judge?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {review.judge?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {review.submission?.title || "Unknown Submission"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {review.submission?.team?.name || "Solo"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.overallScore ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-mono text-xs tabular-nums">{review.overallScore.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          review.status === "completed"
                            ? "bg-emerald-500"
                            : review.status === "in_progress"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }`}
                      />
                      <span className="text-xs capitalize">
                        {review.status.replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.completedAt
                      ? new Date(review.completedAt).toLocaleDateString()
                      : new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" asChild>
                      <Link href={`/admin/reviews/${review.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
