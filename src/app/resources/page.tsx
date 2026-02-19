"use client";

import { useState, useEffect, useMemo } from "react";
import { workshopsService } from "@/services";
import type { Workshop } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  FileText,
  Clock,
  Users,
  Loader2,
  BookOpen,
  ExternalLink,
} from "lucide-react";

type ResourceFilter = "all" | "videos" | "articles";

export default function ResourcesPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ResourceFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      const { data } = await workshopsService.list();
      setWorkshops(data.filter((w) => w.status === "published"));
      setIsLoading(false);
    }
    loadData();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(workshops.map((w) => w.category))).sort(),
    [workshops]
  );

  const counts = useMemo(
    () => ({
      all: workshops.length,
      videos: workshops.filter((w) => w.videoUrl).length,
      articles: workshops.filter((w) => w.articleUrl).length,
    }),
    [workshops]
  );

  const filteredWorkshops = useMemo(() => {
    return workshops.filter((workshop) => {
      const matchesSearch =
        search === "" ||
        workshop.title.toLowerCase().includes(search.toLowerCase()) ||
        workshop.description.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "videos" && workshop.videoUrl) ||
        (activeFilter === "articles" && workshop.articleUrl);

      const matchesCategory =
        selectedCategory === "all" || workshop.category === selectedCategory;

      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [workshops, search, activeFilter, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filterTiles: {
    key: ResourceFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: "all",
      label: "All Resources",
      count: counts.all,
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-foreground",
    },
    {
      key: "videos",
      label: "Videos",
      count: counts.videos,
      icon: <Play className="h-5 w-5" />,
      color: "text-red-500",
    },
    {
      key: "articles",
      label: "Articles",
      count: counts.articles,
      icon: <FileText className="h-5 w-5" />,
      color: "text-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground mx-4 mt-4 rounded-2xl">
        <div className="relative max-w-5xl mx-auto px-8 py-14 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Learning Hub
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-background">
            Resources
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            Tutorials, guides, prompt libraries, and educational content from
            our partners to help you build on Story Protocol.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Filter Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {filterTiles.map((tile) => (
            <button
              key={tile.key}
              onClick={() => {
                setActiveFilter(tile.key);
                if (tile.key !== "all") setSelectedCategory("all");
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                activeFilter === tile.key
                  ? "border-foreground bg-muted/80"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={tile.color}>{tile.icon}</span>
                <div>
                  <p className="text-sm font-medium">{tile.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {tile.count} items
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Search + Category Pills */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                selectedCategory === "all"
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  selectedCategory === category
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkshops.map((workshop) => (
            <ResourceCard key={workshop.id} workshop={workshop} />
          ))}
        </div>

        {filteredWorkshops.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-3 text-sm">No resources found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* CTA */}
        <section className="rounded-2xl border p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Want to contribute?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you a partner or expert? Share your knowledge with the
            community.
          </p>
          <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90">
            Submit Content
          </Button>
        </section>
      </div>
    </div>
  );
}

/* ── Resource Card ───────────────────────────── */

function ResourceCard({ workshop }: { workshop: Workshop }) {
  const hasVideo = !!workshop.videoUrl;
  const hasArticle = !!workshop.articleUrl;

  return (
    <section className="group flex flex-col rounded-xl border p-5 hover:bg-muted/50 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <span className="px-2 py-0.5 text-[11px] rounded-md border text-muted-foreground">
          {workshop.category}
        </span>
        {workshop.duration && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {workshop.duration}
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="mt-3 text-sm font-medium leading-snug line-clamp-2">
        {workshop.title}
      </h3>
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 flex-1">
        {workshop.description}
      </p>

      {/* Partner */}
      {workshop.partnerName && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{workshop.partnerName}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {hasVideo && (
          <Button size="sm" asChild className="flex-1 bg-foreground text-background hover:bg-foreground/90">
            <a
              href={workshop.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Watch
            </a>
          </Button>
        )}
        {hasArticle && (
          <Button
            size="sm"
            variant={hasVideo ? "ghost" : "default"}
            asChild
            className={
              hasVideo
                ? "flex-1 text-muted-foreground hover:text-foreground"
                : "flex-1 bg-foreground text-background hover:bg-foreground/90"
            }
          >
            <a
              href={workshop.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Read
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </section>
  );
}
