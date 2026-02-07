"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X, MessageSquarePlus, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeedbackCard } from "@/components/feedback/feedback-card";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { feedbackService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import type { FeedbackPost, FeedbackStatus, FeedbackCategory } from "@/types";

const sortOptions = [
  { label: "Trending", value: "trending" },
  { label: "Top", value: "top" },
  { label: "New", value: "new" },
];

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [sort, setSort] = useState<"trending" | "top" | "new">(
    (searchParams.get("sort") as "trending" | "top" | "new") || "trending"
  );
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">(
    (searchParams.get("status") as FeedbackStatus) || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">(
    (searchParams.get("category") as FeedbackCategory) || "all"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [showForm, setShowForm] = useState(false);

  const loadPosts = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    const res = await feedbackService.list({
      page: pageNum,
      pageSize: 20,
      sort,
      status: statusFilter === "all" ? undefined : statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      search: searchQuery || undefined,
    });

    if (res.success) {
      let postData = res.data;

      // Batch check voted status
      if (user && postData.length > 0) {
        const votedRes = await feedbackService.getVotedPostIds(
          user.id,
          postData.map((p) => p.id)
        );
        if (votedRes.success) {
          postData = postData.map((p) => ({
            ...p,
            hasVoted: votedRes.data.has(p.id),
          }));
        }
      }

      setPosts(postData);
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(pageNum);
    }
    setIsLoading(false);
  }, [sort, statusFilter, categoryFilter, searchQuery, user]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  // Sync filters to URL
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (sort !== "trending") params.set("sort", sort);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery) params.set("q", searchQuery);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/feedback", { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
  }, [sort, statusFilter, categoryFilter, searchQuery, router]);

  const handleVoteChange = (postId: string, newCount: number, hasVoted: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, voteCount: newCount, hasVoted } : p
      )
    );
  };

  const handleSuggest = () => {
    if (!user) {
      router.push("/login?redirect=/feedback");
      return;
    }
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Feedback
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-xl">
                Share ideas, report bugs, and vote on what we should build next.
              </p>
            </div>
            <Button onClick={handleSuggest} className="flex-shrink-0">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Make a Suggestion
            </Button>
          </div>

          {/* Search */}
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
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

          {/* Sort + Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SegmentedControl
              options={sortOptions}
              value={sort}
              onChange={(val) => setSort(val as "trending" | "top" | "new")}
            />
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as FeedbackStatus | "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as FeedbackCategory | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* List */}
      <main className="mx-auto max-w-4xl px-6 py-8 min-h-[50vh]">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {total} suggestion{total !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <FeedbackCard
                key={post.id}
                post={post}
                onVoteChange={handleVoteChange}
              />
            ))}

            {/* Pagination */}
            {(hasMore || page > 1) && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadPosts(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => loadPosts(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No suggestions yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Be the first to share an idea or report a bug!
            </p>
            <Button onClick={handleSuggest} className="mt-4">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Make a Suggestion
            </Button>
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <FeedbackForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => loadPosts(1)}
      />
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
