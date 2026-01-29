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
import type { CohortFormData } from "@/lib/schemas";
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

  const handleSubmit = async (data: CohortFormData, sponsors: CohortSponsorInput[]) => {
    if (!cohort) return;

    setIsSaving(true);

    try {
      // Convert form data to cohort format
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

      // Update the cohort
      const cohortResult = await cohortsService.update(cohort.id, cohortData);
      if (!cohortResult.success) {
        toast.error(cohortResult.error || "Failed to update cohort");
        return;
      }

      // Sync sponsors - determine what to add, update, and remove
      const existingSponsorIds = cohortSponsors.map((s) => s.id);
      const newSponsorOrgIds = sponsors.map((s) => s.sponsorOrgId);

      // Remove sponsors that are no longer in the list
      for (const existingSponsor of cohortSponsors) {
        if (!newSponsorOrgIds.includes(existingSponsor.id)) {
          // Need to find the cohort_sponsor record ID, not the org ID
          // This is tricky - we need to get the actual CohortSponsor record
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
          // Update existing
          await sponsorsService.updateCohortSponsor(existingCs.data.id, {
            tier: sponsor.tier,
            prizePoolContribution: sponsor.prizePoolContribution,
            hasDedicatedTrack: sponsor.hasDedicatedTrack,
          });
        } else {
          // Create new
          await sponsorsService.createCohortSponsor({
            cohortId: cohort.id,
            sponsorOrgId: sponsor.sponsorOrgId,
            tier: sponsor.tier,
            prizePoolContribution: sponsor.prizePoolContribution,
            hasDedicatedTrack: sponsor.hasDedicatedTrack,
          });
        }
      }

      toast.success("Cohort updated successfully");
      router.push(`/admin/cohorts/${cohort.id}`);
    } catch (error) {
      console.error("Error updating cohort:", error);
      toast.error("Failed to update cohort");
    } finally {
      setIsSaving(false);
    }
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
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </div>
  );
}
