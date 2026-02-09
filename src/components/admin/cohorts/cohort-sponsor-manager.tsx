"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sponsorOrgSchema, type SponsorOrgFormData } from "@/lib/schemas";
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
import { PlusCircle, X, Building2, Loader2 } from "lucide-react";
import type { SponsorOrg, SponsorTier } from "@/types";

// Local type for managing sponsors in the form
export interface CohortSponsorInput {
  sponsorOrgId: string;
  sponsorOrg: SponsorOrg;
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
  isNew?: boolean; // Track if this is a new addition (for syncing)
  existingId?: string; // ID of existing CohortSponsor record (for updates)
}

interface CohortSponsorManagerProps {
  sponsors: CohortSponsorInput[];
  onChange: (sponsors: CohortSponsorInput[]) => void;
  availableOrgs: SponsorOrg[];
  disabled?: boolean;
  onCreateOrg?: (data: SponsorOrgFormData) => Promise<SponsorOrg | null>;
}

const tierOptions: { value: SponsorTier; label: string }[] = [
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "community", label: "Community" },
];

export function CohortSponsorManager({
  sponsors,
  onChange,
  availableOrgs,
  disabled = false,
  onCreateOrg,
}: CohortSponsorManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newSponsor, setNewSponsor] = useState<{
    sponsorOrgId: string;
    tier: SponsorTier;
    prizePoolContribution: number;
    hasDedicatedTrack: boolean;
  }>({
    sponsorOrgId: "",
    tier: "gold",
    prizePoolContribution: 0,
    hasDedicatedTrack: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetOrgForm,
  } = useForm<SponsorOrgFormData>({
    resolver: zodResolver(sponsorOrgSchema),
  });

  // Filter out orgs that are already added
  const unaddedOrgs = availableOrgs.filter(
    (org) => !sponsors.some((s) => s.sponsorOrgId === org.id)
  );

  const canAddSponsor = unaddedOrgs.length > 0 || !!onCreateOrg;

  const handleAddSponsor = () => {
    if (!newSponsor.sponsorOrgId) return;

    const org = availableOrgs.find((o) => o.id === newSponsor.sponsorOrgId);
    if (!org) return;

    const sponsorInput: CohortSponsorInput = {
      sponsorOrgId: org.id,
      sponsorOrg: org,
      tier: newSponsor.tier,
      prizePoolContribution: newSponsor.prizePoolContribution,
      hasDedicatedTrack: newSponsor.hasDedicatedTrack,
      isNew: true,
    };

    onChange([...sponsors, sponsorInput]);
    setNewSponsor({
      sponsorOrgId: "",
      tier: "gold",
      prizePoolContribution: 0,
      hasDedicatedTrack: false,
    });
    setIsAdding(false);
  };

  const handleRemoveSponsor = (sponsorOrgId: string) => {
    onChange(sponsors.filter((s) => s.sponsorOrgId !== sponsorOrgId));
  };

  const handleUpdateSponsor = (
    sponsorOrgId: string,
    updates: Partial<CohortSponsorInput>
  ) => {
    onChange(
      sponsors.map((s) =>
        s.sponsorOrgId === sponsorOrgId ? { ...s, ...updates } : s
      )
    );
  };

  const handleCreateOrg = async (data: SponsorOrgFormData) => {
    if (!onCreateOrg) return;
    setIsCreatingOrg(true);
    try {
      const newOrg = await onCreateOrg(data);
      if (newOrg) {
        setNewSponsor((prev) => ({ ...prev, sponsorOrgId: newOrg.id }));
        setIsCreateOrgOpen(false);
        resetOrgForm();
      }
    } finally {
      setIsCreatingOrg(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Sponsors</span>
        {!isAdding && canAddSponsor && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
          >
            <PlusCircle className="mr-2 h-3.5 w-3.5" />
            Add Sponsor
          </Button>
        )}
      </div>

      {sponsors.length === 0 && !isAdding && (
        <div className="rounded-xl border py-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No sponsors added yet. Add sponsors to support this cohort.
          </p>
        </div>
      )}

      {/* Existing Sponsors */}
      <div className="space-y-3">
        {sponsors.map((sponsor) => (
          <div key={sponsor.sponsorOrgId} className="rounded-xl border py-3 px-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {sponsor.sponsorOrg.logo ? (
                    <img
                      src={sponsor.sponsorOrg.logo}
                      alt={sponsor.sponsorOrg.name}
                      className="h-10 w-10 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{sponsor.sponsorOrg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sponsor.sponsorOrg.contactEmail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={sponsor.tier}
                    onValueChange={(value) =>
                      handleUpdateSponsor(sponsor.sponsorOrgId, {
                        tier: value as SponsorTier,
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tierOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show bounty info as read-only - sponsor sets this */}
                  {sponsor.prizePoolContribution > 0 && (
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      ${sponsor.prizePoolContribution.toLocaleString()}
                    </span>
                  )}
                  {sponsor.hasDedicatedTrack && (
                    <span className="text-xs text-muted-foreground">
                      Has Track
                    </span>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSponsor(sponsor.sponsorOrgId)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
          </div>
        ))}
      </div>

      {/* Add New Sponsor Form */}
      {isAdding && (
        <div className="rounded-xl border border-dashed p-4">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Select Organization</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newSponsor.sponsorOrgId}
                      onValueChange={(value) =>
                        setNewSponsor({ ...newSponsor, sponsorOrgId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a sponsor organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {unaddedOrgs.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            <div className="flex items-center gap-2">
                              {org.logo ? (
                                <img
                                  src={org.logo}
                                  alt={org.name}
                                  className="h-5 w-5 rounded object-contain"
                                />
                              ) : (
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              )}
                              {org.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {onCreateOrg && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCreateOrgOpen(true)}
                        title="Create new organization"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tier</Label>
                  <Select
                    value={newSponsor.tier}
                    onValueChange={(value) =>
                      setNewSponsor({ ...newSponsor, tier: value as SponsorTier })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tierOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Sponsor will configure their bounty and track details from their dashboard.
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewSponsor({
                      sponsorOrgId: "",
                      tier: "gold",
                      prizePoolContribution: 0,
                      hasDedicatedTrack: false,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSponsor}
                  disabled={!newSponsor.sponsorOrgId}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  Add Sponsor
                </Button>
              </div>
            </div>
        </div>
      )}

      {/* Show add button at bottom if some sponsors exist */}
      {sponsors.length > 0 && !isAdding && canAddSponsor && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
        >
          <PlusCircle className="mr-2 h-3.5 w-3.5" />
          Add Another Sponsor
        </Button>
      )}

      {!canAddSponsor && sponsors.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          All sponsor organizations have been added to this cohort.
        </p>
      )}

      {/* Create New Organization Dialog */}
      {onCreateOrg && (
        <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new sponsor organization. You can select it for this cohort after creation.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleCreateOrg)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-xs text-muted-foreground">Organization Name *</Label>
                  <Input id="org-name" {...register("name")} placeholder="Acme Corp" />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-website" className="text-xs text-muted-foreground">Website</Label>
                  <Input id="org-website" {...register("website")} type="url" placeholder="https://..." />
                  {errors.website && (
                    <p className="text-xs text-destructive">{errors.website.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-logo" className="text-xs text-muted-foreground">Logo URL</Label>
                <Input id="org-logo" {...register("logo")} type="url" placeholder="https://..." />
                {errors.logo && (
                  <p className="text-xs text-destructive">{errors.logo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-description" className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  id="org-description"
                  {...register("description")}
                  placeholder="About this organization..."
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-contactName" className="text-xs text-muted-foreground">Contact Name *</Label>
                  <Input id="org-contactName" {...register("contactName")} placeholder="John Doe" />
                  {errors.contactName && (
                    <p className="text-xs text-destructive">{errors.contactName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-contactEmail" className="text-xs text-muted-foreground">Contact Email *</Label>
                  <Input id="org-contactEmail" {...register("contactEmail")} type="email" placeholder="john@example.com" />
                  {errors.contactEmail && (
                    <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOrgOpen(false)} disabled={isCreatingOrg}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingOrg} className="bg-foreground text-background hover:bg-foreground/90">
                  {isCreatingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
