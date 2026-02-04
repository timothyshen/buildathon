"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackSchema, type TrackFormData } from "@/lib/schemas";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Track, Cohort } from "@/types";

interface TrackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: Track;
  onSubmit: (data: TrackFormData) => void;
  cohorts: Cohort[];
  allowedCohortIds?: string[];
}

export function TrackForm({
  open,
  onOpenChange,
  track,
  onSubmit,
  cohorts,
  allowedCohortIds,
}: TrackFormProps) {
  const [requirements, setRequirements] = useState<string[]>(
    track?.requirements || [""]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackSchema),
    defaultValues: track
      ? {
          name: track.name,
          description: track.description,
          prizePool: track.prizePool || "",
          cohortId: track.cohortId,
          requirements: track.requirements,
        }
      : {
          cohortId: allowedCohortIds?.[0] || "",
        },
  });

  const availableCohorts = allowedCohortIds
    ? cohorts.filter((c) => allowedCohortIds.includes(c.id))
    : cohorts;

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const onFormSubmit = (data: TrackFormData) => {
    const filteredRequirements = requirements.filter((r) => r.trim() !== "");
    onSubmit({ ...data, requirements: filteredRequirements });
    reset();
    setRequirements([""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{track ? "Edit Track" : "Create Track"}</DialogTitle>
          <DialogDescription>
            {track ? "Update track details" : "Create a new bounty track"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Track Name *</Label>
              <Input id="name" {...register("name")} placeholder="AI Agents" />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohortId">Cohort *</Label>
              <Select
                value={watch("cohortId")}
                onValueChange={(value) => setValue("cohortId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {availableCohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cohortId && (
                <p className="text-sm text-red-500">{errors.cohortId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What should participants build for this track?"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizePool">Prize Pool</Label>
            <Input
              id="prizePool"
              {...register("prizePool")}
              placeholder="$5,000"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Requirements</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder="Must use Story Protocol SDK"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRequirement(index)}
                    disabled={requirements.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{track ? "Save Changes" : "Create Track"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
