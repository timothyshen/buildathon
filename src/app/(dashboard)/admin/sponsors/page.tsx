"use client";

import { useState } from "react";
import { mockSponsors, mockCohorts } from "@/data/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import { SponsorForm } from "@/components/admin/sponsors/sponsor-form";
import { SponsorTable } from "@/components/admin/sponsors/sponsor-table";
import { InviteSponsorForm } from "@/components/admin/sponsors/invite-sponsor-form";
import type { Sponsor } from "@/types";
import type { SponsorFormData, InviteSponsorFormData } from "@/lib/schemas";

export default function AdminSponsorsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | undefined>();
  const [invitingSponsor, setInvitingSponsor] = useState<Sponsor | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCohort, setFilterCohort] = useState<string>("all");

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsFormOpen(true);
  };

  const handleDelete = (sponsor: Sponsor) => {
    if (confirm(`Delete sponsor "${sponsor.name}"?`)) {
      console.log("Delete:", sponsor.id);
    }
  };

  const handleInvite = (sponsor: Sponsor) => {
    setInvitingSponsor(sponsor);
    setIsInviteOpen(true);
  };

  const handleFormSubmit = (data: SponsorFormData) => {
    console.log("Sponsor form submitted:", data);
    setEditingSponsor(undefined);
  };

  const handleInviteSubmit = (data: InviteSponsorFormData) => {
    console.log("Invite submitted:", data);
    setInvitingSponsor(undefined);
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingSponsor(undefined);
  };

  const handleInviteOpenChange = (open: boolean) => {
    setIsInviteOpen(open);
    if (!open) setInvitingSponsor(undefined);
  };

  const filteredSponsors = mockSponsors.filter((sponsor) => {
    const matchesSearch =
      sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCohort = filterCohort === "all" || sponsor.cohortId === filterCohort;
    return matchesSearch && matchesCohort;
  });

  const totalContribution = mockSponsors.reduce(
    (sum, s) => sum + s.prizePoolContribution,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sponsors</h1>
          <p className="mt-2 text-muted-foreground">
            Manage sponsor organizations and invitations
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSponsors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalContribution.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSponsors.filter((s) => s.hasDedicatedTrack).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platinum/Gold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSponsors.filter((s) => ["platinum", "gold"].includes(s.tier)).length}
            </div>
          </CardContent>
        </Card>
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
            {mockCohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {cohort.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <SponsorTable
            sponsors={filteredSponsors}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInvite={handleInvite}
          />
        </CardContent>
      </Card>

      <SponsorForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        sponsor={editingSponsor}
        onSubmit={handleFormSubmit}
      />

      <InviteSponsorForm
        open={isInviteOpen}
        onOpenChange={handleInviteOpenChange}
        onSubmit={handleInviteSubmit}
        defaultSponsor={invitingSponsor}
      />
    </div>
  );
}
