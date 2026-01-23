"use client";

import { useState } from "react";
import { mockCohorts } from "@/data/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CohortForm } from "@/components/admin/cohorts/cohort-form";
import { CohortTable } from "@/components/admin/cohorts/cohort-table";
import type { Cohort } from "@/types";
import type { CohortFormData } from "@/lib/schemas";

export default function CohortsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | undefined>();

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: CohortFormData) => {
    console.log("Form submitted:", data);
    setEditingCohort(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingCohort(undefined);
    }
  };

  const activeCohorts = mockCohorts.filter((c) => c.status === "active").length;
  const upcomingCohorts = mockCohorts.filter((c) => c.status === "upcoming").length;
  const completedCohorts = mockCohorts.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cohorts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage buildathon cohorts and their settings
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Cohort
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCohorts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCohorts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingCohorts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{completedCohorts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <CohortTable cohorts={mockCohorts} onEdit={handleEdit} />
        </CardContent>
      </Card>

      <CohortForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        cohort={editingCohort}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
