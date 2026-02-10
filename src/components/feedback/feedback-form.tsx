"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { feedbackService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { FeedbackCategory } from "@/types";

const feedbackSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be under 200 characters"),
  category: z.enum(["feature_request", "bug_report", "improvement"]),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FeedbackForm({ open, onOpenChange, onSuccess }: FeedbackFormProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      title: "",
      category: "feature_request",
    },
  });

  const category = watch("category");

  const onSubmit = async (values: FeedbackFormValues) => {
    if (!user) return;
    if (!description || description === "<p></p>") {
      toast.error("Please add a description");
      return;
    }

    setIsSubmitting(true);
    const res = await feedbackService.create(
      { title: values.title, description, category: values.category as FeedbackCategory },
      user.id
    );

    if (res.success) {
      // Fire-and-forget notification trigger
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "feedback_created",
          data: { feedbackId: res.data.id, title: values.title },
        }),
      }).catch(() => {});

      toast.success("Feedback submitted!");
      reset();
      setDescription("");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(res.error || "Failed to submit feedback");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make a Suggestion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Short, descriptive title..."
              {...register("title")}
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(val) => setValue("category", val as FeedbackFormValues["category"])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <div className="mt-1">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your suggestion in detail..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
