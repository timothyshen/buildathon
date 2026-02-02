"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cohortsService, sponsorsService } from "@/services";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CohortPageForm } from "@/components/admin/cohorts/cohort-page-form";
import type { CohortSponsorInput } from "@/components/admin/cohorts/cohort-sponsor-manager";
import type { SponsorOrg } from "@/types";
import type { CohortFormData, SponsorOrgFormData } from "@/lib/schemas";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewCohortPage() {
  const router = useRouter();
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [createdCohortId, setCreatedCohortId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data, success } = await sponsorsService.listOrgs();
      if (success) setSponsorOrgs(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async (data: CohortFormData, sponsors: CohortSponsorInput[]) => {
    setIsSaving(true);

    try {
      const cohortData = {
        slug: data.slug,
        name: data.name,
        description: data.description,
        tagline: data.tagline || undefined,
        bannerImage: data.bannerImage || undefined,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        submissionDeadline: new Date(data.submissionDeadline),
        judgingStart: new Date(data.judgingStart),
        judgingEnd: new Date(data.judgingEnd),
        status: data.status,
        isPublic: data.isPublic,
        maxTeamSize: data.maxTeamSize,
        prizes: data.prizes || [],
      };

      let cohortId = createdCohortId;

      if (cohortId) {
        // Already created — update
        const updateResult = await cohortsService.update(cohortId, cohortData);
        if (!updateResult.success) {
          toast.error(updateResult.error || "Failed to save cohort");
          return;
        }
      } else {
        // First save — create
        const createResult = await cohortsService.create(cohortData);
        if (!createResult.success) {
          toast.error(createResult.error || "Failed to create cohort");
          return;
        }
        cohortId = createResult.data.id;
        setCreatedCohortId(cohortId);
      }

      // Sync sponsors: get current sponsors from DB, diff, and update
      const currentResult = await sponsorsService.getCohortSponsors(cohortId);
      const currentSponsors = currentResult.success ? currentResult.data : [];
      const currentOrgIds = currentSponsors.map((s) => s.id);
      const newOrgIds = sponsors.map((s) => s.sponsorOrgId);

      // Remove sponsors no longer in the list
      for (const existing of currentSponsors) {
        if (!newOrgIds.includes(existing.id)) {
          const cs = await sponsorsService.getCohortSponsor(cohortId, existing.id);
          if (cs.success && cs.data) {
            await sponsorsService.deleteCohortSponsor(cs.data.id);
          }
        }
      }

      // Add or update sponsors
      for (const sponsor of sponsors) {
        const existingCs = await sponsorsService.getCohortSponsor(cohortId, sponsor.sponsorOrgId);
        if (existingCs.success && existingCs.data) {
          await sponsorsService.updateCohortSponsor(existingCs.data.id, {
            tier: sponsor.tier,
            prizePoolContribution: sponsor.prizePoolContribution,
            hasDedicatedTrack: sponsor.hasDedicatedTrack,
          });
        } else {
          await sponsorsService.createCohortSponsor({
            cohortId,
            sponsorOrgId: sponsor.sponsorOrgId,
            tier: sponsor.tier,
            prizePoolContribution: sponsor.prizePoolContribution,
            hasDedicatedTrack: sponsor.hasDedicatedTrack,
          });
        }
      }
    } catch (error) {
      console.error("Error saving cohort:", error);
      toast.error("Failed to save cohort");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateOrg = async (data: SponsorOrgFormData): Promise<SponsorOrg | null> => {
    const result = await sponsorsService.createOrg({
      name: data.name,
      logo: data.logo || "",
      website: data.website || "",
      description: data.description || "",
      contactName: data.contactName,
      contactEmail: data.contactEmail,
    });
    if (result.success) {
      setSponsorOrgs((prev) => [...prev, result.data]);
      toast.success("Organization created");
      return result.data;
    }
    toast.error(result.error || "Failed to create organization");
    return null;
  };

  const handleDone = () => {
    toast.success("Cohort created successfully");
    router.push("/admin/cohorts");
  };

  const handleCancel = () => {
    router.push("/admin/cohorts");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cohorts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin/cohorts" },
            { label: "Cohorts", href: "/admin/cohorts" },
            { label: "New Cohort" },
          ]}
        />
      </div>
      <AdminNav />

      <div>
        <h1 className="text-3xl font-bold">Create Cohort</h1>
        <p className="mt-2 text-muted-foreground">
          Set up a new buildathon cohort with sponsors and prizes
        </p>
      </div>

      <CohortPageForm
        sponsorOrgs={sponsorOrgs}
        onSave={handleSave}
        onDone={handleDone}
        onCancel={handleCancel}
        isLoading={isSaving}
        onCreateOrg={handleCreateOrg}
      />
    </div>
  );
}
