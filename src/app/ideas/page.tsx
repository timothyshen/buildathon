"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, X, Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/ideas/idea-card";
import { ideasService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { Idea, IdeaStatus } from "@/types";

const PREDEFINED_TAGS = ["DeFi", "AI", "Gaming", "Social", "Infra", "NFT", "DAO", "Privacy", "Identity", "Payments"];

type SortOption = "trending" | "newest" | "seeking_team";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "All", value: "trending" },
  { label: "Trending", value: "trending" },
  { label: "Newest", value: "newest" },
  { label: "Seeking Team", value: "seeking_team" },
];

function IdeasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "trending"
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(
    searchParams.get("tag") || null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const loadIdeas = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    const res = await ideasService.list({
      page: pageNum,
      pageSize: 18,
      sort,
      tags: selectedTag ? [selectedTag] : undefined,
      search: searchQuery || undefined,
    });

    if (res.success) {
      let ideaData = res.data;

      if (user && ideaData.length > 0) {
        const votedRes = await ideasService.getVotedIdeaIds(
          user.id,
          ideaData.map((i) => i.id)
        );
        if (votedRes.success) {
          ideaData = ideaData.map((i) => ({
            ...i,
            hasVoted: votedRes.data.has(i.id),
          }));
        }
      }

      setIdeas(ideaData);
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(pageNum);
    }
    setIsLoading(false);
  }, [sort, selectedTag, searchQuery, user]);

  useEffect(() => {
    loadIdeas(1);
  }, [loadIdeas]);

  // Sync filters to URL
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (sort !== "trending") params.set("sort", sort);
      if (selectedTag) params.set("tag", selectedTag);
      if (searchQuery) params.set("q", searchQuery);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/ideas", { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
  }, [sort, selectedTag, searchQuery, router]);

  const handleVoteChange = (ideaId: string, newCount: number, hasVoted: boolean) => {
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === ideaId ? { ...i, voteCount: newCount, hasVoted } : i
      )
    );
  };

  const handlePostIdea = () => {
    if (!user) {
      router.push("/login?redirect=/ideas/new");
      return;
    }
    router.push("/ideas/new");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Ideas
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-xl">
                Propose ideas, find teammates, and turn concepts into real projects.
              </p>
            </div>
            <Button onClick={handlePostIdea} className="flex-shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Post Idea
            </Button>
          </div>

          {/* Search */}
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ideas..."
              className="w-full pl-11 pr-10 py-3 bg-background border rounded-md text-sm focus:outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value + opt.label}
                onClick={() => setSort(opt.value)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-colors",
                  sort === opt.value
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tag chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border transition-colors",
                  selectedTag === tag
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="mx-auto max-w-6xl px-6 py-8 min-h-[50vh]">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {total} idea{total !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ideas.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onVoteChange={handleVoteChange}
                />
              ))}
            </div>

            {(hasMore || page > 1) && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadIdeas(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => loadIdeas(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No ideas yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Be the first to propose an idea and find teammates to build it!
            </p>
            <Button onClick={handlePostIdea} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Post Idea
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function IdeasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <IdeasContent />
    </Suspense>
  );
}
