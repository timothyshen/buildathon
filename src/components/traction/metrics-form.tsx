"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { tractionService } from "@/services";
import type { TractionSnapshot } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const metricsSchema = z.object({
  reportedDau: z.string().optional(),
  reportedMau: z.string().optional(),
  reportedMonthlyVisits: z.string().optional(),
  twitterFollowers: z.string().optional(),
});

type MetricsFormData = z.infer<typeof metricsSchema>;

interface MetricsFormProps {
  submissionId: string;
  latestSnapshot: TractionSnapshot | null;
  onSnapshotCreated: (snapshot: TractionSnapshot) => void;
}

export function MetricsForm({
  submissionId,
  latestSnapshot,
  onSnapshotCreated,
}: MetricsFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MetricsFormData>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      reportedDau: latestSnapshot?.reportedDau?.toString() ?? "",
      reportedMau: latestSnapshot?.reportedMau?.toString() ?? "",
      reportedMonthlyVisits: latestSnapshot?.reportedMonthlyVisits?.toString() ?? "",
      twitterFollowers: latestSnapshot?.twitterFollowers?.toString() ?? "",
    },
  });

  const onSubmit = async (data: MetricsFormData) => {
    setIsSaving(true);

    const result = await tractionService.createSnapshot(submissionId, {
      snapshotDate: new Date(),
      dataSource: "manual",
      reportedDau: data.reportedDau ? parseInt(data.reportedDau, 10) : undefined,
      reportedMau: data.reportedMau ? parseInt(data.reportedMau, 10) : undefined,
      reportedMonthlyVisits: data.reportedMonthlyVisits
        ? parseInt(data.reportedMonthlyVisits, 10)
        : undefined,
      twitterFollowers: data.twitterFollowers
        ? parseInt(data.twitterFollowers, 10)
        : undefined,
    });

    if (result.success) {
      toast.success("Metrics snapshot saved");
      onSnapshotCreated(result.data);
      reset({
        reportedDau: result.data.reportedDau?.toString() ?? "",
        reportedMau: result.data.reportedMau?.toString() ?? "",
        reportedMonthlyVisits: result.data.reportedMonthlyVisits?.toString() ?? "",
        twitterFollowers: result.data.twitterFollowers?.toString() ?? "",
      });
    } else {
      toast.error(result.error || "Failed to save metrics");
    }

    setIsSaving(false);
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="rounded-xl border p-5 space-y-6">
      <div>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Report Metrics
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Snapshot for {today}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Usage Metrics */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Usage
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reportedDau" className="text-xs text-muted-foreground">
                Daily Active Users (DAU)
              </Label>
              <Input
                id="reportedDau"
                type="number"
                min="0"
                {...register("reportedDau")}
                placeholder="0"
              />
              {errors.reportedDau && (
                <p className="text-xs text-destructive">{errors.reportedDau.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reportedMau" className="text-xs text-muted-foreground">
                Monthly Active Users (MAU)
              </Label>
              <Input
                id="reportedMau"
                type="number"
                min="0"
                {...register("reportedMau")}
                placeholder="0"
              />
              {errors.reportedMau && (
                <p className="text-xs text-destructive">{errors.reportedMau.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Website Traffic */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Website Traffic
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reportedMonthlyVisits" className="text-xs text-muted-foreground">
              Monthly Visits
            </Label>
            <Input
              id="reportedMonthlyVisits"
              type="number"
              min="0"
              {...register("reportedMonthlyVisits")}
              placeholder="0"
            />
            {errors.reportedMonthlyVisits && (
              <p className="text-xs text-destructive">{errors.reportedMonthlyVisits.message}</p>
            )}
          </div>
        </div>

        {/* Social Metrics */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Social
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="twitterFollowers" className="text-xs text-muted-foreground">
              Twitter Followers
            </Label>
            <Input
              id="twitterFollowers"
              type="number"
              min="0"
              {...register("twitterFollowers")}
              placeholder="0"
            />
            {errors.twitterFollowers && (
              <p className="text-xs text-destructive">{errors.twitterFollowers.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Snapshot"
          )}
        </Button>
      </form>
    </section>
  );
}
