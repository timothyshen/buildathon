"use client";

import { useState, useEffect, useMemo } from "react";
import { sponsorsService, cohortsService, usersService } from "@/services";
import { toast } from "sonner";
import type { SponsorOrg, CohortSponsor, Cohort } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Search, Building2, Loader2, Copy, Check } from "lucide-react";
import { SponsorForm } from "@/components/admin/sponsors/sponsor-form";
import { SponsorTable } from "@/components/admin/sponsors/sponsor-table";
import { InviteSponsorForm } from "@/components/admin/sponsors/invite-sponsor-form";
import type { SponsorFormData, InviteSponsorFormData } from "@/lib/schemas";

export default function AdminSponsorsPage() {
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [cohortSponsors, setCohortSponsors] = useState<CohortSponsor[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorOrg | undefined>();
  const [editingCohortSponsor, setEditingCohortSponsor] = useState<CohortSponsor | undefined>();
  const [invitingSponsor, setInvitingSponsor] = useState<SponsorOrg | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SponsorOrg | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCohort, setFilterCohort] = useState<string>("all");
  const [inviteLinkDialogOpen, setInviteLinkDialogOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [inviteLinkOrg, setInviteLinkOrg] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [orgsResult, cohortSponsorsResult, cohortsResult] = await Promise.all([
        sponsorsService.listOrgs(),
        sponsorsService.listCohortSponsors(),
        cohortsService.list(),
      ]);

      if (orgsResult.success) setSponsorOrgs(orgsResult.data);
      if (cohortSponsorsResult.success) setCohortSponsors(cohortSponsorsResult.data);
      if (cohortsResult.success) setCohorts(cohortsResult.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Get sponsor orgs with their cohort participation info
  // Must be called before any early returns to respect Rules of Hooks
  const sponsorsWithCohorts = useMemo(() => {
    return sponsorOrgs.map(org => {
      const cohortLinks = cohortSponsors.filter(cs => cs.sponsorOrgId === org.id);
      return {
        ...org,
        cohortIds: cohortLinks.map(cs => cs.cohortId),
        totalContribution: cohortLinks.reduce((sum, cs) => sum + cs.prizePoolContribution, 0),
        hasDedicatedTrack: cohortLinks.some(cs => cs.hasDedicatedTrack),
        highestTier: cohortLinks.length > 0
          ? cohortLinks.sort((a, b) => {
              const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3, community: 4 };
              return tierOrder[a.tier] - tierOrder[b.tier];
            })[0].tier
          : null,
      };
    });
  }, [sponsorOrgs, cohortSponsors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleEdit = (sponsor: SponsorOrg) => {
    setEditingSponsor(sponsor);
    // Find the first cohort sponsor record for this org
    const cs = cohortSponsors.find((c) => c.sponsorOrgId === sponsor.id);
    setEditingCohortSponsor(cs);
    setIsFormOpen(true);
  };

  const handleDelete = (sponsor: SponsorOrg) => {
    setDeleteTarget(sponsor);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      const result = await sponsorsService.deleteOrg(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete sponsor");
        setDeleteTarget(null);
        return;
      }
      setSponsorOrgs((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setCohortSponsors((prev) => prev.filter((cs) => cs.sponsorOrgId !== deleteTarget.id));
      toast.success("Sponsor deleted");
      setDeleteTarget(null);
    }
  };

  const handleInvite = (sponsor: SponsorOrg) => {
    setInvitingSponsor(sponsor);
    setIsInviteOpen(true);
  };

  const handleGenerateInviteLink = async (sponsor: SponsorOrg) => {
    setInviteLinkOrg(sponsor.name);
    setGeneratedInviteLink("");
    setCopied(false);
    setInviteLinkDialogOpen(true);
    setIsGeneratingLink(true);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorOrgId: sponsor.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to generate invite link");
        setInviteLinkDialogOpen(false);
        return;
      }

      const link = `${window.location.origin}/register?invite=${data.token}`;
      setGeneratedInviteLink(link);
    } catch {
      toast.error("Failed to generate invite link");
      setInviteLinkDialogOpen(false);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleFormSubmit = async (data: SponsorFormData) => {
    const orgData = {
      name: data.name,
      logo: data.logo || "",
      website: data.website || "",
      description: data.description || "",
      contactName: data.contactName,
      contactEmail: data.contactEmail,
    };

    if (editingSponsor) {
      // Update existing sponsor org
      const result = await sponsorsService.updateOrg(editingSponsor.id, orgData);
      if (!result.success) {
        toast.error(result.error || "Failed to update sponsor");
        return;
      }
      setSponsorOrgs((prev) => prev.map((s) => (s.id === editingSponsor.id ? result.data : s)));

      // Update or create cohort sponsor junction
      const csData = {
        tier: data.tier,
        prizePoolContribution: data.prizePoolContribution,
        hasDedicatedTrack: data.hasDedicatedTrack,
      };

      if (editingCohortSponsor) {
        if (editingCohortSponsor.cohortId === data.cohortId) {
          // Same cohort — update existing record
          const csResult = await sponsorsService.updateCohortSponsor(editingCohortSponsor.id, csData);
          if (csResult.success) {
            setCohortSponsors((prev) =>
              prev.map((cs) => (cs.id === editingCohortSponsor.id ? csResult.data : cs))
            );
          }
        } else {
          // Cohort changed — delete old, create new
          await sponsorsService.deleteCohortSponsor(editingCohortSponsor.id);
          const csResult = await sponsorsService.createCohortSponsor({
            cohortId: data.cohortId,
            sponsorOrgId: editingSponsor.id,
            ...csData,
          });
          if (csResult.success) {
            setCohortSponsors((prev) => [
              ...prev.filter((cs) => cs.id !== editingCohortSponsor.id),
              csResult.data,
            ]);
          }
        }
      } else if (data.cohortId) {
        // No existing cohort sponsor — create new
        const csResult = await sponsorsService.createCohortSponsor({
          cohortId: data.cohortId,
          sponsorOrgId: editingSponsor.id,
          ...csData,
        });
        if (csResult.success) {
          setCohortSponsors((prev) => [...prev, csResult.data]);
        }
      }

      toast.success("Sponsor updated");
    } else {
      // Create new sponsor org
      const orgResult = await sponsorsService.createOrg(orgData);
      if (!orgResult.success) {
        toast.error(orgResult.error || "Failed to create sponsor");
        return;
      }

      // Create cohort sponsor junction
      const csResult = await sponsorsService.createCohortSponsor({
        cohortId: data.cohortId,
        sponsorOrgId: orgResult.data.id,
        tier: data.tier,
        prizePoolContribution: data.prizePoolContribution,
        hasDedicatedTrack: data.hasDedicatedTrack,
      });

      if (!csResult.success) {
        toast.error(csResult.error || "Failed to link sponsor to cohort");
        return;
      }

      setSponsorOrgs((prev) => [...prev, orgResult.data]);
      setCohortSponsors((prev) => [...prev, csResult.data]);
      toast.success("Sponsor created");
    }

    setEditingSponsor(undefined);
    setEditingCohortSponsor(undefined);
    setIsFormOpen(false);
  };

  const handleInviteSubmit = async (data: InviteSponsorFormData) => {
    // Find user by email
    const userResult = await usersService.getByEmail(data.email);
    if (!userResult.success || !userResult.data) {
      toast.error("No user found with that email address");
      return;
    }

    // Assign sponsor role and org to the user
    const updateResult = await usersService.update(userResult.data.id, {
      role: "sponsor",
      sponsorOrgId: data.sponsorId,
    });

    if (!updateResult.success) {
      toast.error(updateResult.error || "Failed to assign sponsor role");
      return;
    }

    toast.success(`${data.name} has been assigned as a sponsor`);
    setInvitingSponsor(undefined);
    setIsInviteOpen(false);
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSponsor(undefined);
      setEditingCohortSponsor(undefined);
    }
  };

  const handleInviteOpenChange = (open: boolean) => {
    setIsInviteOpen(open);
    if (!open) setInvitingSponsor(undefined);
  };

  const filteredSponsors = sponsorsWithCohorts.filter((sponsor) => {
    const matchesSearch =
      sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCohort = filterCohort === "all" || sponsor.cohortIds.includes(filterCohort);
    return matchesSearch && matchesCohort;
  });

  const totalContribution = cohortSponsors.reduce(
    (sum, cs) => sum + cs.prizePoolContribution,
    0
  );

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Sponsors" }
        ]}
      />
      <AdminNav />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sponsors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sponsor organizations and invitations
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-foreground text-background hover:bg-foreground/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>

      <div className="rounded-xl border divide-x flex">
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Total Sponsors</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{sponsorOrgs.length}</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Total Contribution</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-emerald-600">${totalContribution.toLocaleString()}</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">With Tracks</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">
            {sponsorsWithCohorts.filter((s) => s.hasDedicatedTrack).length}
          </p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Platinum/Gold</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-violet-600">
            {sponsorsWithCohorts.filter((s) => s.highestTier && ["platinum", "gold"].includes(s.highestTier)).length}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sponsors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCohort} onValueChange={setFilterCohort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            {cohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {cohort.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredSponsors.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 className="mx-auto h-8 w-8 opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">No Sponsors Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add sponsors to support the buildathon.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <SponsorTable
            sponsors={filteredSponsors}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInvite={handleInvite}
            onGenerateInviteLink={handleGenerateInviteLink}
          />
        </div>
      )}

      <SponsorForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        sponsor={editingSponsor}
        cohortSponsor={editingCohortSponsor}
        onSubmit={handleFormSubmit}
        cohorts={cohorts}
      />

      <InviteSponsorForm
        open={isInviteOpen}
        onOpenChange={handleInviteOpenChange}
        onSubmit={handleInviteSubmit}
        defaultSponsor={invitingSponsor}
        sponsorOrgs={sponsorOrgs}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sponsor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={inviteLinkDialogOpen} onOpenChange={setInviteLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link for {inviteLinkOrg}</DialogTitle>
            <DialogDescription>
              Share this link with a sponsor representative. It expires in 7 days and can only be used once.
            </DialogDescription>
          </DialogHeader>
          {isGeneratingLink ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={generatedInviteLink}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyInviteLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The recipient will register with this link and automatically be assigned as a sponsor for {inviteLinkOrg}.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
