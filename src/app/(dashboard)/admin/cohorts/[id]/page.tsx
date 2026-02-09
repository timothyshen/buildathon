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
  ExternalLink,
  Eye,
  Pencil,
  Loader2,
} from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import type { Cohort, Track, Submission } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";

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
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Cohort["status"] | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

      const [tracksResult, sponsorsResult, submissionsResult] = await Promise.all([
        tracksService.getByCohort(id),
        sponsorsService.getCohortSponsors(id),
        submissionsService.getByCohort(id),
      ]);

      if (tracksResult.success) setTracks(tracksResult.data);
      if (sponsorsResult.success) setSponsors(sponsorsResult.data);
      if (submissionsResult.success) setSubmissions(submissionsResult.data);

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
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead className="hidden md:table-cell">Track</TableHead>
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
                      <TableCell className="hidden md:table-cell">
                        {submission.team?.name || "Solo"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
      </Tabs>
    </div>
  );
}
