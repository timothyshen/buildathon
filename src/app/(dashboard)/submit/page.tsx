"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockCohorts, mockTracks } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCohort = searchParams.get("cohort");

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(preselectedCohort || "");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newTech, setNewTech] = useState("");

  const activeCohorts = mockCohorts.filter(
    (c) => c.status === "active" && c.isPublic
  );
  const cohortTracks = mockTracks.filter((t) => t.cohortId === selectedCohort);

  const addTech = () => {
    if (newTech.trim() && !techStack.includes(newTech.trim())) {
      setTechStack([...techStack, newTech.trim()]);
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In real app, would save to database
    console.log("Submission created");

    router.push("/submissions");
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/submissions");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Submit Project</h1>
        <p className="mt-2 text-muted-foreground">
          Share your buildathon project with the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cohort & Track Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Buildathon</CardTitle>
            <CardDescription>Select the cohort and track</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cohort">Cohort *</Label>
              <Select
                value={selectedCohort}
                onValueChange={setSelectedCohort}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort" />
                </SelectTrigger>
                <SelectContent>
                  {activeCohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCohort && cohortTracks.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="track">Track (optional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohortTracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.name} - {track.prizePool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Tell us about your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="My Awesome Project"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="A short description of your project"
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what your project does, the problem it solves, and how it works..."
                rows={6}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>Share your project resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demoUrl">Demo URL</Label>
              <Input
                id="demoUrl"
                type="url"
                placeholder="https://your-demo.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repoUrl">Repository URL</Label>
              <Input
                id="repoUrl"
                type="url"
                placeholder="https://github.com/username/repo"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Demo Video URL</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentationUrl">Presentation URL</Label>
              <Input
                id="presentationUrl"
                type="url"
                placeholder="https://docs.google.com/presentation/..."
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>What technologies did you use?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add technology (e.g., React, Python)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
                disabled={isLoading}
              />
              <Button type="button" variant="outline" onClick={addTech}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox id="builtWithStory" />
              <Label htmlFor="builtWithStory" className="text-sm font-normal">
                Built with Story Protocol
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* IP Registration */}
        <Card>
          <CardHeader>
            <CardTitle>IP Registration</CardTitle>
            <CardDescription>
              Register your project as IP on Story Protocol (optional for draft)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>License Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-commercial">
                    Non-Commercial (free to fork, no commercial use)
                  </SelectItem>
                  <SelectItem value="commercial-use">
                    Commercial Use (free to fork and monetize)
                  </SelectItem>
                  <SelectItem value="commercial-remix">
                    Commercial Remix (fork, monetize, with royalties)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                IP registration will happen when you submit your project. You can
                save as draft first to continue working on your submission.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
