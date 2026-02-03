"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { tractionService } from "@/services";
import type { TractionMilestone, MilestoneType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trophy,
  Rocket,
  Users,
  DollarSign,
  Handshake,
  Newspaper,
  Award,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  Trash2,
} from "lucide-react";

const milestoneTypes: { value: MilestoneType; label: string; icon: React.ElementType }[] = [
  { value: "testnet_launch", label: "Testnet Launch", icon: Rocket },
  { value: "mainnet_launch", label: "Mainnet Launch", icon: Rocket },
  { value: "first_100_users", label: "First 100 Users", icon: Users },
  { value: "first_1000_users", label: "First 1,000 Users", icon: Users },
  { value: "first_10000_users", label: "First 10,000 Users", icon: Users },
  { value: "funding_raised", label: "Funding Raised", icon: DollarSign },
  { value: "partnership", label: "Partnership", icon: Handshake },
  { value: "media_feature", label: "Media Feature", icon: Newspaper },
  { value: "award", label: "Award", icon: Award },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const milestoneSchema = z.object({
  milestoneType: z.enum([
    "testnet_launch",
    "mainnet_launch",
    "first_100_users",
    "first_1000_users",
    "first_10000_users",
    "funding_raised",
    "partnership",
    "media_feature",
    "award",
    "other",
  ]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  achievedAt: z.string().min(1, "Date is required"),
  proofUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

interface MilestonesListProps {
  submissionId: string;
  milestones: TractionMilestone[];
  onMilestonesChange: (milestones: TractionMilestone[]) => void;
  isAdmin?: boolean;
}

export function MilestonesList({
  submissionId,
  milestones,
  onMilestonesChange,
  isAdmin = false,
}: MilestonesListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      milestoneType: "other",
      title: "",
      description: "",
      achievedAt: new Date().toISOString().split("T")[0],
      proofUrl: "",
    },
  });

  const selectedType = watch("milestoneType");

  const onSubmit = async (data: MilestoneFormData) => {
    setIsSaving(true);

    const result = await tractionService.createMilestone(submissionId, {
      milestoneType: data.milestoneType,
      title: data.title,
      description: data.description || undefined,
      achievedAt: new Date(data.achievedAt),
      proofUrl: data.proofUrl || undefined,
    });

    if (result.success) {
      toast.success("Milestone added");
      onMilestonesChange([result.data, ...milestones]);
      reset();
      setIsDialogOpen(false);
    } else {
      toast.error(result.error || "Failed to add milestone");
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    const result = await tractionService.deleteMilestone(id);

    if (result.success) {
      toast.success("Milestone deleted");
      onMilestonesChange(milestones.filter((m) => m.id !== id));
    } else {
      toast.error(result.error || "Failed to delete milestone");
    }

    setDeletingId(null);
  };

  const handleVerify = async (id: string, verified: boolean) => {
    const result = await tractionService.verifyMilestone(id, verified);

    if (result.success) {
      toast.success(verified ? "Milestone verified" : "Verification removed");
      onMilestonesChange(
        milestones.map((m) => (m.id === id ? result.data : m))
      );
    } else {
      toast.error(result.error || "Failed to update verification");
    }
  };

  const getMilestoneIcon = (type: MilestoneType) => {
    const found = milestoneTypes.find((t) => t.value === type);
    return found?.icon || MoreHorizontal;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Milestones
            </CardTitle>
            <CardDescription>
              Track key achievements and progress
            </CardDescription>
          </div>
          {!isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Milestone</DialogTitle>
                <DialogDescription>
                  Record a key achievement for your project
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) =>
                      setValue("milestoneType", value as MilestoneType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {milestoneTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="e.g., Launched on Story Protocol Mainnet"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Add more details about this milestone..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievedAt">Date Achieved</Label>
                  <Input
                    id="achievedAt"
                    type="date"
                    {...register("achievedAt")}
                  />
                  {errors.achievedAt && (
                    <p className="text-sm text-red-500">{errors.achievedAt.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proofUrl">Proof URL (optional)</Label>
                  <Input
                    id="proofUrl"
                    {...register("proofUrl")}
                    placeholder="https://twitter.com/yourproject/status/..."
                  />
                  {errors.proofUrl && (
                    <p className="text-sm text-red-500">{errors.proofUrl.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Add Milestone"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No milestones yet</p>
            {!isAdmin && (
              <p className="text-sm">Add your first achievement to get started</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const Icon = getMilestoneIcon(milestone.milestoneType);
              return (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{milestone.title}</h4>
                      {milestone.verified && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        {new Date(milestone.achievedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {milestone.proofUrl && (
                        <a
                          href={milestone.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Proof
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerify(milestone.id, !milestone.verified)}
                      >
                        {milestone.verified ? "Unverify" : "Verify"}
                      </Button>
                    )}
                    {!isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(milestone.id)}
                        disabled={deletingId === milestone.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingId === milestone.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
