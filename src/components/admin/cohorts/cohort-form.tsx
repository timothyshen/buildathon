"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cohortSchema, type CohortFormData } from "@/lib/schemas";
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
import { PlusCircle, Trash2 } from "lucide-react";
import type { Cohort } from "@/types";

interface CohortFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohort?: Cohort;
  onSubmit: (data: CohortFormData) => void;
}

const steps = ["Basic Info", "Dates", "Settings", "Prizes"];

export function CohortForm({ open, onOpenChange, cohort, onSubmit }: CohortFormProps) {
  const [step, setStep] = useState(0);
  const [prizes, setPrizes] = useState<{ place: string; amount: string; description?: string }[]>(
    cohort?.prizes || [{ place: "1st", amount: "", description: "" }]
  );

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

  const nextStep = async () => {
    const fieldsToValidate: (keyof CohortFormData)[][] = [
      ["name", "slug", "description"],
      ["startDate", "endDate", "submissionDeadline", "judgingStart", "judgingEnd"],
      ["status", "isPublic", "maxTeamSize"],
      [],
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

  const onFormSubmit = (data: CohortFormData) => {
    onSubmit({ ...data, prizes });
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cohort ? "Edit Cohort" : "Create Cohort"}</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {steps.length}: {steps[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-violet-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  onChange={handleNameChange}
                  placeholder="SWA Summer 2024"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
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
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
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
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe this buildathon..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
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
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                <Input
                  id="submissionDeadline"
                  type="datetime-local"
                  {...register("submissionDeadline")}
                />
                {errors.submissionDeadline && (
                  <p className="text-sm text-red-500">{errors.submissionDeadline.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart">Judging Start *</Label>
                  <Input
                    id="judgingStart"
                    type="datetime-local"
                    {...register("judgingStart")}
                  />
                  {errors.judgingStart && (
                    <p className="text-sm text-red-500">{errors.judgingStart.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judgingEnd">Judging End *</Label>
                  <Input
                    id="judgingEnd"
                    type="datetime-local"
                    {...register("judgingEnd")}
                  />
                  {errors.judgingEnd && (
                    <p className="text-sm text-red-500">{errors.judgingEnd.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
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
                  <p className="text-sm text-red-500">{errors.maxTeamSize.message}</p>
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Prizes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPrize}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Prize
                </Button>
              </div>

              <div className="space-y-3">
                {prizes.map((prize, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
                    <div className="w-20">
                      <Input
                        value={prize.place}
                        onChange={(e) => updatePrize(index, "place", e.target.value)}
                        placeholder="1st"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        value={prize.amount}
                        onChange={(e) => updatePrize(index, "amount", e.target.value)}
                        placeholder="$10,000"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={prize.description || ""}
                        onChange={(e) => updatePrize(index, "description", e.target.value)}
                        placeholder="Description (optional)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrize(index)}
                      disabled={prizes.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 0}
            >
              Previous
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setStep(0);
                }}
              >
                Cancel
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit">
                  {cohort ? "Save Changes" : "Create Cohort"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
