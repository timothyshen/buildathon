"use client";

import { useState, useEffect } from "react";
import { usersService, reviewsService, submissionsService, cohortJudgesService, cohortsService } from "@/services";
import type { User, Review, Submission, Cohort } from "@/types";
import type { CohortJudgeWithCohort } from "@/services/cohort-judges.service";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { Search, UserPlus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Invite judge state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  // Assign reviews state
  const [assignJudge, setAssignJudge] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set());
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [cohortAssignments, setCohortAssignments] = useState<Map<string, CohortJudgeWithCohort[]>>(new Map());
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [assignCohortFilter, setAssignCohortFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    async function loadData() {
      const [usersResult, reviewsResult, cohortsResult] = await Promise.all([
        usersService.list({ role: "judge" }),
        reviewsService.list(),
        cohortsService.list(),
      ]);

      if (usersResult.success) {
        setJudges(usersResult.data as User[]);
        // Fetch cohort assignments for all judges
        const assignmentResults = await Promise.all(
          (usersResult.data as User[]).map((j) => cohortJudgesService.getByJudge(j.id))
        );
        const map = new Map<string, CohortJudgeWithCohort[]>();
        (usersResult.data as User[]).forEach((j, i) => {
          if (assignmentResults[i].success) {
            map.set(j.id, assignmentResults[i].data);
          }
        });
        setCohortAssignments(map);
      }
      if (reviewsResult.success) setReviews(reviewsResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleInviteJudge = () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    toast.warning("Judge invitation is not yet implemented");
    setIsAddDialogOpen(false);
    setInviteEmail("");
    setInviteName("");
  };

  const handleOpenAssignDialog = async (judge: User) => {
    setAssignJudge(judge);
    setSelectedSubmissionIds(new Set());
    setAssignSearch("");
    setAssignCohortFilter("all");
    setIsLoadingSubmissions(true);

    const result = await submissionsService.list({ status: "submitted", pageSize: 200 });
    if (result.success) {
      // Filter out submissions already assigned to this judge
      const judgeReviewSubmissionIds = new Set(
        reviews.filter((r) => r.judgeId === judge.id).map((r) => r.submissionId)
      );
      const available = result.data.filter((s) => !judgeReviewSubmissionIds.has(s.id));
      setSubmissions(available);
    }
    setIsLoadingSubmissions(false);
  };

  const handleCloseAssignDialog = () => {
    setAssignJudge(null);
    setSubmissions([]);
    setSelectedSubmissionIds(new Set());
    setAssignSearch("");
  };

  const toggleSubmission = (id: string) => {
    setSelectedSubmissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = filteredSubmissions;
    const allSelected = filtered.every((s) => selectedSubmissionIds.has(s.id));
    if (allSelected) {
      setSelectedSubmissionIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedSubmissionIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const handleAssignReviews = async () => {
    if (!assignJudge || selectedSubmissionIds.size === 0) return;

    setIsAssigning(true);
    let successCount = 0;
    let failCount = 0;

    const newReviews: Review[] = [];
    for (const submissionId of selectedSubmissionIds) {
      const result = await reviewsService.create({
        submissionId,
        judgeId: assignJudge.id,
      });
      if (result.success) {
        successCount++;
        newReviews.push(result.data);
      } else {
        failCount++;
      }
    }

    // Update state once after all assignments
    if (newReviews.length > 0) {
      setReviews((prev) => [...prev, ...newReviews]);
    }

    setIsAssigning(false);

    if (failCount === 0) {
      toast.success(`Assigned ${successCount} submission${successCount > 1 ? "s" : ""} to ${assignJudge.name}`);
    } else {
      toast.error(`${failCount} assignment${failCount > 1 ? "s" : ""} failed. ${successCount} succeeded.`);
    }

    // Fire-and-forget notification trigger for review assignment
    if (successCount > 0) {
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "review_assigned",
          data: { judgeId: assignJudge.id },
        }),
      }).catch(() => {});
    }

    handleCloseAssignDialog();
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      (assignCohortFilter === "all" || s.cohortId === assignCohortFilter) &&
      (assignSearch === "" ||
        s.title.toLowerCase().includes(assignSearch.toLowerCase()) ||
        (s.team?.name || "Solo").toLowerCase().includes(assignSearch.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredJudges = judges.filter(
    (judge) =>
      search === "" ||
      judge.name.toLowerCase().includes(search.toLowerCase()) ||
      judge.email.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedJudges = filteredJudges.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Judges" }
        ]}
      />
      <AdminNav />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Judges</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage judges and their review assignments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Judge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Judge</DialogTitle>
              <DialogDescription>
                Send an invitation to a new judge
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="judge@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Judge Name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteJudge}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Strip */}
      <div className="rounded-xl border divide-x flex">
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Total Judges</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{judges.length}</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Reviews Completed</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-emerald-600">
            {reviews.filter((r) => r.status === "completed").length}
          </p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Reviews Pending</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-amber-600">
            {reviews.filter((r) => r.status === "pending").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search judges..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Judges Table */}
      {filteredJudges.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-8 w-8 opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">No Judges Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add judges to help evaluate submissions.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Judge</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cohorts</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedJudges.map((judge) => {
                const judgeReviews = reviews.filter(
                  (r) => r.judgeId === judge.id
                );
                const completed = judgeReviews.filter(
                  (r) => r.status === "completed"
                );
                const pending = judgeReviews.filter((r) => r.status === "pending");
                const avgScore =
                  completed.length > 0
                    ? completed.reduce((acc, r) => acc + (r.overallScore || 0), 0) /
                      completed.length
                    : 0;

                return (
                  <TableRow key={judge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={judge.avatar}
                          alt={judge.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{judge.name}</p>
                          {judge.bio && (
                            <p className="text-xs text-muted-foreground">
                              {judge.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{judge.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(cohortAssignments.get(judge.id) || []).map((ca) => (
                          <span key={ca.id} className="px-2 py-0.5 text-[11px] rounded-md bg-muted text-muted-foreground">
                            {ca.cohort.name}
                          </span>
                        ))}
                        {(cohortAssignments.get(judge.id) || []).length === 0 && (
                          <span className="text-[11px] text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{judgeReviews.length}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs tabular-nums text-emerald-600">
                        {completed.length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs tabular-nums text-amber-600">
                        {pending.length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs tabular-nums">
                        {avgScore > 0 ? avgScore.toFixed(1) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAssignDialog(judge)}
                      >
                        Assign Reviews
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredJudges.length > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={filteredJudges.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      )}

      {/* Assign Reviews Dialog */}
      <Dialog open={!!assignJudge} onOpenChange={(open) => { if (!open) handleCloseAssignDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Reviews to {assignJudge?.name}</DialogTitle>
            <DialogDescription>
              Select submissions for this judge to review
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Select value={assignCohortFilter} onValueChange={setAssignCohortFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Cohorts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {cohorts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
            {isLoadingSubmissions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {submissions.length === 0
                  ? "No unassigned submissions available"
                  : "No submissions match your search"}
              </div>
            ) : (
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          filteredSubmissions.length > 0 &&
                          filteredSubmissions.every((s) => selectedSubmissionIds.has(s.id))
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Team</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer"
                      onClick={() => toggleSubmission(submission.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedSubmissionIds.has(submission.id)}
                          onCheckedChange={() => toggleSubmission(submission.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.title}</p>
                          {submission.tagline && (
                            <p className="text-xs text-muted-foreground">{submission.tagline}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {submission.team?.name || "Solo"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedSubmissionIds.size} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseAssignDialog} disabled={isAssigning}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignReviews}
                disabled={selectedSubmissionIds.size === 0 || isAssigning}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${selectedSubmissionIds.size > 0 ? selectedSubmissionIds.size : ""} Review${selectedSubmissionIds.size !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
