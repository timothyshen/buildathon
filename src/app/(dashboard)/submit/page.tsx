"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockCohorts, mockTracks, mockSponsors } from "@/data/mock-data";
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
import { Loader2, X, Plus, Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCohort = searchParams.get("cohort");

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(preselectedCohort || "");
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newTech, setNewTech] = useState("");

  const activeCohorts = mockCohorts.filter(
    (c) => c.status === "active" && c.isPublic
  );
  const cohortTracks = mockTracks.filter((t) => t.cohortId === selectedCohort);

  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  const getSponsorForTrack = (track: typeof mockTracks[0]) => {
    if (track.sponsorId) {
      return mockSponsors.find((s) => s.id === track.sponsorId);
    }
    return null;
  };

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

    // Validate track selection if tracks exist
    if (cohortTracks.length > 0 && selectedTracks.length === 0) {
      alert("Please select at least one track for your submission.");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In real app, would save to database with selected tracks
    console.log("Submission created with tracks:", selectedTracks);

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
                onValueChange={(value) => {
                  setSelectedCohort(value);
                  setSelectedTracks([]); // Reset tracks when cohort changes
                }}
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
              <div className="space-y-3">
                <div>
                  <Label>
                    Track(s) *{" "}
                    <span className="text-muted-foreground font-normal">
                      (select at least one)
                    </span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose the track(s) your project is competing in. You can select multiple tracks.
                  </p>
                </div>
                <div className="grid gap-3">
                  {cohortTracks.map((track) => {
                    const sponsor = getSponsorForTrack(track);
                    const isSelected = selectedTracks.includes(track.id);
                    return (
                      <div
                        key={track.id}
                        onClick={() => toggleTrack(track.id)}
                        className={cn(
                          "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-violet-300",
                          isSelected
                            ? "border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      >
                        {isSelected && (
                          <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-violet-600" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Trophy className="h-5 w-5 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{track.name}</h4>
                              {track.prizePool && (
                                <Badge variant="secondary" className="text-xs">
                                  {track.prizePool}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {track.description}
                            </p>
                            {sponsor && (
                              <div className="flex items-center gap-2 mt-2">
                                {sponsor.logo && (
                                  <img
                                    src={sponsor.logo}
                                    alt={sponsor.name}
                                    className="h-5 w-5 rounded object-contain"
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Sponsored by {sponsor.name}
                                </span>
                              </div>
                            )}
                            {track.requirements && track.requirements.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Requirements:
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                  {track.requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-center gap-1">
                                      <span className="text-violet-500">•</span> {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedTracks.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Please select at least one track for your submission.
                  </p>
                )}
              </div>
            )}

            {selectedCohort && cohortTracks.length === 0 && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  No tracks available for this cohort. Your submission will be entered into the general pool.
                </p>
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
