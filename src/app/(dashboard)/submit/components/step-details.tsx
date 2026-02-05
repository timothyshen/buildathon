"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

interface StepDetailsProps {
  data: {
    title: string;
    tagline: string;
    logoUrl: string;
    description: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepDetails({ data, onChange, errors }: StepDetailsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 512 });

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("bucket", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Upload failed");
        return;
      }

      onChange("logoUrl", result.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <CardDescription>Tell us about your project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Logo */}
        <div className="space-y-2">
          <Label>Project Logo</Label>
          <div className="flex items-center gap-4">
            {data.logoUrl ? (
              <div className="relative group">
                <img
                  src={data.logoUrl}
                  alt="Project logo"
                  className="h-16 w-16 rounded-xl object-cover border"
                />
                <button
                  type="button"
                  onClick={() => onChange("logoUrl", "")}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {data.logoUrl ? "Change Logo" : "Upload Logo"}
                  </>
                )}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Square image recommended (e.g. 512x512)
              </p>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="My Awesome Project"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={data.tagline}
            onChange={(e) => onChange("tagline", e.target.value)}
            placeholder="A short description of your project"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {data.tagline.length}/100 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label id="description-label">Description *</Label>
          <div aria-labelledby="description-label">
            <RichTextEditor
              value={data.description}
              onChange={(value) => onChange("description", value)}
              placeholder="Describe what your project does, the problem it solves, and how it works..."
            />
          </div>
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
