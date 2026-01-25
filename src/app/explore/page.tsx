"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockSubmissions, getTracksByCohort, getCohortById } from "@/data/mock-data";
import { Filter } from "lucide-react";
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

// Prepare enriched submissions with cohort, track, and prize data
function enrichSubmissions(): EnrichedSubmission[] {
  // Only show submitted/winner/accepted projects
  const publicSubmissions = mockSubmissions.filter(
    (s) => s.status === "submitted" || s.status === "winner" || s.status === "accepted"
  );

  return publicSubmissions.map((submission) => {
    const cohort = getCohortById(submission.cohortId);
    const tracks = submission.cohortId ? getTracksByCohort(submission.cohortId) : [];
    const track = tracks.find((t) => t.id === submission.trackId);
    const prizes = getSubmissionPrizes(submission, cohort, track);

    return {
      ...submission,
      cohort,
      track,
      prizes,
    };
  });
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize search from URL
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("q") || "";
  });

  // Parse the search query
  const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  // Enrich submissions once
  const enrichedSubmissions = useMemo(() => enrichSubmissions(), []);

  // Filter submissions based on parsed query
  const filteredSubmissions = useMemo(() => {
    if (!hasActiveFilters(parsedQuery)) {
      return enrichedSubmissions;
    }
    return enrichedSubmissions.filter((submission) =>
      matchesQuery(submission, parsedQuery)
    );
  }, [enrichedSubmissions, parsedQuery]);

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
