"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submissionsService, tracksService, cohortsService } from "@/services";
import type { Submission, Track, Cohort } from "@/types";
import { Filter, Loader2, Search, X } from "lucide-react";
import { ProjectCardExplore } from "@/components/explore/project-card-explore";
import { SearchFilterChips } from "@/components/explore/search-filter-chips";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  parseSearchQuery,
  buildSearchQuery,
  matchesQuery,
  hasActiveFilters,
  removeFilter,
  type ParsedQuery,
  type EnrichedSubmission,
} from "@/lib/search-utils";
import { getSubmissionPrizes } from "@/lib/prize-utils";

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Winners", value: "winners" },
  { label: "AI Projects", value: "ai" },
  { label: "Story Protocol", value: "story" },
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data loading state
  const [enrichedSubmissions, setEnrichedSubmissions] = useState<EnrichedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [activeFilter, setActiveFilter] = useState("all");

  // Initialize search from URL
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("q") || "";
  });

  // Parse the search query
  const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  // Load and enrich submissions
  useEffect(() => {
    async function loadData() {
      const { data: allSubmissions } = await submissionsService.list();

      const publicSubmissions = allSubmissions.filter(
        (s: Submission) => s.status === "submitted" || s.status === "winner" || s.status === "accepted"
      );

      const cohortIds = [...new Set(publicSubmissions.map((s: Submission) => s.cohortId).filter(Boolean))];

      const [cohortsResult, ...trackResults] = await Promise.all([
        cohortsService.list(),
        ...cohortIds.map((id) => tracksService.getByCohort(id as string)),
      ]);

      const cohortMap = new Map<string, Cohort>(
        cohortsResult.data.map((c: Cohort) => [c.id, c])
      );
      const trackMap = new Map<string, Track[]>();
      cohortIds.forEach((id, index) => {
        trackMap.set(id as string, trackResults[index].data);
      });

      const enriched: EnrichedSubmission[] = publicSubmissions.map((submission: Submission) => {
        const cohort = submission.cohortId ? cohortMap.get(submission.cohortId) : undefined;
        const tracks = submission.cohortId ? (trackMap.get(submission.cohortId) || []) : [];
        const track = tracks.find((t) => t.id === submission.trackId);
        const prizes = getSubmissionPrizes(submission, cohort, track);

        return {
          ...submission,
          cohort,
          track,
          prizes,
        };
      });

      setEnrichedSubmissions(enriched);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Filter submissions based on parsed query and active filter
  const filteredSubmissions = useMemo(() => {
    let results = enrichedSubmissions;

    // Apply segmented control filter
    if (activeFilter === "winners") {
      results = results.filter((s) => s.status === "winner");
    } else if (activeFilter === "ai") {
      results = results.filter((s) =>
        s.techStack.some((t) =>
          t.toLowerCase().includes("ai") ||
          t.toLowerCase().includes("openai") ||
          t.toLowerCase().includes("ml") ||
          t.toLowerCase().includes("gpt")
        )
      );
    } else if (activeFilter === "story") {
      results = results.filter((s) =>
        s.techStack.some((t) => t.toLowerCase().includes("story"))
      );
    }

    // Apply search query filters
    if (hasActiveFilters(parsedQuery)) {
      results = results.filter((submission) => matchesQuery(submission, parsedQuery));
    }

    return results;
  }, [enrichedSubmissions, parsedQuery, activeFilter]);

  // Update URL when search changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      const newUrl = params.toString() ? `?${params.toString()}` : "/explore";
      router.replace(newUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, router]);

  // Handle clearing search
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Handle removing a specific filter
  const handleRemoveFilter = useCallback(
    (type: keyof ParsedQuery, value: string) => {
      const newQuery = removeFilter(parsedQuery, type, value);
      setSearchQuery(buildSearchQuery(newQuery));
    },
    [parsedQuery]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Explore Projects
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Discover award-winning projects from our buildathons.
          </p>

          {/* Search */}
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-11 pr-10 py-3 bg-background border rounded-md text-sm focus:outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Segmented Control Filters */}
          <div className="mt-6">
            <SegmentedControl
              options={filterOptions}
              value={activeFilter}
              onChange={setActiveFilter}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8 min-h-[50vh]">
        {/* Active Search Filters */}
        {hasActiveFilters(parsedQuery) && (
          <SearchFilterChips
            query={parsedQuery}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearSearch}
            className="mb-6"
          />
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredSubmissions.length} project
            {filteredSubmissions.length !== 1 ? "s" : ""}
            {(activeFilter !== "all" || hasActiveFilters(parsedQuery)) && (
              <span> matching your filters</span>
            )}
          </p>
        </div>

        {/* Project Grid */}
        {filteredSubmissions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubmissions.map((submission) => (
              <ProjectCardExplore key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No projects found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
