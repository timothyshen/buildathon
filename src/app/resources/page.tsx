"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { workshopsService } from "@/services";
import type { Workshop } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Search, Play, FileText, Clock, Users, Loader2, BookOpen, Lightbulb } from "lucide-react";

export default function ResourcesPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const canSubmitContent = user?.role === "sponsor" || user?.role === "admin";

  useEffect(() => {
    async function loadData() {
      const { data } = await workshopsService.list();
      // Filter to published resources (not scheduled events)
      setWorkshops(data.filter((w) => w.status === "published"));
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = Array.from(new Set(workshops.map((w) => w.category)));

  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch =
      search === "" ||
      workshop.title.toLowerCase().includes(search.toLowerCase()) ||
      workshop.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || workshop.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 mx-4 mt-4 rounded-3xl">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-8 py-16 text-center">
          <Badge className="bg-category-business/20 text-category-business border-category-business/30 mb-4">
            <BookOpen className="h-3 w-3 mr-1.5" />
            Learning Hub
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-white">
            Resources
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
            Tutorials, guides, prompt libraries, and educational content from our partners to help you build on Story Protocol.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Resource Type Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory("all")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">All Resources</p>
                <p className="text-xs text-muted-foreground">{workshops.length} items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory("all")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-red-100 p-2">
                <Play className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Videos</p>
                <p className="text-xs text-muted-foreground">{workshops.filter(w => w.videoUrl).length} items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory("all")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-100 p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Articles</p>
                <p className="text-xs text-muted-foreground">{workshops.filter(w => w.articleUrl).length} items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory("all")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-amber-100 p-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Guides</p>
                <p className="text-xs text-muted-foreground">{categories.length} categories</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkshops.map((workshop) => (
            <Card key={workshop.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline">{workshop.category}</Badge>
                  {workshop.duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {workshop.duration}
                    </div>
                  )}
                </div>
                <CardTitle className="mt-2 line-clamp-2">{workshop.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {workshop.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end">
                {workshop.partnerName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Users className="h-4 w-4" />
                    <span>{workshop.partnerName}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {workshop.videoUrl && (
                    <Button asChild className="flex-1">
                      <a
                        href={workshop.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Watch Video
                      </a>
                    </Button>
                  )}
                  {workshop.articleUrl && (
                    <Button
                      variant={workshop.videoUrl ? "outline" : "default"}
                      asChild
                      className="flex-1"
                    >
                      <a
                        href={workshop.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Read Guide
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWorkshops.length === 0 && (
          <div className="mt-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No resources found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* CTA Section — only for sponsors and admins */}
        {canSubmitContent && (
          <div className="mt-16 rounded-2xl bg-muted p-8 text-center">
            <h2 className="text-2xl font-bold">Want to contribute?</h2>
            <p className="mt-2 text-muted-foreground">
              Share your knowledge with the community.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/sponsor/workshops/new">Submit Content</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
