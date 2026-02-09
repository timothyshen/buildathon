"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { sponsorSchema, type SponsorFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { SponsorOrg, CohortSponsor, Cohort } from "@/types";

interface SponsorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor?: SponsorOrg;
  cohortSponsor?: CohortSponsor;
  onSubmit: (data: SponsorFormData) => void;
  defaultCohortId?: string;
  cohorts: Cohort[];
}

export function SponsorForm({
  open,
  onOpenChange,
  sponsor,
  cohortSponsor,
  onSubmit,
  defaultCohortId,
  cohorts,
}: SponsorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: sponsor
      ? {
          name: sponsor.name,
          logo: sponsor.logo,
          website: sponsor.website,
          description: sponsor.description,
          tier: cohortSponsor?.tier || ("silver" as const),
          prizePoolContribution: cohortSponsor?.prizePoolContribution || 0,
          hasDedicatedTrack: cohortSponsor?.hasDedicatedTrack || false,
          contactName: sponsor.contactName,
          contactEmail: sponsor.contactEmail,
          cohortId: cohortSponsor?.cohortId || defaultCohortId || "",
        }
      : {
          tier: "silver" as const,
          prizePoolContribution: 0,
          hasDedicatedTrack: false,
          cohortId: defaultCohortId || "",
        },
  });

  // Reset form values when dialog opens with different sponsor data
  useEffect(() => {
    if (open) {
      reset(
        sponsor
          ? {
              name: sponsor.name,
              logo: sponsor.logo,
              website: sponsor.website,
              description: sponsor.description,
              tier: cohortSponsor?.tier || ("silver" as const),
              prizePoolContribution: cohortSponsor?.prizePoolContribution || 0,
              hasDedicatedTrack: cohortSponsor?.hasDedicatedTrack || false,
              contactName: sponsor.contactName,
              contactEmail: sponsor.contactEmail,
              cohortId: cohortSponsor?.cohortId || defaultCohortId || "",
            }
          : {
              name: "",
              logo: "",
              website: "",
              description: "",
              tier: "silver" as const,
              prizePoolContribution: 0,
              hasDedicatedTrack: false,
              contactName: "",
              contactEmail: "",
              cohortId: defaultCohortId || "",
            }
      );
    }
  }, [open, sponsor, cohortSponsor, defaultCohortId, reset]);

  const onFormSubmit = (data: SponsorFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          <DialogDescription>
            {sponsor
              ? "Update sponsor organization details"
              : "Add a new sponsor organization to this cohort"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">Organization Name *</Label>
              <Input id="name" {...register("name")} placeholder="Acme Corp" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohortId" className="text-xs text-muted-foreground">Cohort *</Label>
              <Select
                value={watch("cohortId")}
                onValueChange={(value) => setValue("cohortId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cohortId && (
                <p className="text-xs text-destructive">{errors.cohortId.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-xs text-muted-foreground">Logo URL</Label>
              <Input id="logo" {...register("logo")} type="url" placeholder="https://..." />
              {errors.logo && (
                <p className="text-xs text-destructive">{errors.logo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-xs text-muted-foreground">Website</Label>
              <Input
                id="website"
                {...register("website")}
                type="url"
                placeholder="https://..."
              />
              {errors.website && (
                <p className="text-xs text-destructive">{errors.website.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="About this sponsor..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tier" className="text-xs text-muted-foreground">Tier</Label>
              <Select
                value={watch("tier")}
                onValueChange={(value) =>
                  setValue("tier", value as SponsorFormData["tier"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizePoolContribution" className="text-xs text-muted-foreground">Prize Pool Contribution ($)</Label>
              <Input
                id="prizePoolContribution"
                type="number"
                min={0}
                {...register("prizePoolContribution", { valueAsNumber: true })}
              />
              {errors.prizePoolContribution && (
                <p className="text-xs text-destructive">
                  {errors.prizePoolContribution.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDedicatedTrack"
              checked={watch("hasDedicatedTrack")}
              onCheckedChange={(checked) => setValue("hasDedicatedTrack", !!checked)}
            />
            <Label htmlFor="hasDedicatedTrack">Has dedicated track</Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-xs text-muted-foreground">Contact Name *</Label>
              <Input
                id="contactName"
                {...register("contactName")}
                placeholder="John Doe"
              />
              {errors.contactName && (
                <p className="text-xs text-destructive">{errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-xs text-muted-foreground">Contact Email *</Label>
              <Input
                id="contactEmail"
                {...register("contactEmail")}
                type="email"
                placeholder="john@example.com"
              />
              {errors.contactEmail && (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90">{sponsor ? "Save Changes" : "Add Sponsor"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
