"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workshopSchema, type WorkshopFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Workshop } from "@/types";

interface WorkshopFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop?: Workshop;
  onSubmit: (data: WorkshopFormData) => void;
}

const categories = ["Basics", "Advanced", "Business", "Technical"];

export function WorkshopForm({
  open,
  onOpenChange,
  workshop,
  onSubmit,
}: WorkshopFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: workshop
      ? {
          title: workshop.title,
          description: workshop.description,
          content: workshop.content || "",
          category: workshop.category,
          duration: workshop.duration || "",
          videoUrl: workshop.videoUrl || "",
          articleUrl: workshop.articleUrl || "",
          status: workshop.status,
        }
      : {
          status: "draft",
          category: "Basics",
        },
  });

  const onFormSubmit = (data: WorkshopFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{workshop ? "Edit Workshop" : "Create Workshop"}</DialogTitle>
          <DialogDescription>
            {workshop ? "Update workshop details" : "Create new learning content"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Getting Started with Story Protocol"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What will learners gain from this content?"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
              >
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
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                {...register("duration")}
                placeholder="e.g., 30 min"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              {...register("videoUrl")}
              type="url"
              placeholder="https://youtube.com/..."
            />
            {errors.videoUrl && (
              <p className="text-sm text-red-500">{errors.videoUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="articleUrl">Article URL</Label>
            <Input
              id="articleUrl"
              {...register("articleUrl")}
              type="url"
              placeholder="https://docs..."
            />
            {errors.articleUrl && (
              <p className="text-sm text-red-500">{errors.articleUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as WorkshopFormData["status"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{workshop ? "Save Changes" : "Create Workshop"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
