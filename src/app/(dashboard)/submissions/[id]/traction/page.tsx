"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { submissionsService, tractionService } from "@/services";
import type {
  Submission,
  SubmissionTraction,
  TractionSnapshot,
  TractionMilestone,
} from "@/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TractionConfigForm } from "@/components/traction/traction-config-form";
import { MetricsForm } from "@/components/traction/metrics-form";
import { MetricsHistory } from "@/components/traction/metrics-history";
import { MilestonesList } from "@/components/traction/milestones-list";
import { ArrowLeft, Loader2, BarChart3, Settings, Trophy } from "lucide-react";

interface TractionPageProps {
  params: Promise<{ id: string }>;
}

export default function TractionPage({ params }: TractionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [traction, setTraction] = useState<SubmissionTraction | null>(null);
  const [snapshots, setSnapshots] = useState<TractionSnapshot[]>([]);
  const [milestones, setMilestones] = useState<TractionMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle GA connection success from OAuth callback
  useEffect(() => {
    if (searchParams.get("ga_connected") === "true") {
      toast.success("Google Analytics connected successfully");
      // Remove query param from URL
      router.replace(`/submissions/${id}/traction`, { scroll: false });
    }
  }, [searchParams, id, router]);

  useEffect(() => {
    async function loadData() {
      const { data: submissionData } = await submissionsService.getById(id);

      if (!submissionData) {
        setIsLoading(false);
        return;
      }

      setSubmission(submissionData);

      // Load traction data in parallel
      const [tractionResult, snapshotsResult, milestonesResult] = await Promise.all([
        tractionService.getTraction(id),
        tractionService.getSnapshots(id),
        tractionService.getMilestones(id),
      ]);

      if (tractionResult.success) setTraction(tractionResult.data);
      if (snapshotsResult.success) setSnapshots(snapshotsResult.data);
      if (milestonesResult.success) setMilestones(milestonesResult.data);

      setIsLoading(false);
    }
    loadData();
  }, [id]);

  // Handle loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle not found
  if (!submission) {
    notFound();
  }

  // Check if user is team member, solo owner, or admin
  const isTeamMember = submission.team?.members.some((m) => m.userId === user?.id);
  const isSoloOwner = !submission.teamId && submission.createdBy === user?.id;
  const isAdmin = user?.role === "admin";
  const hasAccess = isTeamMember || isSoloOwner || isAdmin;

  // Redirect if not authorized
  if (!hasAccess) {
    router.push("/submissions");
    return null;
  }

  const handleTractionUpdate = (updated: SubmissionTraction) => {
    setTraction(updated);
  };

  const handleSnapshotCreated = (snapshot: TractionSnapshot) => {
    setSnapshots((prev) => [snapshot, ...prev]);
  };

  const handleMilestonesChange = (updated: TractionMilestone[]) => {
    setMilestones(updated);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Submissions", href: "/submissions" },
          { label: submission.title, href: `/submissions/${id}` },
          { label: "Traction" },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/submissions/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Traction Tracking</h1>
              <p className="text-muted-foreground">{submission.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <MetricsForm
            submissionId={id}
            latestSnapshot={snapshots[0] || null}
            onSnapshotCreated={handleSnapshotCreated}
          />
          <MetricsHistory snapshots={snapshots} />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestonesList
            submissionId={id}
            milestones={milestones}
            onMilestonesChange={handleMilestonesChange}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="settings">
          <TractionConfigForm
            submissionId={id}
            traction={traction}
            onUpdate={handleTractionUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
