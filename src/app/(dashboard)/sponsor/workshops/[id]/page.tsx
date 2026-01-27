"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { workshopsService, sponsorsService } from "@/services";
import type { Workshop, SponsorOrg } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";

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
        <p className="text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Workshop not found</h2>
          <p className="text-muted-foreground mt-2">
            The workshop you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sponsor/workshops">Back to Workshops</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user owns this workshop
  if (workshop.sponsorOrgId !== sponsor.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            You don't have permission to edit this workshop.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sponsor/workshops">Back to Workshops</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock save - in real app, this would call an API
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/sponsor/workshops");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    // TODO: Implement workshop deletion
    setShowDeleteDialog(false);
    router.push("/sponsor/workshops");
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workshops", href: "/sponsor/workshops" },
          { label: workshop.title },
        ]}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sponsor/workshops">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Edit Workshop</h1>
              <Badge
                className={
                  status === "published"
                    ? "bg-green-100 text-green-800"
                    : status === "archived"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
                }
              >
                {status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{sponsor.name}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workshop Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Getting Started with..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe what participants will learn..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articleUrl">Article URL</Label>
                  <Input
                    id="articleUrl"
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://docs.example.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30 min"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isLoading || !title || !category}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/sponsor/workshops">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
