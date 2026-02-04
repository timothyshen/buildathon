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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Globe, BarChart3 } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle>Report Metrics</CardTitle>
        <CardDescription>
          Submit your current metrics for {today}. This creates a snapshot for historical tracking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Usage Metrics */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Users className="h-4 w-4" />
              Usage Metrics
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportedDau" className="text-sm text-muted-foreground">
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
                  <p className="text-sm text-red-500">{errors.reportedDau.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportedMau" className="text-sm text-muted-foreground">
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
                  <p className="text-sm text-red-500">{errors.reportedMau.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Website Traffic */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Globe className="h-4 w-4" />
              Website Traffic
            </Label>

            <div className="space-y-2">
              <Label htmlFor="reportedMonthlyVisits" className="text-sm text-muted-foreground">
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
                <p className="text-sm text-red-500">{errors.reportedMonthlyVisits.message}</p>
              )}
            </div>
          </div>

          {/* Social Metrics */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <BarChart3 className="h-4 w-4" />
              Social Metrics
            </Label>

            <div className="space-y-2">
              <Label htmlFor="twitterFollowers" className="text-sm text-muted-foreground">
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
                <p className="text-sm text-red-500">{errors.twitterFollowers.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
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
      </CardContent>
    </Card>
  );
}
