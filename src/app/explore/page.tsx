"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submissionsService, tracksService, cohortsService } from "@/services";
import type { Submission, Track, Cohort } from "@/types";
import { Filter, Loader2 } from "lucide-react";
import {
  AdvancedSearchInput,
  ProjectCardExplore,
  QuickFilters,
  SearchFilterChips,
} from "@/components/explore";
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

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data loading state
  const [enrichedSubmissions, setEnrichedSubmissions] = useState<EnrichedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize search from URL
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("q") || "";
  });

  // Parse the search query
  const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  // Load and enrich submissions
  useEffect(() => {
    async function loadData() {
      // Load all submissions
      const { data: allSubmissions } = await submissionsService.list();

      // Only show submitted/winner/accepted projects
      const publicSubmissions = allSubmissions.filter(
        (s: Submission) => s.status === "submitted" || s.status === "winner" || s.status === "accepted"
      );

      // Get unique cohort IDs
      const cohortIds = [...new Set(publicSubmissions.map((s: Submission) => s.cohortId).filter(Boolean))];

      // Load cohorts and tracks in parallel
      const [cohortsResult, ...trackResults] = await Promise.all([
        cohortsService.list(),
        ...cohortIds.map((id) => tracksService.getByCohort(id as string)),
      ]);

      // Build lookup maps
      const cohortMap = new Map<string, Cohort>(
        cohortsResult.data.map((c: Cohort) => [c.id, c])
      );
      const trackMap = new Map<string, Track[]>();
      cohortIds.forEach((id, index) => {
        trackMap.set(id as string, trackResults[index].data);
      });

      // Enrich submissions
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

  // Filter submissions based on parsed query
  const filteredSubmissions = useMemo(() => {
    if (!hasActiveFilters(parsedQuery)) {
      return enrichedSubmissions;
    }
    return enrichedSubmissions.filter((submission) =>
      matchesQuery(submission, parsedQuery)
    );
  }, [enrichedSubmissions, parsedQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  // Handle quick filter toggle
  const handleQuickFilterToggle = useCallback(
    (filterQuery: string) => {
      const isActive = searchQuery.toLowerCase().includes(filterQuery.toLowerCase());

      if (isActive) {
        // Remove filter
        const newQuery = searchQuery
          .replace(new RegExp(filterQuery, "gi"), "")
          .replace(/\s+/g, " ")
          .trim();
        setSearchQuery(newQuery);
      } else {
        // Add filter
        setSearchQuery((prev) => (prev ? `${prev} ${filterQuery}` : filterQuery));
      }
    },
    [searchQuery]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Explore Projects
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Discover award-winning projects from our buildathons. Use advanced search to find projects by tech stack, cohort, or prizes.
            </p>
          </div>

          {/* Advanced Search */}
          <div className="mt-8 max-w-2xl mx-auto">
            <AdvancedSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={handleClearSearch}
            />
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex justify-center">
            <QuickFilters
              currentQuery={searchQuery}
              onFilterToggle={handleQuickFilterToggle}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Active Filters */}
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
            Showing {filteredSubmissions.length} project
            {filteredSubmissions.length !== 1 ? "s" : ""}
            {hasActiveFilters(parsedQuery) && (
              <span> matching your filters</span>
            )}
          </p>
        </div>

        {/* Project Grid */}
        {filteredSubmissions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubmissions.map((submission) => (
              <ProjectCardExplore key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Try adjusting your search. Use{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">tech:react</code> to
              filter by technology or{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">!winner</code> to
              find winners.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
