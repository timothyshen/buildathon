"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

interface StepProfileProps {
  data: {
    name: string;
    bio: string;
    avatar?: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepProfile({ data, onChange, errors }: StepProfileProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultAvatarUrl = data.name
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`
    : null;

  const displayAvatarUrl = data.avatar || defaultAvatarUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 512 });

      if (compressed.size > 2 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 2MB");
        setIsUploading(false);
        return;
      }

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

      onChange("avatar", result.url);
      toast.success("Avatar uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    onChange("avatar", "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome! Let&apos;s set up your profile</CardTitle>
        <CardDescription>
          Tell us a bit about yourself so others can get to know you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt="Avatar preview"
                className="h-24 w-24 rounded-full border-4 border-violet-100 dark:border-violet-900 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <User className="h-10 w-10 text-slate-400" />
              </div>
            )}
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            {/* Remove button */}
            {data.avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {data.avatar ? "Change Photo" : "Upload Photo"}
                </>
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {data.avatar ? "Custom avatar uploaded" : "Upload a photo or use the auto-generated avatar"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Your name"
            maxLength={50}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio (optional)</Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            placeholder="Tell us about yourself, your interests, and what you're building..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {data.bio.length}/200 characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
