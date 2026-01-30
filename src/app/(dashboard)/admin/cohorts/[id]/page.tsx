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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Users,
  FileText,
  Trophy,
  ExternalLink,
  Eye,
  Pencil,
  Loader2,
} from "lucide-react";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import type { Cohort, Track, Submission } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";
import { getCohortStatusColor, getSubmissionStatusColor } from "@/lib/utils/colors";

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
  }, [id]);

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
    <div className="space-y-6">
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
          <h1 className="text-3xl font-bold">{cohort.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">/{cohort.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getCohortStatusColor(currentStatus)}>{currentStatus}</Badge>
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sponsors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tracks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prize Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPrizePool > 0 ? `$${totalPrizePool.toLocaleString()}` : "-"}
            </div>
          </CardContent>
        </Card>
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
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextDisplay content={cohort.description} />
                </CardContent>
              </Card>

              {/* Prizes */}
              {cohort.prizes && cohort.prizes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-prize-grand" />
                      Prizes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cohort.prizes.map((prize, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{prize.place}</Badge>
                            {prize.description && (
                              <span className="text-sm text-muted-foreground">
                                {prize.description}
                              </span>
                            )}
                          </div>
                          <span className="font-bold">{prize.amount}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {cohort.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {cohort.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  {cohort.submissionDeadline && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Submission Deadline
                      </p>
                      <p className="font-medium">
                        {cohort.submissionDeadline.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Judging Period
                    </p>
                    <p className="font-medium">
                      {cohort.judgingStart.toLocaleDateString()} - {cohort.judgingEnd.toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visibility</span>
                    <Badge variant={cohort.isPublic ? "default" : "outline"}>
                      {cohort.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Max Team Size</span>
                    <Badge variant="outline">
                      {cohort.maxTeamSize} members
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button className="w-full" asChild>
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
          <Card>
            <CardContent className="p-0">
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
                          <Badge className={getSubmissionStatusColor(submission.status)}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sponsors Tab */}
        <TabsContent value="sponsors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsors.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No sponsors yet</p>
              </div>
            ) : (
              sponsors.map((sponsor) => (
                <Card key={sponsor.id}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <Image
                        src={sponsor.logo}
                        alt={sponsor.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{sponsor.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {sponsor.tier}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No tracks yet</p>
              </div>
            ) : (
              tracks.map((track) => (
                <Card key={track.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{track.name}</span>
                      {track.prizePool && (
                        <Badge variant="secondary">{track.prizePool}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
