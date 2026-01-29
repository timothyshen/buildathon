"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { workshopsService, sponsorsService } from "@/services";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Workshop, SponsorOrg } from "@/types";
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
import { PlusCircle, Pencil, Trash2, Play, FileText, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<Workshop["status"], string> = {
  draft: "bg-status-draft text-status-draft-foreground border border-status-draft/30",
  published: "bg-status-active text-status-active-foreground border border-status-active/30",
  archived: "bg-status-completed text-status-completed-foreground border border-status-completed/30",
};

export default function SponsorWorkshopsPage() {
  const { user } = useAuth();
  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [sponsorWorkshops, setSponsorWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Workshop | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const sponsorResult = await sponsorsService.getOrgByUser(user.id);
      if (sponsorResult.success && sponsorResult.data) {
        setSponsor(sponsorResult.data);

        const workshopsResult = await workshopsService.getBySponsor(sponsorResult.data.id);
        if (workshopsResult.success) {
          setSponsorWorkshops(workshopsResult.data);

          // Fetch RSVP counts for all workshops in a single query
          const workshopIds = workshopsResult.data.map((w) => w.id);
          if (workshopIds.length > 0) {
            const supabase = createClient();
            const { data: rsvpData } = await supabase
              .from("workshop_rsvps")
              .select("workshop_id")
              .in("workshop_id", workshopIds);

            const counts: Record<string, number> = {};
            (rsvpData || []).forEach((r) => {
              const wid = r.workshop_id as string;
              counts[wid] = (counts[wid] || 0) + 1;
            });
            setRsvpCounts(counts);
          }
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleDelete = (workshop: Workshop) => {
    setDeleteTarget(workshop);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      const result = await workshopsService.delete(deleteTarget.id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete workshop");
        setDeleteTarget(null);
        return;
      }
      setSponsorWorkshops((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      toast.success("Workshop deleted");
      setDeleteTarget(null);
    }
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Workshops</h1>
          <p className="mt-2 text-muted-foreground">
            Manage learning content for {sponsor.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/sponsor/workshops/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Workshop
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <div className="text-2xl font-bold text-status-active-foreground">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-draft-foreground">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(rsvpCounts).reduce((sum, c) => sum + c, 0)}
            </div>
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
                <TableHead>RSVPs</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorWorkshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell>
                    <Link
                      href={`/sponsor/workshops/${workshop.id}`}
                      className="hover:underline"
                    >
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {workshop.description}
                      </p>
                    </Link>
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
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="tabular-nums">{rsvpCounts[workshop.id] || 0}</span>
                      {workshop.maxAttendees && (
                        <span className="text-muted-foreground text-xs">/ {workshop.maxAttendees}</span>
                      )}
                    </div>
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
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/sponsor/workshops/${workshop.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No workshops yet. Create a workshop to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
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
    </div>
  );
}
