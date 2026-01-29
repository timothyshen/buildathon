"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  reviewsService,
  submissionsService,
  cohortsService,
} from "@/services";
import type { Review, Submission, Cohort } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Search,
  Star,
  CheckCircle,
  Clock,
  Loader2,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

interface SubmissionWithReview {
  submission: Submission;
  review: Review | null;
}

export default function AdminJudgePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<SubmissionWithReview[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [creatingReviewFor, setCreatingReviewFor] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const [subResult, cohortsResult] = await Promise.all([
        submissionsService.list({ status: "submitted" }),
        cohortsService.list(),
      ]);

      if (cohortsResult.success) setCohorts(cohortsResult.data);

      if (subResult.success) {
        // For each submission, check if admin has existing review
        const submissionItems: SubmissionWithReview[] = [];

        for (const submission of subResult.data) {
          const reviewsResult = await reviewsService.getBySubmission(submission.id);
          const existingReview = reviewsResult.success
            ? reviewsResult.data.find((r) => r.judgeId === user.id)
            : null;

          submissionItems.push({
            submission,
            review: existingReview || null,
          });
        }

        setItems(submissionItems);
      }

      setIsLoading(false);
    }
    loadData();
  }, [user]);

  const handleJudge = async (item: SubmissionWithReview) => {
    if (!user) return;

    if (item.review) {
      router.push(`/reviews/${item.review.id}?from=admin`);
      return;
    }

    setCreatingReviewFor(item.submission.id);
    try {
      const result = await reviewsService.create({
        submissionId: item.submission.id,
        judgeId: user.id,
      });
      if (result.success) {
        router.push(`/reviews/${result.data.id}?from=admin`);
      } else {
        toast.error(result.error || "Failed to create review");
      }
    } catch {
      toast.error("Failed to create review");
    } finally {
      setCreatingReviewFor(null);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Access denied. Admin only.</div>
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.submission.title.toLowerCase().includes(search.toLowerCase()) ||
      item.submission.team?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesCohort =
      selectedCohort === "all" || item.submission.cohortId === selectedCohort;

    return matchesSearch && matchesCohort;
  });

  const reviewedCount = items.filter(
    (i) => i.review?.status === "completed"
  ).length;
  const inProgressCount = items.filter(
    (i) => i.review?.status === "in_progress" || i.review?.status === "pending"
  ).length;
  const notStartedCount = items.filter((i) => !i.review).length;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Judge" },
        ]}
      />
      <AdminNav />

      <div>
        <h1 className="text-3xl font-bold">Judge Submissions</h1>
        <p className="mt-2 text-muted-foreground">
          Review and score any submitted project
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reviewedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{notStartedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or team..."
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
      </div>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="hidden md:table-cell">Team</TableHead>
                <TableHead className="hidden md:table-cell">Tracks</TableHead>
                <TableHead>Your Review</TableHead>
                <TableHead className="hidden md:table-cell">Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No submissions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.submission.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.submission.tagline}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.submission.team?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.submission.tracks?.map((track) => (
                          <Badge key={track.id} variant="outline" className="text-xs">
                            {track.name}
                          </Badge>
                        )) || (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.review ? (
                        <Badge
                          className={
                            item.review.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : item.review.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }
                        >
                          {item.review.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not started</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.review?.overallScore ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">
                            {item.review.overallScore.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={item.review?.status === "completed" ? "ghost" : "default"}
                        size="sm"
                        onClick={() => handleJudge(item)}
                        disabled={creatingReviewFor === item.submission.id}
                      >
                        {creatingReviewFor === item.submission.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : item.review?.status === "completed" ? (
                          "View"
                        ) : item.review ? (
                          "Continue"
                        ) : (
                          "Judge"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
