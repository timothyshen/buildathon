# Submission Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert single-page submission form into a 4-step wizard with auto-save drafts.

**Architecture:** Refactor `submit/page.tsx` into a wizard container with separate step components. Form state managed in parent, passed to steps as props. Auto-save via localStorage with debounce.

**Tech Stack:** Next.js 16, React 19, TipTap (existing), localStorage, shadcn/ui components

---

### Task 1: Create Step Indicator Component

**Files:**
- Create: `src/app/(dashboard)/submit/components/step-indicator.tsx`

**Step 1: Create the step indicator component**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCompleted && "border-violet-600 bg-violet-600 text-white",
                  isCurrent && "border-violet-600 text-violet-600",
                  !isCompleted && !isCurrent && "border-slate-300 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  isCurrent ? "text-violet-600" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12 sm:w-20",
                  isCompleted ? "bg-violet-600" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify component renders**

Run: `npm run dev`
- Import in submit/page.tsx temporarily to verify it renders
- Check mobile and desktop views

**Step 3: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-indicator.tsx
git commit -m "feat(submit): add step indicator component"
```

---

### Task 2: Create Step Details Component

**Files:**
- Create: `src/app/(dashboard)/submit/components/step-details.tsx`

**Step 1: Create the project details step**

```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface StepDetailsProps {
  data: {
    title: string;
    tagline: string;
    description: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepDetails({ data, onChange, errors }: StepDetailsProps) {
  return (
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
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="My Awesome Project"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={data.tagline}
            onChange={(e) => onChange("tagline", e.target.value)}
            placeholder="A short description of your project"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {data.tagline.length}/100 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label>Description *</Label>
          <RichTextEditor
            value={data.description}
            onChange={(value) => onChange("description", value)}
            placeholder="Describe what your project does, the problem it solves, and how it works..."
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-details.tsx
git commit -m "feat(submit): add step details component with rich text editor"
```

---

### Task 3: Create Step Links & Tech Component

**Files:**
- Create: `src/app/(dashboard)/submit/components/step-links-tech.tsx`

**Step 1: Create the links and tech stack step**

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface StepLinksTechProps {
  data: {
    demoUrl: string;
    repoUrl: string;
    videoUrl: string;
    presentationUrl: string;
    techStack: string[];
    builtWithStory: boolean;
  };
  onChange: (field: string, value: string | string[] | boolean) => void;
  errors: Record<string, string>;
}

export function StepLinksTech({ data, onChange, errors }: StepLinksTechProps) {
  const [newTech, setNewTech] = useState("");

  const addTech = () => {
    if (newTech.trim() && !data.techStack.includes(newTech.trim())) {
      onChange("techStack", [...data.techStack, newTech.trim()]);
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    onChange("techStack", data.techStack.filter((t) => t !== tech));
  };

  return (
    <div className="space-y-6">
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
              value={data.demoUrl}
              onChange={(e) => onChange("demoUrl", e.target.value)}
              placeholder="https://your-demo.com"
            />
            {errors.demoUrl && (
              <p className="text-sm text-destructive">{errors.demoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL</Label>
            <Input
              id="repoUrl"
              type="url"
              value={data.repoUrl}
              onChange={(e) => onChange("repoUrl", e.target.value)}
              placeholder="https://github.com/username/repo"
            />
            {errors.repoUrl && (
              <p className="text-sm text-destructive">{errors.repoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Demo Video URL</Label>
            <Input
              id="videoUrl"
              type="url"
              value={data.videoUrl}
              onChange={(e) => onChange("videoUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            {errors.videoUrl && (
              <p className="text-sm text-destructive">{errors.videoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentationUrl">Presentation URL</Label>
            <Input
              id="presentationUrl"
              type="url"
              value={data.presentationUrl}
              onChange={(e) => onChange("presentationUrl", e.target.value)}
              placeholder="https://docs.google.com/presentation/..."
            />
            {errors.presentationUrl && (
              <p className="text-sm text-destructive">{errors.presentationUrl}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tech Stack</CardTitle>
          <CardDescription>What technologies did you use?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
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
            />
            <Button type="button" variant="outline" onClick={addTech}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {data.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.techStack.map((tech) => (
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
            <Checkbox
              id="builtWithStory"
              checked={data.builtWithStory}
              onCheckedChange={(checked) => onChange("builtWithStory", !!checked)}
            />
            <Label htmlFor="builtWithStory" className="text-sm font-normal">
              Built with Story Protocol
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-links-tech.tsx
git commit -m "feat(submit): add step links and tech stack component"
```

---

### Task 4: Create Step Tracks Component

**Files:**
- Create: `src/app/(dashboard)/submit/components/step-tracks.tsx`

**Step 1: Create the cohort and tracks selection step**

```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockCohorts, mockTracks, mockSponsorOrgs } from "@/data/mock-data";

interface StepTracksProps {
  data: {
    cohortId: string;
    trackIds: string[];
  };
  onChange: (field: string, value: string | string[]) => void;
  errors: Record<string, string>;
}

export function StepTracks({ data, onChange, errors }: StepTracksProps) {
  const activeCohorts = mockCohorts.filter(
    (c) => c.status === "active" && c.isPublic
  );
  const cohortTracks = mockTracks.filter((t) => t.cohortId === data.cohortId);

  const toggleTrack = (trackId: string) => {
    const newTrackIds = data.trackIds.includes(trackId)
      ? data.trackIds.filter((id) => id !== trackId)
      : [...data.trackIds, trackId];
    onChange("trackIds", newTrackIds);
  };

  const getSponsorForTrack = (track: typeof mockTracks[0]) => {
    if (track.sponsorOrgId) {
      return mockSponsorOrgs.find((s) => s.id === track.sponsorOrgId);
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort & Tracks</CardTitle>
        <CardDescription>Select the buildathon and prize tracks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cohort">Cohort *</Label>
          <Select
            value={data.cohortId}
            onValueChange={(value) => {
              onChange("cohortId", value);
              onChange("trackIds", []); // Reset tracks when cohort changes
            }}
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
          {errors.cohortId && (
            <p className="text-sm text-destructive">{errors.cohortId}</p>
          )}
        </div>

        {data.cohortId && cohortTracks.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label>
                Track(s) *{" "}
                <span className="text-muted-foreground font-normal">
                  (select at least one)
                </span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the track(s) your project is competing in.
              </p>
            </div>
            <div className="grid gap-3">
              {cohortTracks.map((track) => {
                const sponsor = getSponsorForTrack(track);
                const isSelected = data.trackIds.includes(track.id);
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.trackIds && (
              <p className="text-sm text-destructive">{errors.trackIds}</p>
            )}
          </div>
        )}

        {data.cohortId && cohortTracks.length === 0 && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              No tracks available for this cohort. Your submission will be entered into the general pool.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-tracks.tsx
git commit -m "feat(submit): add step tracks component with cohort/track selection"
```

---

### Task 5: Create Step IP Component (Hidden)

**Files:**
- Create: `src/app/(dashboard)/submit/components/step-ip.tsx`

**Step 1: Create the IP registration step (will be hidden)**

```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepIPProps {
  data: {
    licenseType: string;
  };
  onChange: (field: string, value: string) => void;
}

export function StepIP({ data, onChange }: StepIPProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Registration</CardTitle>
        <CardDescription>
          Register your project as IP on Story Protocol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>License Type</Label>
          <Select
            value={data.licenseType}
            onValueChange={(value) => onChange("licenseType", value)}
          >
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
            IP registration will happen when you submit your project. Your work
            will be protected and can be forked by others according to the
            license you choose.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-ip.tsx
git commit -m "feat(submit): add step IP component (hidden for now)"
```

---

### Task 6: Create Step Review Component

**Files:**
- Create: `src/app/(dashboard)/submit/components/step-review.tsx`

**Step 1: Create the review/summary step**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { Pencil, ExternalLink } from "lucide-react";
import { mockCohorts, mockTracks } from "@/data/mock-data";

interface SubmissionData {
  title: string;
  tagline: string;
  description: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  presentationUrl: string;
  techStack: string[];
  builtWithStory: boolean;
  cohortId: string;
  trackIds: string[];
  licenseType: string;
}

interface StepReviewProps {
  data: SubmissionData;
  onEdit: (step: number) => void;
}

export function StepReview({ data, onEdit }: StepReviewProps) {
  const cohort = mockCohorts.find((c) => c.id === data.cohortId);
  const selectedTracks = mockTracks.filter((t) => data.trackIds.includes(t.id));

  const links = [
    { label: "Demo", url: data.demoUrl },
    { label: "Repository", url: data.repoUrl },
    { label: "Video", url: data.videoUrl },
    { label: "Presentation", url: data.presentationUrl },
  ].filter((l) => l.url);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Project Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{data.title || "—"}</p>
          </div>
          {data.tagline && (
            <div>
              <p className="text-sm text-muted-foreground">Tagline</p>
              <p>{data.tagline}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <div className="rounded-lg bg-muted p-3">
              <RichTextDisplay content={data.description} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Links & Tech</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.label} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24">{link.label}:</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-600 hover:underline flex items-center gap-1"
                  >
                    {link.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No links added</p>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Tech Stack</p>
            {data.techStack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No technologies added</p>
            )}
          </div>

          {data.builtWithStory && (
            <Badge className="bg-violet-100 text-violet-700">
              Built with Story Protocol
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Cohort & Tracks</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Cohort</p>
            <p className="font-medium">{cohort?.name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tracks</p>
            {selectedTracks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTracks.map((track) => (
                  <Badge key={track.id} variant="outline">
                    {track.name}
                    {track.prizePool && (
                      <span className="ml-1 text-muted-foreground">
                        ({track.prizePool})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">General pool</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-review.tsx
git commit -m "feat(submit): add step review component with summary view"
```

---

### Task 7: Create Wizard Container and Auto-Save Logic

**Files:**
- Modify: `src/app/(dashboard)/submit/page.tsx`

**Step 1: Rewrite the submit page as a wizard**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { StepIndicator } from "./components/step-indicator";
import { StepDetails } from "./components/step-details";
import { StepLinksTech } from "./components/step-links-tech";
import { StepTracks } from "./components/step-tracks";
import { StepReview } from "./components/step-review";
import { mockTracks } from "@/data/mock-data";

const STORAGE_KEY = "submission-draft";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Links & Tech" },
  { id: 3, label: "Tracks" },
  { id: 4, label: "Review" },
];

interface SubmissionDraft {
  title: string;
  tagline: string;
  description: string;
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  presentationUrl: string;
  techStack: string[];
  builtWithStory: boolean;
  cohortId: string;
  trackIds: string[];
  licenseType: string;
  currentStep: number;
}

const initialData: SubmissionDraft = {
  title: "",
  tagline: "",
  description: "",
  demoUrl: "",
  repoUrl: "",
  videoUrl: "",
  presentationUrl: "",
  techStack: [],
  builtWithStory: false,
  cohortId: "",
  trackIds: [],
  licenseType: "",
  currentStep: 1,
};

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCohort = searchParams.get("cohort");

  const [data, setData] = useState<SubmissionDraft>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.title || parsed.description || parsed.cohortId) {
          setHasDraft(true);
          setShowDraftBanner(true);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else if (preselectedCohort) {
      setData((prev) => ({ ...prev, cohortId: preselectedCohort }));
    }
  }, [preselectedCohort]);

  // Auto-save on data change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, currentStep }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [data, currentStep]);

  const loadDraft = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      setCurrentStep(parsed.currentStep || 1);
    }
    setShowDraftBanner(false);
  };

  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(preselectedCohort ? { ...initialData, cohortId: preselectedCohort } : initialData);
    setCurrentStep(1);
    setShowDraftBanner(false);
  };

  const handleChange = useCallback((field: string, value: string | string[] | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.title || data.title.length < 3) {
        newErrors.title = "Title must be at least 3 characters";
      }
      if (!data.description || data.description.replace(/<[^>]*>/g, "").length < 50) {
        newErrors.description = "Description must be at least 50 characters";
      }
    }

    if (step === 2) {
      const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
      if (data.demoUrl && !urlPattern.test(data.demoUrl)) {
        newErrors.demoUrl = "Please enter a valid URL";
      }
      if (data.repoUrl && !urlPattern.test(data.repoUrl)) {
        newErrors.repoUrl = "Please enter a valid URL";
      }
      if (data.videoUrl && !urlPattern.test(data.videoUrl)) {
        newErrors.videoUrl = "Please enter a valid URL";
      }
      if (data.presentationUrl && !urlPattern.test(data.presentationUrl)) {
        newErrors.presentationUrl = "Please enter a valid URL";
      }
    }

    if (step === 3) {
      if (!data.cohortId) {
        newErrors.cohortId = "Please select a cohort";
      }
      const cohortTracks = mockTracks.filter((t) => t.cohortId === data.cohortId);
      if (cohortTracks.length > 0 && data.trackIds.length === 0) {
        newErrors.trackIds = "Please select at least one track";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error("Please fix the errors before continuing");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleSaveAndExit = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, currentStep }));
    toast.success("Draft saved");
    router.push("/submissions");
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Project submitted successfully!");
      router.push("/submissions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Draft Recovery Banner */}
      {showDraftBanner && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
          <p className="font-medium">Resume your draft?</p>
          <p className="text-sm text-muted-foreground mt-1">
            You have an unsaved submission draft.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={loadDraft}>
              Continue Draft
            </Button>
            <Button size="sm" variant="outline" onClick={startFresh}>
              Start Fresh
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Submit Project</h1>
        <p className="mt-2 text-muted-foreground">
          Share your buildathon project with the community
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <StepDetails
            data={{ title: data.title, tagline: data.tagline, description: data.description }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <StepLinksTech
            data={{
              demoUrl: data.demoUrl,
              repoUrl: data.repoUrl,
              videoUrl: data.videoUrl,
              presentationUrl: data.presentationUrl,
              techStack: data.techStack,
              builtWithStory: data.builtWithStory,
            }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <StepTracks
            data={{ cohortId: data.cohortId, trackIds: data.trackIds }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <StepReview data={data} onEdit={handleEdit} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={handleSaveAndExit}>
            <Save className="h-4 w-4 mr-2" />
            Save & Exit
          </Button>
        </div>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Project"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify the wizard works**

Run: `npm run dev`
- Navigate to /submit
- Test all 4 steps
- Test draft recovery (refresh page)
- Test validation errors
- Verify auto-save works

**Step 3: Commit**

```bash
git add src/app/(dashboard)/submit/page.tsx
git commit -m "feat(submit): implement multi-step wizard with auto-save"
```

---

### Task 8: Create Components Index File

**Files:**
- Create: `src/app/(dashboard)/submit/components/index.ts`

**Step 1: Create barrel export**

```ts
export { StepIndicator } from "./step-indicator";
export { StepDetails } from "./step-details";
export { StepLinksTech } from "./step-links-tech";
export { StepTracks } from "./step-tracks";
export { StepIP } from "./step-ip";
export { StepReview } from "./step-review";
```

**Step 2: Update page.tsx imports (optional cleanup)**

Update imports in page.tsx to use barrel:
```tsx
import {
  StepIndicator,
  StepDetails,
  StepLinksTech,
  StepTracks,
  StepReview,
} from "./components";
```

**Step 3: Final verification**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add src/app/(dashboard)/submit/
git commit -m "feat(submit): add component barrel export and finalize wizard"
```

---

## Verification Checklist

1. [ ] Step indicator shows progress correctly
2. [ ] Can navigate forward/backward between steps
3. [ ] Validation prevents advancing with errors
4. [ ] Draft auto-saves to localStorage
5. [ ] "Resume draft?" banner appears on reload
6. [ ] "Start Fresh" clears draft
7. [ ] Review step shows all entered data
8. [ ] Edit buttons jump to correct step
9. [ ] Submit clears draft and redirects
10. [ ] Mobile layout works correctly
11. [ ] `npm run build` passes
