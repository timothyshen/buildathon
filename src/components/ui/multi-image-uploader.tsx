"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: "banners" | "screenshots";
  minImages?: number;
  maxImages?: number;
  label?: string;
  className?: string;
}

export function MultiImageUploader({
  value = [],
  onChange,
  bucket,
  minImages = 0,
  maxImages = 10,
  label,
  className,
}: MultiImageUploaderProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = value.length + uploadingCount < maxImages;

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 5MB");
        return;
      }

      setUploadingCount((c) => c + 1);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Upload failed");
          return;
        }

        onChange([...value, data.url]);
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingCount((c) => c - 1);
      }
    },
    [bucket, onChange, value]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxImages - value.length - uploadingCount;
    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Can only add ${remaining} more image${remaining === 1 ? "" : "s"}`);
    }

    toUpload.forEach((file) => upload(file));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    const remaining = maxImages - value.length - uploadingCount;
    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Can only add ${remaining} more image${remaining === 1 ? "" : "s"}`);
    }

    toUpload.forEach((file) => upload(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn(className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {value.length}/{minImages > 0 ? `${minImages} required` : maxImages}
            {minImages > 0 && value.length < minImages && (
              <span className="text-destructive ml-1">
                ({minImages - value.length} more needed)
              </span>
            )}
          </p>
        </div>
      )}

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value.map((url, index) => (
          <div
            key={url}
            className="relative group aspect-video rounded-lg overflow-hidden border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Uploading placeholders */}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              "aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            {isDragging ? (
              <ImageIcon className="h-6 w-6 text-primary" />
            ) : (
              <>
                <Plus className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Add image</p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
