"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import {
  cohortsService,
  tracksService,
  sponsorsService,
  submissionsService,
  cohortJudgesService,
  reviewsService,
  usersService,
} from "@/services";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Eye,
  Pencil,
  Loader2,
  Plus,
  Trash2,
  Wand2,
  Search,
} from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import type { Cohort, Track, Submission, Review, User } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";
import type { CohortJudgeWithUser } from "@/services/cohort-judges.service";

function getStatusDotColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "upcoming":
      return "bg-blue-500";
    case "judging":
      return "bg-violet-500";
    case "completed":
      return "bg-amber-500";
    case "draft":
    default:
      return "bg-muted-foreground";
  }
}

function getSubmissionDotColor(status: string) {
  switch (status) {
    case "submitted":
      return "bg-emerald-500";
    case "draft":
      return "bg-amber-500";
    case "under_review":
    case "accepted":
      return "bg-blue-500";
    case "winner":
      return "bg-violet-500";
    default:
      return "bg-muted-foreground";
  }
}

interface AdminCohortDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminCohortDetailPage({ params }: AdminCohortDetailPageProps) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [sponsors, setSponsors] = useState<CohortSponsorWithOrg[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [cohortJudges, setCohortJudges] = useState<CohortJudgeWithUser[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Cohort["status"] | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [showAddJudge, setShowAddJudge] = useState(false);
  const [allJudges, setAllJudges] = useState<User[]>([]);
  const [judgeSearch, setJudgeSearch] = useState("");
  const [reviewProgressPage, setReviewProgressPage] = useState(1);
  const [reviewProgressPageSize, setReviewProgressPageSize] = useState(25);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (user?.role !== "admin") {
        setIsLoading(false);
        return;
      }

      const cohortResult = await cohortsService.getById(id);

      if (!cohortResult.success || !cohortResult.data) {
        setIsLoading(false);
        return;
      }

      setCohort(cohortResult.data);

      const [tracksResult, sponsorsResult, submissionsResult, judgesResult, reviewsResult] = await Promise.all([
        tracksService.getByCohort(id),
        sponsorsService.getCohortSponsors(id),
        submissionsService.getByCohort(id),
        cohortJudgesService.getByCohort(id),
        reviewsService.list({ cohortId: id, pageSize: 200 }),
      ]);

      if (tracksResult.success) setTracks(tracksResult.data);
      if (sponsorsResult.success) setSponsors(sponsorsResult.data);
      if (submissionsResult.success) setSubmissions(submissionsResult.data);
      if (judgesResult.success) setCohortJudges(judgesResult.data);
      if (reviewsResult.success) setReviews(reviewsResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [id, user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cohort) {
    notFound();
  }

  // Only admins can access
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Access denied. Admin only.</div>
      </div>
    );
  }

  const currentStatus = status ?? cohort.status;

  const handleOpenAddJudge = async () => {
    setJudgeSearch("");
    setShowAddJudge(true);
    const result = await usersService.list({ role: "judge", pageSize: 100 });
    if (result.success) setAllJudges(result.data);
  };

  const handleAddJudge = async (judgeId: string) => {
    const result = await cohortJudgesService.add(id, judgeId);
    if (result.success) {
      // Reload judges list to get the full user data
      const judgesResult = await cohortJudgesService.getByCohort(id);
      if (judgesResult.success) setCohortJudges(judgesResult.data);
      toast.success("Judge added to cohort");
    } else {
      toast.error(result.error || "Failed to add judge");
    }
  };

  const handleRemoveJudge = async (cohortJudgeId: string) => {
    const result = await cohortJudgesService.remove(cohortJudgeId);
    if (result.success) {
      setCohortJudges((prev) => prev.filter((cj) => cj.id !== cohortJudgeId));
      toast.success("Judge removed from cohort");
    } else {
      toast.error(result.error || "Failed to remove judge");
    }
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch("/api/reviews/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Auto-assign failed");
        return;
      }
      toast.success(
        `Created ${data.created} review assignments (${data.skipped} conflicts skipped)`
      );
      // Refresh reviews
      const reviewsResult = await reviewsService.list({ cohortId: id, pageSize: 200 });
      if (reviewsResult.success) setReviews(reviewsResult.data);
    } catch {
      toast.error("Auto-assign failed");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus: Cohort["status"]) => {
    setIsUpdating(true);
    try {
      const result = await cohortsService.updateStatus(id, newStatus);
      if (result.success) {
        setStatus(newStatus);
        toast.success(`Cohort status updated to ${newStatus}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const totalPrizePool = cohort.prizes?.reduce((sum, prize) => {
    const amount = parseInt(prize.amount.replace(/[^0-9]/g, ""), 10) || 0;
    return sum + amount;
  }, 0) || 0;

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Cohorts", href: "/admin/cohorts" },
          { label: cohort.name },
        ]}
      />
      <AdminNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cohort.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">/{cohort.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(currentStatus)}`} />
            <span className="text-xs capitalize">{currentStatus}</span>
          </span>
          <Select
            value={currentStatus}
            onValueChange={(value) => handleStatusChange(value as Cohort["status"])}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[150px]">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="judging">Judging</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="rounded-xl border divide-x flex">
        <div className="flex-1 px-5 py-4">
          <p className="text-xs text-muted-foreground mb-1">Submissions</p>
          <p className="text-3xl font-mono font-semibold tabular-nums">{submissions.length}</p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="text-xs text-muted-foreground mb-1">Sponsors</p>
          <p className="text-3xl font-mono font-semibold tabular-nums">{sponsors.length}</p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="text-xs text-muted-foreground mb-1">Tracks</p>
          <p className="text-3xl font-mono font-semibold tabular-nums">{tracks.length}</p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
          <p className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {totalPrizePool > 0 ? `$${totalPrizePool.toLocaleString()}` : "-"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors ({sponsors.length})</TabsTrigger>
          <TabsTrigger value="tracks">Tracks ({tracks.length})</TabsTrigger>
          <TabsTrigger value="judging">Judging ({cohortJudges.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-10">
              {/* About */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                  About
                </p>
                <div className="rounded-xl border p-5">
                  <RichTextDisplay content={cohort.description} />
                </div>
              </div>

              {/* Prizes */}
              {cohort.prizes && cohort.prizes.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                    Prizes
                  </p>
                  <div className="rounded-xl border p-5">
                    <div className="divide-y">
                      {cohort.prizes.map((prize, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{prize.place}</span>
                            {prize.description && (
                              <span className="text-sm text-muted-foreground">
                                {prize.description}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-semibold">{prize.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-10">
              {/* Timeline */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                  Timeline
                </p>
                <div className="rounded-xl border p-5 divide-y">
                  <div className="pb-3">
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {cohort.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="py-3">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {cohort.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  {cohort.submissionDeadline && (
                    <div className="py-3">
                      <p className="text-xs text-muted-foreground">
                        Submission Deadline
                      </p>
                      <p className="font-medium">
                        {cohort.submissionDeadline.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="pt-3">
                    <p className="text-xs text-muted-foreground">
                      Judging Period
                    </p>
                    <p className="font-medium">
                      {cohort.judgingStart.toLocaleDateString()} - {cohort.judgingEnd.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                  Settings
                </p>
                <div className="rounded-xl border p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visibility</span>
                    <span className="text-sm text-muted-foreground">
                      {cohort.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Max Team Size</span>
                    <span className="text-sm text-muted-foreground">
                      {cohort.maxTeamSize} members
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Min Reviews</span>
                    <span className="text-sm text-muted-foreground">
                      {cohort.minReviewsPerSubmission} per submission
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="bg-foreground text-background hover:bg-foreground/90 w-full" asChild>
                  <Link href={`/admin/cohorts/${cohort.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Cohort
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/cohorts/${cohort.slug}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public Page
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <div className="rounded-xl border overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No submissions yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {submission.tagline?.slice(0, 40)}
                            {submission.tagline && submission.tagline.length > 40
                              ? "..."
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.team?.name || "Solo"}
                      </TableCell>
                      <TableCell>
                        {submission.track?.name || "Open"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${getSubmissionDotColor(submission.status)}`} />
                          <span className="text-xs capitalize">{submission.status.replace("_", " ")}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={`/admin/submissions/${submission.id}`}>
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
        </TabsContent>

        {/* Sponsors Tab */}
        <TabsContent value="sponsors">
          <div className="space-y-3">
            {sponsors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sponsors yet</p>
              </div>
            ) : (
              sponsors.map((sponsor) => (
                <div key={sponsor.id} className="rounded-xl border py-3 px-4 flex items-center gap-4">
                  <div className="w-10 h-10 relative flex-shrink-0">
                    <Image
                      unoptimized
                      src={sponsor.logo}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-medium">{sponsor.name}</span>
                  <span className="text-sm text-muted-foreground capitalize">{sponsor.tier}</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <div className="space-y-3">
            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tracks yet</p>
              </div>
            ) : (
              tracks.map((track) => (
                <div key={track.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{track.name}</span>
                    {track.prizePool && (
                      <span className="font-mono font-semibold text-sm">{track.prizePool}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {track.description}
                  </p>
                  {track.sponsorName && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {track.sponsorLogo && (
                        <div className="w-8 h-8 relative">
                          <Image
                            unoptimized
                            src={track.sponsorLogo}
                            alt={track.sponsorName}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span className="text-sm">{track.sponsorName}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Judging Tab */}
        <TabsContent value="judging" className="space-y-8">
          {/* Assigned Judges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Assigned Judges
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleOpenAddJudge}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Judge
                </Button>
                <Button
                  size="sm"
                  onClick={handleAutoAssign}
                  disabled={isAutoAssigning || cohortJudges.length === 0}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {isAutoAssigning ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="mr-1 h-3.5 w-3.5" />
                  )}
                  Auto-Assign Reviews
                </Button>
              </div>
            </div>

            {cohortJudges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No judges assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add judges to start assigning reviews</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cohortJudges.map((cj) => {
                  const judgeReviews = reviews.filter((r) => r.judgeId === cj.judgeId);
                  const completed = judgeReviews.filter((r) => r.status === "completed").length;
                  return (
                    <div key={cj.id} className="rounded-xl border py-3 px-4 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <img
                          src={cj.judge.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cj.judge.email}`}
                          alt={cj.judge.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium">{cj.judge.name}</p>
                          <p className="text-xs text-muted-foreground">{cj.judge.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Reviews</p>
                          <p className="text-sm font-mono tabular-nums">
                            <span className="text-emerald-600">{completed}</span>
                            <span className="text-muted-foreground">/{judgeReviews.length}</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                          onClick={() => handleRemoveJudge(cj.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review Progress */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              Review Progress
            </p>
            <div className="rounded-xl border overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const nonDraftSubs = submissions.filter((s) => s.status !== "draft");
                    const paginatedSubs = nonDraftSubs.slice(
                      (reviewProgressPage - 1) * reviewProgressPageSize,
                      reviewProgressPage * reviewProgressPageSize
                    );
                    return nonDraftSubs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <p className="text-muted-foreground text-sm">No submissions to review</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubs.map((sub) => {
                        const subReviews = reviews.filter((r) => r.submissionId === sub.id);
                        const completedReviews = subReviews.filter((r) => r.status === "completed");
                        const needed = cohort.minReviewsPerSubmission || 3;
                        const avgScore = completedReviews.length > 0
                          ? completedReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completedReviews.length
                          : 0;
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <Link href={`/admin/submissions/${sub.id}`} className="hover:underline">
                                <p className="text-sm font-medium">{sub.title}</p>
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sub.team?.name || "Solo"}
                            </TableCell>
                            <TableCell>
                              <span className={`font-mono text-sm tabular-nums ${completedReviews.length >= needed ? "text-emerald-600" : "text-amber-600"}`}>
                                {completedReviews.length}/{needed}
                              </span>
                            </TableCell>
                            <TableCell>
                              {completedReviews.length > 0 ? (
                                <span className="font-mono text-sm tabular-nums">{avgScore.toFixed(1)}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  );
                  })()}
                </TableBody>
              </Table>
            </div>
            {submissions.filter((s) => s.status !== "draft").length > 0 && (
              <TablePagination
                page={reviewProgressPage}
                pageSize={reviewProgressPageSize}
                total={submissions.filter((s) => s.status !== "draft").length}
                onPageChange={setReviewProgressPage}
                onPageSizeChange={(size) => { setReviewProgressPageSize(size); setReviewProgressPage(1); }}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Judge Dialog */}
      <Dialog open={showAddJudge} onOpenChange={setShowAddJudge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Judge to {cohort.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search judges..."
                value={judgeSearch}
                onChange={(e) => setJudgeSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {allJudges
                .filter((j) => !cohortJudges.some((cj) => cj.judgeId === j.id))
                .filter((j) =>
                  judgeSearch
                    ? j.name.toLowerCase().includes(judgeSearch.toLowerCase()) ||
                      j.email.toLowerCase().includes(judgeSearch.toLowerCase())
                    : true
                )
                .map((judge) => (
                  <button
                    key={judge.id}
                    onClick={() => handleAddJudge(judge.id)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                  >
                    <img
                      src={judge.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${judge.email}`}
                      alt={judge.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{judge.name}</p>
                      <p className="text-xs text-muted-foreground">{judge.email}</p>
                    </div>
                  </button>
                ))}
              {allJudges.filter((j) => !cohortJudges.some((cj) => cj.judgeId === j.id)).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No available judges</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
