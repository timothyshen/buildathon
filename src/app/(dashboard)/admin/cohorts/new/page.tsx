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
import type { CohortFormData } from "@/lib/schemas";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewCohortPage() {
  const router = useRouter();
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data, success } = await sponsorsService.listOrgs();
      if (success) setSponsorOrgs(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (data: CohortFormData, sponsors: CohortSponsorInput[]) => {
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

      // Create the cohort
      const cohortResult = await cohortsService.create(cohortData);
      if (!cohortResult.success) {
        toast.error(cohortResult.error || "Failed to create cohort");
        return;
      }

      const newCohort = cohortResult.data;

      // Create cohort sponsors
      for (const sponsor of sponsors) {
        const sponsorResult = await sponsorsService.createCohortSponsor({
          cohortId: newCohort.id,
          sponsorOrgId: sponsor.sponsorOrgId,
          tier: sponsor.tier,
          prizePoolContribution: sponsor.prizePoolContribution,
          hasDedicatedTrack: sponsor.hasDedicatedTrack,
        });
        if (!sponsorResult.success) {
          console.error("Failed to add sponsor:", sponsorResult.error);
        }
      }

      toast.success("Cohort created successfully");
      router.push("/admin/cohorts");
    } catch (error) {
      console.error("Error creating cohort:", error);
      toast.error("Failed to create cohort");
    } finally {
      setIsSaving(false);
    }
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
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </div>
  );
}
