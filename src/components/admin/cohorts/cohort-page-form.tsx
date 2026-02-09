"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cohortSchema, type CohortFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUploader } from "@/components/ui/image-uploader";
import { CohortSponsorManager, type CohortSponsorInput } from "./cohort-sponsor-manager";
import { PlusCircle, Trash2, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import type { Cohort, SponsorOrg } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";
import type { SponsorOrgFormData } from "@/lib/schemas";

interface CohortPageFormProps {
  cohort?: Cohort;
  cohortSponsors?: CohortSponsorWithOrg[];
  sponsorOrgs: SponsorOrg[];
  onSave: (data: CohortFormData, sponsors: CohortSponsorInput[]) => Promise<void>;
  onDone: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  onCreateOrg?: (data: SponsorOrgFormData) => Promise<SponsorOrg | null>;
}

const steps = ["Basic Info", "Dates", "Settings", "Prizes", "Sponsors"];

export function CohortPageForm({
  cohort,
  cohortSponsors = [],
  sponsorOrgs,
  onSave,
  onDone,
  onCancel,
  isLoading = false,
  onCreateOrg,
}: CohortPageFormProps) {
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState(cohort?.description || "");
  const [prizes, setPrizes] = useState<{ place: string; amount: string; description?: string }[]>(
    cohort?.prizes || [{ place: "1st", amount: "", description: "" }]
  );
  const [sponsors, setSponsors] = useState<CohortSponsorInput[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    getValues,
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
        }
      : {
          status: "draft",
          isPublic: false,
          maxTeamSize: 5,
          bannerImage: "",
        },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("slug", generateSlug(e.target.value));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setValue("description", value);
  };

  const performSave = useCallback(async (sponsorsList: CohortSponsorInput[]) => {
    setSaveStatus("saving");
    try {
      const formData = getValues();
      await onSave({ ...formData, prizes }, sponsorsList);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      toast.error("Failed to save changes");
    }
  }, [getValues, onSave, prizes]);

  const nextStep = async () => {
    const fieldsToValidate: (keyof CohortFormData)[][] = [
      ["name", "slug", "description"],
      ["startDate", "endDate", "submissionDeadline", "judgingStart", "judgingEnd"],
      ["status", "isPublic", "maxTeamSize"],
      [], // Prizes - no form validation needed
      [], // Sponsors - no form validation needed
    ];

    const isValid = await trigger(fieldsToValidate[step]);
    if (!isValid) return;

    const nextIndex = step + 1;

    // Auto-save when entering the sponsors step (last step)
    if (nextIndex === steps.length - 1) {
      // Validate all fields before saving
      const allValid = await trigger();
      if (!allValid) return;
      await performSave(sponsors);
    }

    setStep(nextIndex);
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSponsorsChange = useCallback((newSponsors: CohortSponsorInput[]) => {
    setSponsors(newSponsors);
    // Debounce auto-save when on the sponsors step
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSave(newSponsors);
    }, 800);
  }, [performSave]);

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
    await onSave({ ...data, prizes }, sponsors);
  };

  // Map field names to their step index so we can navigate to the right step on validation error
  const fieldStepMap: Record<string, number> = {
    name: 0, slug: 0, description: 0, tagline: 0, bannerImage: 0,
    startDate: 1, endDate: 1, submissionDeadline: 1, judgingStart: 1, judgingEnd: 1,
    status: 2, isPublic: 2, maxTeamSize: 2,
  };

  const onValidationError = useCallback((fieldErrors: FieldErrors<CohortFormData>) => {
    const firstErrorField = Object.keys(fieldErrors)[0];
    if (firstErrorField) {
      const targetStep = fieldStepMap[firstErrorField] ?? 0;
      setStep(targetStep);
      const errorMessage = fieldErrors[firstErrorField as keyof CohortFormData]?.message;
      toast.error(errorMessage || `Please fix the errors in "${steps[targetStep]}"`);
    }
  }, []);

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
                    ? "bg-foreground text-background"
                    : isClickable
                    ? "bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  i === step ? "bg-background/20" : ""
                }`}>
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

      <form onSubmit={handleSubmit(onFormSubmit, onValidationError)} className="space-y-6">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">Basic Information</h3>
            <div className="rounded-xl border p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Name *</Label>
                  <Input
                    id="name"
                    {...register("name", {
                      onChange: handleNameChange,
                    })}
                    placeholder="SWA Summer 2024"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-xs text-muted-foreground">Slug *</Label>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="swa-summer-2024"
                  />
                  {errors.slug && (
                    <p className="text-xs text-destructive">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-xs text-muted-foreground">Tagline</Label>
                <Input
                  id="tagline"
                  {...register("tagline")}
                  placeholder="Build the future of IP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs text-muted-foreground">Description *</Label>
                <RichTextEditor
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Describe this buildathon..."
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <ImageUploader
                  value={watch("bannerImage") || undefined}
                  onChange={(url) => setValue("bannerImage", url, { shouldDirty: true })}
                  onRemove={() => setValue("bannerImage", "", { shouldDirty: true })}
                  bucket="banners"
                  label="Banner Image"
                  aspectRatio="16/9"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 1 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">Timeline</h3>
            <div className="rounded-xl border p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date *</Label>
                  <Input id="startDate" type="date" lang="en" {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-xs text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date *</Label>
                  <Input id="endDate" type="date" lang="en" {...register("endDate")} />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionDeadline" className="text-xs text-muted-foreground">Submission Deadline *</Label>
                <Input
                  id="submissionDeadline"
                  type="datetime-local"
                  lang="en"
                  {...register("submissionDeadline")}
                />
                {errors.submissionDeadline && (
                  <p className="text-xs text-destructive">{errors.submissionDeadline.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart" className="text-xs text-muted-foreground">Judging Start *</Label>
                  <Input
                    id="judgingStart"
                    type="datetime-local"
                    lang="en"
                    {...register("judgingStart")}
                  />
                  {errors.judgingStart && (
                    <p className="text-xs text-destructive">{errors.judgingStart.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judgingEnd" className="text-xs text-muted-foreground">Judging End *</Label>
                  <Input
                    id="judgingEnd"
                    type="datetime-local"
                    lang="en"
                    {...register("judgingEnd")}
                  />
                  {errors.judgingEnd && (
                    <p className="text-xs text-destructive">{errors.judgingEnd.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 2 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">Settings</h3>
            <div className="rounded-xl border p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
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
                <Label htmlFor="maxTeamSize" className="text-xs text-muted-foreground">Max Team Size</Label>
                <Input
                  id="maxTeamSize"
                  type="number"
                  min={1}
                  max={10}
                  {...register("maxTeamSize", { valueAsNumber: true })}
                />
                {errors.maxTeamSize && (
                  <p className="text-xs text-destructive">{errors.maxTeamSize.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={watch("isPublic")}
                  onCheckedChange={(checked) => setValue("isPublic", !!checked)}
                />
                <Label htmlFor="isPublic" className="text-xs text-muted-foreground">Make this cohort public</Label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Prizes */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Prizes</h3>
              <Button type="button" variant="ghost" size="sm" onClick={addPrize}>
                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                Add Prize
              </Button>
            </div>
            <div className="rounded-xl border p-5 space-y-3">
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
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Sponsors */}
        {step === 4 && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">Sponsors</h3>
            <CohortSponsorManager
              sponsors={sponsors}
              onChange={handleSponsorsChange}
              availableOrgs={sponsorOrgs}
              disabled={isLoading}
              onCreateOrg={onCreateOrg}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {/* Auto-save status indicator on sponsors step */}
            {step === steps.length - 1 && saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            )}
            {step === steps.length - 1 && saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}

            {step > 0 && (
              <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>
            )}

            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} disabled={isLoading || saveStatus === "saving"} className="bg-foreground text-background hover:bg-foreground/90">
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="button" onClick={onDone} disabled={isLoading || saveStatus === "saving"} className="bg-foreground text-background hover:bg-foreground/90">
                Done
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
