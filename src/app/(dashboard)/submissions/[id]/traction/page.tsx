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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TractionConfigForm } from "@/components/traction/traction-config-form";
import { MetricsForm } from "@/components/traction/metrics-form";
import { MetricsHistory } from "@/components/traction/metrics-history";
import { MilestonesList } from "@/components/traction/milestones-list";
import { ArrowLeft, Loader2 } from "lucide-react";

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

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    notFound();
  }

  const isTeamMember = submission.team?.members.some((m) => m.userId === user?.id);
  const isSoloOwner = !submission.teamId && submission.createdBy === user?.id;
  const isAdmin = user?.role === "admin";
  const hasAccess = isTeamMember || isSoloOwner || isAdmin;

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
    <div className="space-y-10">
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
      <div className="flex items-center gap-3">
        <Link
          href={`/submissions/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Traction</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{submission.title}</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center divide-x">
        <div className="pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {snapshots.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Snapshots</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {milestones.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Milestones</div>
        </div>
        <div className="pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {milestones.filter((m) => m.achievedAt).length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-8">
        <TabsList variant="line">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="metrics" className="space-y-8">
          {!isAdmin && (
            <MetricsForm
              submissionId={id}
              latestSnapshot={snapshots[0] || null}
              onSnapshotCreated={handleSnapshotCreated}
            />
          )}
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

        {!isAdmin && (
          <TabsContent value="settings" className="space-y-8">
            <TractionConfigForm
              submissionId={id}
              traction={traction}
              onUpdate={handleTractionUpdate}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
