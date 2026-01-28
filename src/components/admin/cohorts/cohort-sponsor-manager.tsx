"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, X, Building2 } from "lucide-react";
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
}

const tierOptions: { value: SponsorTier; label: string }[] = [
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "community", label: "Community" },
];

const tierColors: Record<SponsorTier, string> = {
  platinum: "bg-slate-200 text-slate-800",
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-600",
  bronze: "bg-orange-100 text-orange-800",
  community: "bg-green-100 text-green-800",
};

export function CohortSponsorManager({
  sponsors,
  onChange,
  availableOrgs,
  disabled = false,
}: CohortSponsorManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
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

  // Filter out orgs that are already added
  const unaddedOrgs = availableOrgs.filter(
    (org) => !sponsors.some((s) => s.sponsorOrgId === org.id)
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Sponsors</Label>
        {!isAdding && unaddedOrgs.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Sponsor
          </Button>
        )}
      </div>

      {sponsors.length === 0 && !isAdding && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No sponsors added yet. Add sponsors to support this cohort.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Sponsors */}
      <div className="space-y-3">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.sponsorOrgId}>
            <CardContent className="p-4">
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
                    <p className="font-medium">{sponsor.sponsorOrg.name}</p>
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
                          <Badge className={tierColors[opt.value]}>
                            {opt.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show bounty info as read-only - sponsor sets this */}
                  {sponsor.prizePoolContribution > 0 && (
                    <Badge variant="outline" className="text-sm">
                      ${sponsor.prizePoolContribution.toLocaleString()} bounty
                    </Badge>
                  )}
                  {sponsor.hasDedicatedTrack && (
                    <Badge variant="secondary" className="text-sm">
                      Has Track
                    </Badge>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSponsor(sponsor.sponsorOrgId)}
                    disabled={disabled}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Sponsor Form */}
      {isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select Organization</Label>
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
                </div>

                <div className="space-y-2">
                  <Label>Tier</Label>
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
                >
                  Add Sponsor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show add button at bottom if some sponsors exist */}
      {sponsors.length > 0 && !isAdding && unaddedOrgs.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Another Sponsor
        </Button>
      )}

      {unaddedOrgs.length === 0 && sponsors.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          All sponsor organizations have been added to this cohort.
        </p>
      )}
    </div>
  );
}
