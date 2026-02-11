"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cohortsService } from "@/services";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { CohortTable } from "@/components/admin/cohorts/cohort-table";
import type { Cohort } from "@/types";

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data, success } = await cohortsService.list();
      if (success) setCohorts(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCohorts = cohorts.filter((c) => c.status === "active").length;
  const upcomingCohorts = cohorts.filter((c) => c.status === "upcoming").length;
  const completedCohorts = cohorts.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Cohorts" }
        ]}
      />
      <AdminNav />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cohorts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage buildathon cohorts and their settings
          </p>
        </div>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
          <Link href="/admin/cohorts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Cohort
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border divide-x grid grid-cols-2 md:grid-cols-4">
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">Total Cohorts</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">
            {cohorts.length}
          </p>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-emerald-600">
            {activeCohorts}
          </p>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-blue-600">
            {upcomingCohorts}
          </p>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1 text-amber-600">
            {completedCohorts}
          </p>
        </div>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <CohortTable cohorts={cohorts} />
      </div>
    </div>
  );
}
