"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Search, Play, FileText, Clock, Users, ArrowLeft, Loader2 } from "lucide-react";

export default function WorkshopResourcesPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      const { data } = await workshopsService.list();
      setWorkshops(data);
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
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/workshops"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workshop Calendar
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Learning Resources</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tutorials, guides, and educational content from our partners to help you build on Story Protocol.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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

        {/* Workshops Grid */}
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{workshop.partnerName}</span>
                </div>

                <div className="mt-4 flex gap-2">
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

        {/* CTA Section */}
        <div className="mt-16 rounded-2xl bg-muted p-8 text-center">
          <h2 className="text-2xl font-bold">Want to contribute?</h2>
          <p className="mt-2 text-muted-foreground">
            Are you a partner or expert? Share your knowledge with the community.
          </p>
          <Button className="mt-4">Submit Workshop Content</Button>
        </div>
      </div>
    </div>
  );
}
