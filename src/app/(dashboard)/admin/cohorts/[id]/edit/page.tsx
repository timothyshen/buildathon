"use client";

import { use, useState, useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { cohortsService, sponsorsService } from "@/services";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CohortPageForm } from "@/components/admin/cohorts/cohort-page-form";
import type { CohortSponsorInput } from "@/components/admin/cohorts/cohort-sponsor-manager";
import type { Cohort, SponsorOrg } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";
import type { CohortFormData, SponsorOrgFormData } from "@/lib/schemas";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EditCohortPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCohortPage({ params }: EditCohortPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [cohortSponsors, setCohortSponsors] = useState<CohortSponsorWithOrg[]>([]);
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [cohortResult, sponsorsResult, orgsResult] = await Promise.all([
        cohortsService.getById(id),
        sponsorsService.getCohortSponsors(id),
        sponsorsService.listOrgs(),
      ]);

      if (!cohortResult.success || !cohortResult.data) {
        notFound();
        return;
      }

      setCohort(cohortResult.data);
      if (sponsorsResult.success) setCohortSponsors(sponsorsResult.data);
      if (orgsResult.success) setSponsorOrgs(orgsResult.data);
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  const handleSave = async (data: CohortFormData, sponsors: CohortSponsorInput[]) => {
    if (!cohort) return;

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

      const cohortResult = await cohortsService.update(cohort.id, cohortData);
      if (!cohortResult.success) {
        toast.error(cohortResult.error || "Failed to update cohort");
        return;
      }

      // Sync sponsors - fetch current state from DB to diff
      const currentResult = await sponsorsService.getCohortSponsors(cohort.id);
      const currentSponsors = currentResult.success ? currentResult.data : [];
      const newSponsorOrgIds = sponsors.map((s) => s.sponsorOrgId);

      // Remove sponsors that are no longer in the list
      for (const existingSponsor of currentSponsors) {
        if (!newSponsorOrgIds.includes(existingSponsor.id)) {
          const csResult = await sponsorsService.getCohortSponsor(cohort.id, existingSponsor.id);
          if (csResult.success && csResult.data) {
            await sponsorsService.deleteCohortSponsor(csResult.data.id);
          }
        }
      }

      // Add or update sponsors
      for (const sponsor of sponsors) {
        const existingCs = await sponsorsService.getCohortSponsor(cohort.id, sponsor.sponsorOrgId);

        if (existingCs.success && existingCs.data) {
          await sponsorsService.updateCohortSponsor(existingCs.data.id, {
            tier: sponsor.tier,
            prizePoolContribution: sponsor.prizePoolContribution,
            hasDedicatedTrack: sponsor.hasDedicatedTrack,
          });
        } else {
          await sponsorsService.createCohortSponsor({
            cohortId: cohort.id,
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
    toast.success("Cohort updated successfully");
    router.push(`/admin/cohorts/${cohort!.id}`);
  };

  const handleCancel = () => {
    router.push(`/admin/cohorts/${id}`);
  };

  if (isLoading || !cohort) {
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
          <Link href={`/admin/cohorts/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin/cohorts" },
            { label: "Cohorts", href: "/admin/cohorts" },
            { label: cohort.name, href: `/admin/cohorts/${id}` },
            { label: "Edit" },
          ]}
        />
      </div>
      <AdminNav />

      <div>
        <h1 className="text-3xl font-bold">Edit Cohort</h1>
        <p className="mt-2 text-muted-foreground">
          Update {cohort.name} settings, timeline, and sponsors
        </p>
      </div>

      <CohortPageForm
        cohort={cohort}
        cohortSponsors={cohortSponsors}
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
