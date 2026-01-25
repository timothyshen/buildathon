"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectGalleryProps {
  screenshots: string[];
  videoUrl?: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function ProjectGallery({ screenshots, videoUrl }: ProjectGalleryProps) {
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;

  // Build items array: video first (if exists), then screenshots
  const items: { type: "video" | "image"; src: string }[] = [];

  if (youtubeId) {
    items.push({ type: "video", src: youtubeId });
  }

  screenshots.forEach((screenshot) => {
    items.push({ type: "image", src: screenshot });
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  if (items.length === 0) {
    return (
      <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
        <p className="text-muted-foreground">No media available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const currentItem = items[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main View */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {currentItem.type === "video" ? (
          <iframe
            src={`https://www.youtube.com/embed/${currentItem.src}`}
            title="Project video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img
            src={currentItem.src}
            alt={`Screenshot ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                  </svg>
                </div>
              ) : (
                <img
                  src={item.src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
