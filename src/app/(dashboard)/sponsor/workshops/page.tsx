"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { workshopsService, sponsorsService } from "@/services";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Workshop, SponsorOrg } from "@/types";
import { Button } from "@/components/ui/button";
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
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        <p className="text-sm text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  const publishedCount = sponsorWorkshops.filter((w) => w.status === "published").length;
  const draftCount = sponsorWorkshops.filter((w) => w.status === "draft").length;
  const totalRsvps = Object.values(rsvpCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage learning content for {sponsor.name}
          </p>
        </div>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
          <Link href="/sponsor/workshops/new">
            Create Workshop
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {sponsorWorkshops.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">
            {publishedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Published</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-amber-600">
            {draftCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Drafts</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-violet-600">
            {totalRsvps}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total RSVPs</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">RSVPs</TableHead>
              <TableHead className="hidden md:table-cell">Content</TableHead>
              <TableHead className="hidden md:table-cell">Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsorWorkshops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    No workshops yet. Create a workshop to get started.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sponsorWorkshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell>
                    <Link
                      href={`/sponsor/workshops/${workshop.id}`}
                      className="hover:underline"
                    >
                      <p className="text-sm font-medium">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {workshop.description}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {workshop.category}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        workshop.status === "published" ? "bg-emerald-500"
                          : workshop.status === "draft" ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs capitalize">{workshop.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono text-xs tabular-nums">
                      {rsvpCounts[workshop.id] || 0}
                      {workshop.maxAttendees && (
                        <span className="text-muted-foreground"> / {workshop.maxAttendees}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {[
                        workshop.videoUrl && "Video",
                        workshop.articleUrl && "Article",
                      ].filter(Boolean).join(", ") || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {workshop.duration || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <Link href={`/sponsor/workshops/${workshop.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(workshop)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
