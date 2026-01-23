"use client";

import { useState } from "react";
import Link from "next/link";
import { mockSubmissions, mockCohorts } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ExternalLink, Github, GitFork, Trophy, Filter } from "lucide-react";
import type { Metadata } from "next";

// Only show submitted/winner projects
const publicSubmissions = mockSubmissions.filter(
  (s) => s.status === "submitted" || s.status === "winner" || s.status === "accepted"
);

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(
    new Set(publicSubmissions.flatMap((s) => s.techStack))
  ).slice(0, 10);

  const filteredSubmissions = publicSubmissions.filter((submission) => {
    const matchesSearch =
      search === "" ||
      submission.title.toLowerCase().includes(search.toLowerCase()) ||
      submission.description.toLowerCase().includes(search.toLowerCase()) ||
      submission.techStack.some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      );

    const matchesCohort =
      selectedCohort === "all" || submission.cohortId === selectedCohort;

    const matchesCategory =
      selectedCategory === "all" ||
      submission.techStack.includes(selectedCategory);

    return matchesSearch && matchesCohort && matchesCategory;
  });

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Explore Templates</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover forkable projects built during SWA buildathons. Each project is
            registered as IP on Story Protocol.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {mockCohorts
                .filter((c) => c.isPublic)
                .map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Technologies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technologies</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="mt-4 text-sm text-muted-foreground">
          Showing {filteredSubmissions.length} project
          {filteredSubmissions.length !== 1 ? "s" : ""}
        </p>

        {/* Project Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{submission.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {submission.tagline || submission.team?.name}
                    </CardDescription>
                  </div>
                  {submission.status === "winner" && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {submission.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1">
                  {submission.techStack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {submission.techStack.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{submission.techStack.length - 4}
                    </Badge>
                  )}
                </div>

                {submission.ipAssetId && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      IP Registered
                    </Badge>
                    <span>{submission.ipLicenseType}</span>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {submission.demoUrl && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a
                        href={submission.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {submission.repoUrl && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a
                        href={submission.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="mr-1 h-3 w-3" />
                        Code
                      </a>
                    </Button>
                  )}
                  <Button size="sm" className="flex-1">
                    <GitFork className="mr-1 h-3 w-3" />
                    Fork
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="mt-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
