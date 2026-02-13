"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ideasService, cohortsService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Cohort } from "@/types";
import Link from "next/link";

const PREDEFINED_TAGS = ["DeFi", "AI", "Gaming", "Social", "Infra", "NFT", "DAO", "Privacy", "Identity", "Payments"];

const ideaSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be under 200 characters"),
});

type IdeaFormValues = z.infer<typeof ideaSchema>;

export default function NewIdeaPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [cohortId, setCohortId] = useState<string>("");
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: { title: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/ideas/new");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadCohorts() {
      const res = await cohortsService.list();
      if (res.success) {
        setCohorts(res.data.filter((c) => c.status === "active" || c.status === "upcoming"));
      }
    }
    loadCohorts();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTag("");
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const onSubmit = async (values: IdeaFormValues) => {
    if (!user) return;

    const plainText = description.replace(/<[^>]*>/g, "").trim();
    if (plainText.length < 20) {
      toast.error("Description must be at least 20 characters");
      return;
    }

    setIsSubmitting(true);
    const res = await ideasService.create(
      {
        title: values.title,
        description,
        tags: selectedTags,
        cohortId: cohortId || undefined,
      },
      user.id
    );

    if (res.success) {
      toast.success("Idea posted!");
      router.push(`/ideas/${res.data.id}`);
    } else {
      toast.error(res.error || "Failed to post idea");
    }
    setIsSubmitting(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/ideas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Ideas
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight mb-8">Post a New Idea</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
            <Input
              id="title"
              placeholder="A short, descriptive title for your idea..."
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe your idea in detail — what problem does it solve? How would it work?"
            />
            <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Selected custom tags */}
            {selectedTags.filter((t) => !PREDEFINED_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedTags
                  .filter((t) => !PREDEFINED_TAGS.includes(t))
                  .map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Custom tag input */}
            <div className="flex gap-2 mt-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                className="max-w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomTag} disabled={!customTag.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Link to cohort */}
          {cohorts.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Link to Cohort (optional)</Label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/ideas")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Idea
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
