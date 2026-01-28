"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cohortSchema, type CohortFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CohortSponsorManager, type CohortSponsorInput } from "./cohort-sponsor-manager";
import { PlusCircle, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Cohort, SponsorOrg } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";

interface CohortPageFormProps {
  cohort?: Cohort;
  cohortSponsors?: CohortSponsorWithOrg[];
  sponsorOrgs: SponsorOrg[];
  onSubmit: (data: CohortFormData, sponsors: CohortSponsorInput[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const steps = ["Basic Info", "Dates", "Settings", "Prizes", "Sponsors"];

export function CohortPageForm({
  cohort,
  cohortSponsors = [],
  sponsorOrgs,
  onSubmit,
  onCancel,
  isLoading = false,
}: CohortPageFormProps) {
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState(cohort?.description || "");
  const [prizes, setPrizes] = useState<{ place: string; amount: string; description?: string }[]>(
    cohort?.prizes || [{ place: "1st", amount: "", description: "" }]
  );
  const [sponsors, setSponsors] = useState<CohortSponsorInput[]>([]);

  // Initialize sponsors from cohortSponsors
  useEffect(() => {
    if (cohortSponsors.length > 0) {
      const initialSponsors: CohortSponsorInput[] = cohortSponsors.map((cs) => ({
        sponsorOrgId: cs.id, // cs is CohortSponsorWithOrg which extends SponsorOrg
        sponsorOrg: {
          id: cs.id,
          name: cs.name,
          logo: cs.logo,
          website: cs.website,
          description: cs.description,
          contactName: cs.contactName,
          contactEmail: cs.contactEmail,
          createdAt: cs.createdAt,
          updatedAt: cs.updatedAt,
        },
        tier: cs.tier,
        prizePoolContribution: cs.prizePoolContribution,
        hasDedicatedTrack: cs.hasDedicatedTrack,
        isNew: false,
      }));
      setSponsors(initialSponsors);
    }
  }, [cohortSponsors]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<CohortFormData>({
    resolver: zodResolver(cohortSchema),
    defaultValues: cohort
      ? {
          name: cohort.name,
          slug: cohort.slug,
          description: cohort.description,
          tagline: cohort.tagline || "",
          bannerImage: cohort.bannerImage || "",
          startDate: cohort.startDate.toISOString().split("T")[0],
          endDate: cohort.endDate.toISOString().split("T")[0],
          submissionDeadline: cohort.submissionDeadline.toISOString().slice(0, 16),
          judgingStart: cohort.judgingStart.toISOString().slice(0, 16),
          judgingEnd: cohort.judgingEnd.toISOString().slice(0, 16),
          status: cohort.status,
          isPublic: cohort.isPublic,
          maxTeamSize: cohort.maxTeamSize,
          prizes: cohort.prizes,
        }
      : {
          status: "draft",
          isPublic: false,
          maxTeamSize: 5,
        },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    if (!cohort) {
      setValue("slug", generateSlug(name));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setValue("description", value);
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof CohortFormData)[][] = [
      ["name", "slug", "description"],
      ["startDate", "endDate", "submissionDeadline", "judgingStart", "judgingEnd"],
      ["status", "isPublic", "maxTeamSize"],
      [], // Prizes - no form validation needed
      [], // Sponsors - no form validation needed
    ];

    const isValid = await trigger(fieldsToValidate[step]);
    if (isValid) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const addPrize = () => {
    const places = ["1st", "2nd", "3rd", "4th", "5th"];
    const nextPlace = places[prizes.length] || `${prizes.length + 1}th`;
    setPrizes([...prizes, { place: nextPlace, amount: "", description: "" }]);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index: number, field: string, value: string) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const onFormSubmit = async (data: CohortFormData) => {
    await onSubmit({ ...data, prizes }, sponsors);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {steps.map((s, i) => {
            // In edit mode, allow clicking any step. In create mode, only allow previous steps.
            const isClickable = cohort ? true : i < step;
            const isDisabled = cohort ? false : i > step;

            return (
              <button
                key={s}
                type="button"
                onClick={() => isClickable && setStep(i)}
                disabled={isDisabled}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : isClickable
                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    onChange={handleNameChange}
                    placeholder="SWA Summer 2024"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="swa-summer-2024"
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  {...register("tagline")}
                  placeholder="Build the future of IP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Describe this buildathon..."
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">Banner Image URL</Label>
                <Input
                  id="bannerImage"
                  {...register("bannerImage")}
                  type="url"
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Dates */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" lang="en" {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" lang="en" {...register("endDate")} />
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                <Input
                  id="submissionDeadline"
                  type="datetime-local"
                  lang="en"
                  {...register("submissionDeadline")}
                />
                {errors.submissionDeadline && (
                  <p className="text-sm text-destructive">{errors.submissionDeadline.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart">Judging Start *</Label>
                  <Input
                    id="judgingStart"
                    type="datetime-local"
                    lang="en"
                    {...register("judgingStart")}
                  />
                  {errors.judgingStart && (
                    <p className="text-sm text-destructive">{errors.judgingStart.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judgingEnd">Judging End *</Label>
                  <Input
                    id="judgingEnd"
                    type="datetime-local"
                    lang="en"
                    {...register("judgingEnd")}
                  />
                  {errors.judgingEnd && (
                    <p className="text-sm text-destructive">{errors.judgingEnd.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Settings */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as CohortFormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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

              <div className="space-y-2">
                <Label htmlFor="maxTeamSize">Max Team Size</Label>
                <Input
                  id="maxTeamSize"
                  type="number"
                  min={1}
                  max={10}
                  {...register("maxTeamSize", { valueAsNumber: true })}
                />
                {errors.maxTeamSize && (
                  <p className="text-sm text-destructive">{errors.maxTeamSize.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={watch("isPublic")}
                  onCheckedChange={(checked) => setValue("isPublic", !!checked)}
                />
                <Label htmlFor="isPublic">Make this cohort public</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Prizes */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prizes</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addPrize}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Prize
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {prizes.map((prize, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                  <div className="w-24">
                    <Label className="sr-only">Place</Label>
                    <Input
                      value={prize.place}
                      onChange={(e) => updatePrize(index, "place", e.target.value)}
                      placeholder="1st"
                    />
                  </div>
                  <div className="w-32">
                    <Label className="sr-only">Amount</Label>
                    <Input
                      value={prize.amount}
                      onChange={(e) => updatePrize(index, "amount", e.target.value)}
                      placeholder="$10,000"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="sr-only">Description</Label>
                    <Input
                      value={prize.description || ""}
                      onChange={(e) => updatePrize(index, "description", e.target.value)}
                      placeholder="Prize description (optional)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrize(index)}
                    disabled={prizes.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Sponsors */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Sponsors</CardTitle>
            </CardHeader>
            <CardContent>
              <CohortSponsorManager
                sponsors={sponsors}
                onChange={setSponsors}
                availableOrgs={sponsorOrgs}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}

            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} disabled={isLoading}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : cohort ? (
                  "Save Changes"
                ) : (
                  "Create Cohort"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
