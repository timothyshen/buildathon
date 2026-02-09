"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { workshopsService, sponsorsService } from "@/services";
import type { Workshop, SponsorOrg } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const categories = ["Basics", "Advanced", "Business", "Technical"];

interface WorkshopEditPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkshopEditPage({ params }: WorkshopEditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      const [sponsorResult, workshopResult] = await Promise.all([
        sponsorsService.getOrgByUser(user.id),
        workshopsService.getById(id),
      ]);

      if (sponsorResult.success) setSponsor(sponsorResult.data);

      if (workshopResult.success && workshopResult.data) {
        const ws = workshopResult.data;
        setWorkshop(ws);
        setTitle(ws.title);
        setDescription(ws.description);
        setCategory(ws.category);
        setDuration(ws.duration || "");
        setVideoUrl(ws.videoUrl || "");
        setArticleUrl(ws.articleUrl || "");
        setStatus(ws.status);
      }

      setIsLoadingData(false);
    }
    loadData();
  }, [id, user]);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium">Workshop not found</p>
        <p className="text-xs text-muted-foreground mt-1">
          The workshop you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-4">
          <Link href="/sponsor/workshops">Back to Workshops</Link>
        </Button>
      </div>
    );
  }

  // Check if user owns this workshop
  if (workshop.sponsorOrgId !== sponsor.id) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium">Access Denied</p>
        <p className="text-xs text-muted-foreground mt-1">
          You don&apos;t have permission to edit this workshop.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-4">
          <Link href="/sponsor/workshops">Back to Workshops</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await workshopsService.update(workshop.id, {
        title,
        description,
        category,
        duration: duration || undefined,
        videoUrl: videoUrl || undefined,
        articleUrl: articleUrl || undefined,
        status,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save workshop");
        return;
      }

      toast.success("Workshop saved");
      router.push("/sponsor/workshops");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const result = await workshopsService.delete(workshop.id);
    if (!result.success) {
      toast.error(result.error || "Failed to delete workshop");
      setShowDeleteDialog(false);
      return;
    }
    toast.success("Workshop deleted");
    setShowDeleteDialog(false);
    router.push("/sponsor/workshops");
  };

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Workshops", href: "/sponsor/workshops" },
          { label: workshop.title },
        ]}
        showHome={false}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sponsor/workshops"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Edit Workshop</h1>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  status === "published" ? "bg-emerald-500"
                    : status === "archived" ? "bg-muted-foreground"
                    : "bg-amber-500"
                }`} />
                <span className="text-xs text-muted-foreground capitalize">{status}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{sponsor.name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Workshop Details
              </h2>
              <div className="rounded-xl border p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs text-muted-foreground">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Getting Started with..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description *</Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe what participants will learn..."
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Resources
              </h2>
              <div className="rounded-xl border p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="videoUrl" className="text-xs text-muted-foreground">Video URL</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="articleUrl" className="text-xs text-muted-foreground">Article URL</Label>
                  <Input
                    id="articleUrl"
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://docs.example.com/..."
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Settings
              </h2>
              <div className="rounded-xl border p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs text-muted-foreground">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-xs text-muted-foreground">Duration</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30 min"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) =>
                      setStatus(v as "draft" | "published" | "archived")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isLoading || !title || !category}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/sponsor/workshops">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{workshop.title}&quot;? This action cannot be undone.
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
