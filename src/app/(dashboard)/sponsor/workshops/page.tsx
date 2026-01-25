"use client";

import { useState } from "react";
import { mockWorkshops, mockSponsorOrgs } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2, Play, FileText } from "lucide-react";
import { WorkshopForm } from "@/components/shared/workshop/workshop-form";
import type { Workshop } from "@/types";
import type { WorkshopFormData } from "@/lib/schemas";

const statusColors: Record<Workshop["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-amber-100 text-amber-700",
};

export default function SponsorWorkshopsPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | undefined>();

  const sponsor = mockSponsorOrgs.find((s) => s.id === user?.sponsorOrgId);
  const sponsorWorkshops = mockWorkshops.filter((w) => w.sponsorOrgId === sponsor?.id);

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setIsFormOpen(true);
  };

  const handleDelete = (workshop: Workshop) => {
    if (confirm(`Delete workshop "${workshop.title}"?`)) {
      console.log("Delete:", workshop.id);
    }
  };

  const handleSubmit = (data: WorkshopFormData) => {
    console.log("Workshop form submitted:", data);
    setEditingWorkshop(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingWorkshop(undefined);
  };

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  const publishedCount = sponsorWorkshops.filter((w) => w.status === "published").length;
  const draftCount = sponsorWorkshops.filter((w) => w.status === "draft").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Workshops</h1>
          <p className="mt-2 text-muted-foreground">
            Manage learning content for {sponsor.name}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Workshop
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorWorkshops.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorWorkshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {workshop.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{workshop.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[workshop.status]}>
                      {workshop.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {workshop.videoUrl && (
                        <Badge variant="secondary" className="gap-1">
                          <Play className="h-3 w-3" />
                          Video
                        </Badge>
                      )}
                      {workshop.articleUrl && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Article
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{workshop.duration || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(workshop)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(workshop)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sponsorWorkshops.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No workshops yet. Create a workshop to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <WorkshopForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        workshop={editingWorkshop}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
