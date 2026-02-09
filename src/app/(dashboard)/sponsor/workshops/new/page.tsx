"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { sponsorsService, workshopsService } from "@/services";
import type { SponsorOrg } from "@/types";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const categories = ["Basics", "Advanced", "Business", "Technical"];

export default function NewWorkshopPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sponsor, setSponsor] = useState<SponsorOrg | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      const { data } = await sponsorsService.getOrgByUser(user.id);
      setSponsor(data);
      setIsLoadingData(false);
    }
    loadData();
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await workshopsService.create({
        title,
        description,
        category,
        duration: duration || undefined,
        videoUrl: videoUrl || undefined,
        articleUrl: articleUrl || undefined,
        status,
        sponsorOrgId: sponsor.id,
        partnerName: sponsor.name,
        partnerLogo: sponsor.logo,
        isEvergreen: false,
        cohortIds: [],
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create workshop");
        return;
      }

      toast.success("Workshop created successfully");
      router.push("/sponsor/workshops");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Workshops", href: "/sponsor/workshops" },
          { label: "New Workshop" },
        ]}
        showHome={false}
      />

      <div className="flex items-center gap-3">
        <Link
          href="/sponsor/workshops"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Workshop</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create learning content for {sponsor.name}
          </p>
        </div>
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
                    onValueChange={(v) => setStatus(v as "draft" | "published")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
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
                    Creating...
                  </>
                ) : (
                  "Save Workshop"
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/sponsor/workshops">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
