"use client";

import { useState, useEffect } from "react";
import { usersService, reviewsService, submissionsService } from "@/services";
import type { User, Review, Submission } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Search, UserPlus, Star, CheckCircle, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Assign reviews state
  const [assignJudge, setAssignJudge] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set());
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const [usersResult, reviewsResult] = await Promise.all([
        usersService.list({ role: "judge" }),
        reviewsService.list(),
      ]);

      if (usersResult.success) setJudges(usersResult.data as User[]);
      if (reviewsResult.success) setReviews(reviewsResult.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleOpenAssignDialog = async (judge: User) => {
    setAssignJudge(judge);
    setSelectedSubmissionIds(new Set());
    setAssignSearch("");
    setIsLoadingSubmissions(true);

    const result = await submissionsService.list({ status: "submitted" });
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

    for (const submissionId of selectedSubmissionIds) {
      const result = await reviewsService.create({
        submissionId,
        judgeId: assignJudge.id,
      });
      if (result.success) {
        successCount++;
        // Add to local reviews state
        setReviews((prev) => [...prev, result.data]);
      } else {
        failCount++;
      }
    }

    setIsAssigning(false);

    if (failCount === 0) {
      toast.success(`Assigned ${successCount} submission${successCount > 1 ? "s" : ""} to ${assignJudge.name}`);
    } else {
      toast.error(`${failCount} assignment${failCount > 1 ? "s" : ""} failed. ${successCount} succeeded.`);
    }

    handleCloseAssignDialog();
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      assignSearch === "" ||
      s.title.toLowerCase().includes(assignSearch.toLowerCase()) ||
      (s.team?.name || "Solo").toLowerCase().includes(assignSearch.toLowerCase())
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

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Judges" }
        ]}
      />
      <AdminNav />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Judges</h1>
          <p className="mt-2 text-muted-foreground">
            Manage judges and their review assignments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <Input id="email" type="email" placeholder="judge@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Judge Name" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Judges</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search judges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Judges Table */}
      {filteredJudges.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Judges Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add judges to help evaluate submissions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="hidden md:table-cell">Pending</TableHead>
                  <TableHead className="hidden md:table-cell">Avg Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJudges.map((judge) => {
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
                      <TableCell className="hidden md:table-cell">{judge.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{judgeReviews.length}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {completed.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {pending.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {avgScore > 0 ? avgScore.toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
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
          </CardContent>
        </Card>
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="pl-9"
            />
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
              <Table>
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
                    <TableHead className="hidden sm:table-cell">Team</TableHead>
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
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
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
