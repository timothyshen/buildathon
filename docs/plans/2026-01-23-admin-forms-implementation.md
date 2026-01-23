# Admin Forms Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build admin forms for cohort, sponsor, and workshop management with role-based access for admins and sponsors.

**Architecture:** Extend existing mock data layer with new types (Sponsor, MediaAsset, WorkshopVersion). Add sponsor role with navigation. Build forms using existing UI components (Dialog, Input, Select). Integrate Tiptap for rich text workshop editor.

**Tech Stack:** Next.js 16, React 19, TypeScript, Radix UI, React Hook Form, Zod, Tiptap

---

## Phase 1: Data & Types

### Task 1.1: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add new types to src/types/index.ts**

Add after line 151 (after Template interface):

```typescript
export type SponsorTier = "platinum" | "gold" | "silver" | "bronze" | "community";

export interface Sponsor {
  id: string;
  cohortId: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
  contactName: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

export interface WorkshopVersion {
  id: string;
  workshopId: string;
  content: string;
  title: string;
  authorId: string;
  createdAt: Date;
  changeNote?: string;
}
```

**Step 2: Update UserRole type**

Change line 1 from:
```typescript
export type UserRole = "admin" | "judge" | "participant";
```
to:
```typescript
export type UserRole = "admin" | "sponsor" | "judge" | "participant";
```

**Step 3: Update User interface**

Add `sponsorId` field after `role` (around line 8):
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  sponsorId?: string;
  walletAddress?: string;
  bio?: string;
  twitter?: string;
  github?: string;
  createdAt: Date;
}
```

**Step 4: Update Workshop interface**

Replace the Workshop interface (lines 126-137) with:
```typescript
export type WorkshopStatus = "draft" | "published" | "archived";

export interface Workshop {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  articleUrl?: string;
  partnerName?: string;
  partnerLogo?: string;
  sponsorId?: string;
  createdBy?: string;
  category: string;
  duration?: string;
  status: WorkshopStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 5: Update Track interface**

Add `sponsorId` field (around line 45):
```typescript
export interface Track {
  id: string;
  cohortId: string;
  sponsorId?: string;
  name: string;
  description: string;
  prizePool?: string;
  sponsorName?: string;
  sponsorLogo?: string;
  requirements?: string[];
}
```

**Step 6: Verify types compile**

Run: `cd /Users/timtimtim/Workspace/buildathon && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Sponsor, MediaAsset, WorkshopVersion types and sponsor role"
```

---

### Task 1.2: Update Mock Data

**Files:**
- Modify: `src/data/mock-data.ts`

**Step 1: Update imports**

Change line 1 to:
```typescript
import type { User, Cohort, Track, Team, Submission, Review, Workshop, Template, Sponsor, MediaAsset, WorkshopVersion } from "@/types";
```

**Step 2: Add sponsor user to mockUsers**

Add after user-4 (around line 41):
```typescript
  {
    id: "user-5",
    email: "sponsor@gamefi.com",
    name: "Sarah Sponsor",
    role: "sponsor",
    sponsorId: "sponsor-1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sponsor",
    createdAt: new Date("2024-02-01"),
  },
```

**Step 3: Add mockSponsors array**

Add after mockTemplates array:
```typescript
// Mock Sponsors
export const mockSponsors: Sponsor[] = [
  {
    id: "sponsor-1",
    cohortId: "cohort-2",
    name: "GameFi Labs",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=gamefi",
    website: "https://gamefi.example.com",
    description: "Leading gaming infrastructure provider for Web3",
    tier: "gold",
    prizePoolContribution: 5000,
    hasDedicatedTrack: true,
    contactName: "Sarah Sponsor",
    contactEmail: "sponsor@gamefi.com",
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "sponsor-2",
    cohortId: "cohort-2",
    name: "AI Labs",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=ailabs",
    website: "https://ailabs.example.com",
    description: "Pioneering AI research and applications",
    tier: "platinum",
    prizePoolContribution: 10000,
    hasDedicatedTrack: false,
    contactName: "Alex AI",
    contactEmail: "alex@ailabs.example.com",
    createdAt: new Date("2024-05-10"),
    updatedAt: new Date("2024-05-10"),
  },
];
```

**Step 4: Add mockMediaAssets array**

```typescript
// Mock Media Assets
export const mockMediaAssets: MediaAsset[] = [
  {
    id: "media-1",
    filename: "workshop-banner.png",
    url: "https://picsum.photos/seed/banner1/800/400",
    mimeType: "image/png",
    size: 245000,
    uploadedBy: "user-1",
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "media-2",
    filename: "sponsor-logo.svg",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=logo",
    mimeType: "image/svg+xml",
    size: 12000,
    uploadedBy: "user-5",
    createdAt: new Date("2024-03-15"),
  },
];
```

**Step 5: Add mockWorkshopVersions array**

```typescript
// Mock Workshop Versions
export const mockWorkshopVersions: WorkshopVersion[] = [
  {
    id: "version-1",
    workshopId: "workshop-1",
    content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Initial version" }] }] }),
    title: "Getting Started with Story Protocol",
    authorId: "user-1",
    createdAt: new Date("2024-01-15"),
    changeNote: "Initial publish",
  },
];
```

**Step 6: Update mockWorkshops with new fields**

Replace mockWorkshops array with:
```typescript
// Mock Workshops
export const mockWorkshops: Workshop[] = [
  {
    id: "workshop-1",
    title: "Getting Started with Story Protocol",
    description: "Learn the basics of Story Protocol and how to register your first IP asset.",
    content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Welcome to Story Protocol!" }] }] }),
    videoUrl: "https://youtube.com/watch?v=intro",
    partnerName: "Story Foundation",
    category: "Basics",
    duration: "30 min",
    status: "published",
    createdBy: "user-1",
    publishedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "workshop-2",
    title: "Building AI Agents on Story",
    description: "Deep dive into creating AI agents that interact with IP assets.",
    videoUrl: "https://youtube.com/watch?v=ai-agents",
    articleUrl: "https://docs.story.foundation/ai-agents",
    partnerName: "AI Labs",
    sponsorId: "sponsor-2",
    category: "Advanced",
    duration: "45 min",
    status: "published",
    createdBy: "user-5",
    publishedAt: new Date("2024-02-20"),
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "workshop-3",
    title: "IP Licensing 101",
    description: "Understanding programmable licenses and royalty policies.",
    articleUrl: "https://docs.story.foundation/licensing",
    partnerName: "Story Foundation",
    category: "Basics",
    duration: "20 min",
    status: "published",
    createdBy: "user-1",
    publishedAt: new Date("2024-03-01"),
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "workshop-4",
    title: "From Hackathon to Production",
    description: "How to take your buildathon project and turn it into a real product.",
    videoUrl: "https://youtube.com/watch?v=production",
    partnerName: "Builder Academy",
    category: "Business",
    duration: "60 min",
    status: "draft",
    createdBy: "user-1",
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-04-10"),
  },
];
```

**Step 7: Add helper functions**

Add at the end of the file:
```typescript
// Helper function to get sponsors by cohort
export function getSponsorsByCohort(cohortId: string): Sponsor[] {
  return mockSponsors.filter(s => s.cohortId === cohortId);
}

// Helper function to get workshops by sponsor
export function getWorkshopsBySponsor(sponsorId: string): Workshop[] {
  return mockWorkshops.filter(w => w.sponsorId === sponsorId);
}

// Helper function to get sponsor by user
export function getSponsorByUser(userId: string): Sponsor | undefined {
  const user = mockUsers.find(u => u.id === userId);
  if (!user?.sponsorId) return undefined;
  return mockSponsors.find(s => s.id === user.sponsorId);
}
```

**Step 8: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add src/data/mock-data.ts
git commit -m "feat: add mock data for sponsors, media assets, workshop versions"
```

---

### Task 1.3: Create Zod Schemas

**Files:**
- Create: `src/lib/schemas.ts`

**Step 1: Create the schemas file**

```typescript
import { z } from "zod";

// Cohort Schema
export const cohortSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().min(1, "Description is required"),
  tagline: z.string().optional(),
  bannerImage: z.string().url().optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  submissionDeadline: z.string().min(1, "Submission deadline is required"),
  judgingStart: z.string().min(1, "Judging start is required"),
  judgingEnd: z.string().min(1, "Judging end is required"),
  status: z.enum(["draft", "upcoming", "active", "judging", "completed"]),
  isPublic: z.boolean(),
  maxTeamSize: z.number().min(1).max(10),
  prizes: z.array(z.object({
    place: z.string().min(1),
    amount: z.string().min(1),
    description: z.string().optional(),
  })).optional(),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: "Start date must be before end date",
  path: ["endDate"],
}).refine(data => new Date(data.submissionDeadline) <= new Date(data.endDate), {
  message: "Submission deadline must be before or on end date",
  path: ["submissionDeadline"],
});

export type CohortFormData = z.infer<typeof cohortSchema>;

// Sponsor Schema
export const sponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  tier: z.enum(["platinum", "gold", "silver", "bronze", "community"]),
  prizePoolContribution: z.number().min(0, "Must be 0 or greater"),
  hasDedicatedTrack: z.boolean(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Must be a valid email"),
  cohortId: z.string().min(1, "Cohort is required"),
});

export type SponsorFormData = z.infer<typeof sponsorSchema>;

// Invite Sponsor Schema
export const inviteSponsorSchema = z.object({
  email: z.string().email("Must be a valid email"),
  name: z.string().min(1, "Name is required"),
  sponsorId: z.string().min(1, "Sponsor organization is required"),
});

export type InviteSponsorFormData = z.infer<typeof inviteSponsorSchema>;

// Track Schema
export const trackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  prizePool: z.string().optional(),
  cohortId: z.string().min(1, "Cohort is required"),
  requirements: z.array(z.string()).optional(),
});

export type TrackFormData = z.infer<typeof trackSchema>;

// Workshop Schema
export const workshopSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  duration: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  articleUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});

export type WorkshopFormData = z.infer<typeof workshopSchema>;
```

**Step 2: Verify types compile**

Run: `cd /Users/timtimtim/Workspace/buildathon && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/schemas.ts
git commit -m "feat: add Zod validation schemas for forms"
```

---

## Phase 2: Sidebar & Navigation

### Task 2.1: Update Sidebar for Sponsor Role

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: Update NavItem interface type**

Change line 33 from:
```typescript
  roles?: ("admin" | "judge" | "participant")[];
```
to:
```typescript
  roles?: ("admin" | "sponsor" | "judge" | "participant")[];
```

**Step 2: Update NavSection interface type**

Change line 41 from:
```typescript
  roles?: ("admin" | "judge" | "participant")[];
```
to:
```typescript
  roles?: ("admin" | "sponsor" | "judge" | "participant")[];
```

**Step 3: Add Sponsor section to navSections**

Add after the Judging section (after line 89):
```typescript
    {
      title: "Sponsor",
      roles: ["sponsor"],
      items: [
        { href: "/sponsor/workshops", label: "My Workshops", icon: GraduationCap },
        { href: "/sponsor/tracks", label: "My Tracks", icon: Trophy },
        {
          href: "/sponsor/reviews",
          label: "Review Queue",
          icon: Star,
          badge: pendingReviews > 0 ? pendingReviews : undefined,
        },
      ],
    },
```

**Step 4: Add Sponsors link to Admin section**

Add after Judges link (around line 101):
```typescript
        { href: "/admin/sponsors", label: "Sponsors", icon: Users },
```

**Step 5: Add Media Library link to Admin section**

Add after Workshop link:
```typescript
        { href: "/admin/media", label: "Media Library", icon: FileText },
```

**Step 6: Import FileText if not already imported**

Verify FileText is in the imports at the top.

**Step 7: Update role switcher to include sponsor**

Change line 246 from:
```typescript
              {(["participant", "judge", "admin"] as const).map((role) => (
```
to:
```typescript
              {(["participant", "judge", "sponsor", "admin"] as const).map((role) => (
```

**Step 8: Add sponsor badge color**

Add case in getRoleBadgeColor function (around line 140):
```typescript
      case "sponsor":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
```

**Step 9: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 10: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: add sponsor role navigation and media library link"
```

---

## Phase 3: Cohort Forms

### Task 3.1: Create Cohort Form Component

**Files:**
- Create: `src/components/admin/cohorts/cohort-form.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/components/admin/cohorts`

**Step 2: Create cohort-form.tsx**

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cohortSchema, type CohortFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Cohort } from "@/types";

interface CohortFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohort?: Cohort;
  onSubmit: (data: CohortFormData) => void;
}

const steps = ["Basic Info", "Dates", "Settings", "Prizes"];

export function CohortForm({ open, onOpenChange, cohort, onSubmit }: CohortFormProps) {
  const [step, setStep] = useState(0);
  const [prizes, setPrizes] = useState<{ place: string; amount: string; description?: string }[]>(
    cohort?.prizes || [{ place: "1st", amount: "", description: "" }]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<CohortFormData>({
    resolver: zodResolver(cohortSchema),
    defaultValues: cohort
      ? {
          name: cohort.name,
          slug: cohort.slug,
          description: cohort.description,
          tagline: cohort.tagline || "",
          bannerImage: cohort.bannerImage || "",
          startDate: cohort.startDate.toISOString().split("T")[0],
          endDate: cohort.endDate.toISOString().split("T")[0],
          submissionDeadline: cohort.submissionDeadline.toISOString().slice(0, 16),
          judgingStart: cohort.judgingStart.toISOString().slice(0, 16),
          judgingEnd: cohort.judgingEnd.toISOString().slice(0, 16),
          status: cohort.status,
          isPublic: cohort.isPublic,
          maxTeamSize: cohort.maxTeamSize,
          prizes: cohort.prizes,
        }
      : {
          status: "draft",
          isPublic: false,
          maxTeamSize: 5,
        },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    if (!cohort) {
      setValue("slug", generateSlug(name));
    }
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof CohortFormData)[][] = [
      ["name", "slug", "description"],
      ["startDate", "endDate", "submissionDeadline", "judgingStart", "judgingEnd"],
      ["status", "isPublic", "maxTeamSize"],
      [],
    ];

    const isValid = await trigger(fieldsToValidate[step]);
    if (isValid) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const addPrize = () => {
    const places = ["1st", "2nd", "3rd", "4th", "5th"];
    const nextPlace = places[prizes.length] || `${prizes.length + 1}th`;
    setPrizes([...prizes, { place: nextPlace, amount: "", description: "" }]);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index: number, field: string, value: string) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const onFormSubmit = (data: CohortFormData) => {
    onSubmit({ ...data, prizes });
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cohort ? "Edit Cohort" : "Create Cohort"}</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {steps.length}: {steps[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-4">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-violet-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  onChange={handleNameChange}
                  placeholder="SWA Summer 2024"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder="swa-summer-2024"
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  {...register("tagline")}
                  placeholder="Build the future of IP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe this buildathon..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">Banner Image URL</Label>
                <Input
                  id="bannerImage"
                  {...register("bannerImage")}
                  type="url"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Dates */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                <Input
                  id="submissionDeadline"
                  type="datetime-local"
                  {...register("submissionDeadline")}
                />
                {errors.submissionDeadline && (
                  <p className="text-sm text-red-500">{errors.submissionDeadline.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="judgingStart">Judging Start *</Label>
                  <Input
                    id="judgingStart"
                    type="datetime-local"
                    {...register("judgingStart")}
                  />
                  {errors.judgingStart && (
                    <p className="text-sm text-red-500">{errors.judgingStart.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judgingEnd">Judging End *</Label>
                  <Input
                    id="judgingEnd"
                    type="datetime-local"
                    {...register("judgingEnd")}
                  />
                  {errors.judgingEnd && (
                    <p className="text-sm text-red-500">{errors.judgingEnd.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as CohortFormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="judging">Judging</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTeamSize">Max Team Size</Label>
                <Input
                  id="maxTeamSize"
                  type="number"
                  min={1}
                  max={10}
                  {...register("maxTeamSize", { valueAsNumber: true })}
                />
                {errors.maxTeamSize && (
                  <p className="text-sm text-red-500">{errors.maxTeamSize.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={watch("isPublic")}
                  onCheckedChange={(checked) => setValue("isPublic", !!checked)}
                />
                <Label htmlFor="isPublic">Make this cohort public</Label>
              </div>
            </div>
          )}

          {/* Step 4: Prizes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Prizes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPrize}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Prize
                </Button>
              </div>

              <div className="space-y-3">
                {prizes.map((prize, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="w-20">
                      <Input
                        value={prize.place}
                        onChange={(e) => updatePrize(index, "place", e.target.value)}
                        placeholder="1st"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        value={prize.amount}
                        onChange={(e) => updatePrize(index, "amount", e.target.value)}
                        placeholder="$10,000"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={prize.description || ""}
                        onChange={(e) => updatePrize(index, "description", e.target.value)}
                        placeholder="Description (optional)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrize(index)}
                      disabled={prizes.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setStep(0);
                }}
              >
                Cancel
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit">
                  {cohort ? "Save Changes" : "Create Cohort"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/admin/cohorts/cohort-form.tsx
git commit -m "feat: add multi-step cohort form component"
```

---

### Task 3.2: Create Cohort Table Component

**Files:**
- Create: `src/components/admin/cohorts/cohort-table.tsx`

**Step 1: Create cohort-table.tsx**

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Eye, Users } from "lucide-react";
import Link from "next/link";
import type { Cohort } from "@/types";
import { mockSponsors } from "@/data/mock-data";

interface CohortTableProps {
  cohorts: Cohort[];
  onEdit: (cohort: Cohort) => void;
}

const statusColors: Record<Cohort["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  upcoming: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  judging: "bg-purple-100 text-purple-700",
  completed: "bg-amber-100 text-amber-700",
};

export function CohortTable({ cohorts, onEdit }: CohortTableProps) {
  const getSponsorCount = (cohortId: string) => {
    return mockSponsors.filter((s) => s.cohortId === cohortId).length;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Sponsors</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cohorts.map((cohort) => (
          <TableRow key={cohort.id}>
            <TableCell>
              <div>
                <p className="font-medium">{cohort.name}</p>
                <p className="text-xs text-muted-foreground">{cohort.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[cohort.status]}>
                {cohort.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p>{new Date(cohort.startDate).toLocaleDateString()}</p>
                <p className="text-muted-foreground">
                  to {new Date(cohort.endDate).toLocaleDateString()}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{getSponsorCount(cohort.id)}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={cohort.isPublic ? "default" : "outline"}>
                {cohort.isPublic ? "Public" : "Private"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/cohorts/${cohort.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(cohort)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/cohorts/cohort-table.tsx
git commit -m "feat: add cohort table component"
```

---

### Task 3.3: Update Admin Cohorts Page

**Files:**
- Modify: `src/app/(dashboard)/cohorts/page.tsx`

**Step 1: Read current file and replace with enhanced version**

```typescript
"use client";

import { useState } from "react";
import { mockCohorts } from "@/data/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CohortForm } from "@/components/admin/cohorts/cohort-form";
import { CohortTable } from "@/components/admin/cohorts/cohort-table";
import type { Cohort } from "@/types";
import type { CohortFormData } from "@/lib/schemas";

export default function CohortsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | undefined>();

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: CohortFormData) => {
    console.log("Form submitted:", data);
    // In real app, would call API here
    setEditingCohort(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingCohort(undefined);
    }
  };

  const activeCohorts = mockCohorts.filter((c) => c.status === "active").length;
  const upcomingCohorts = mockCohorts.filter((c) => c.status === "upcoming").length;
  const completedCohorts = mockCohorts.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cohorts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage buildathon cohorts and their settings
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Cohort
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCohorts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCohorts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingCohorts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{completedCohorts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Table */}
      <Card>
        <CardContent className="p-0">
          <CohortTable cohorts={mockCohorts} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <CohortForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        cohort={editingCohort}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/(dashboard)/cohorts/page.tsx
git commit -m "feat: integrate cohort form and table into cohorts page"
```

---

## Phase 4: Sponsor Management

### Task 4.1: Create Sponsor Form Component

**Files:**
- Create: `src/components/admin/sponsors/sponsor-form.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/components/admin/sponsors`

**Step 2: Create sponsor-form.tsx**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sponsorSchema, type SponsorFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Sponsor } from "@/types";
import { mockCohorts } from "@/data/mock-data";

interface SponsorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor?: Sponsor;
  onSubmit: (data: SponsorFormData) => void;
  defaultCohortId?: string;
}

export function SponsorForm({
  open,
  onOpenChange,
  sponsor,
  onSubmit,
  defaultCohortId,
}: SponsorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: sponsor
      ? {
          name: sponsor.name,
          logo: sponsor.logo,
          website: sponsor.website,
          description: sponsor.description,
          tier: sponsor.tier,
          prizePoolContribution: sponsor.prizePoolContribution,
          hasDedicatedTrack: sponsor.hasDedicatedTrack,
          contactName: sponsor.contactName,
          contactEmail: sponsor.contactEmail,
          cohortId: sponsor.cohortId,
        }
      : {
          tier: "silver",
          prizePoolContribution: 0,
          hasDedicatedTrack: false,
          cohortId: defaultCohortId || "",
        },
  });

  const onFormSubmit = (data: SponsorFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          <DialogDescription>
            {sponsor
              ? "Update sponsor organization details"
              : "Add a new sponsor organization to this cohort"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input id="name" {...register("name")} placeholder="Acme Corp" />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohortId">Cohort *</Label>
              <Select
                value={watch("cohortId")}
                onValueChange={(value) => setValue("cohortId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {mockCohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cohortId && (
                <p className="text-sm text-red-500">{errors.cohortId.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" {...register("logo")} type="url" placeholder="https://..." />
              {errors.logo && (
                <p className="text-sm text-red-500">{errors.logo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register("website")}
                type="url"
                placeholder="https://..."
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="About this sponsor..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={watch("tier")}
                onValueChange={(value) =>
                  setValue("tier", value as SponsorFormData["tier"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizePoolContribution">Prize Pool Contribution ($)</Label>
              <Input
                id="prizePoolContribution"
                type="number"
                min={0}
                {...register("prizePoolContribution", { valueAsNumber: true })}
              />
              {errors.prizePoolContribution && (
                <p className="text-sm text-red-500">
                  {errors.prizePoolContribution.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDedicatedTrack"
              checked={watch("hasDedicatedTrack")}
              onCheckedChange={(checked) => setValue("hasDedicatedTrack", !!checked)}
            />
            <Label htmlFor="hasDedicatedTrack">Has dedicated track</Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                {...register("contactName")}
                placeholder="John Doe"
              />
              {errors.contactName && (
                <p className="text-sm text-red-500">{errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                {...register("contactEmail")}
                type="email"
                placeholder="john@example.com"
              />
              {errors.contactEmail && (
                <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{sponsor ? "Save Changes" : "Add Sponsor"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/admin/sponsors/sponsor-form.tsx
git commit -m "feat: add sponsor form component"
```

---

### Task 4.2: Create Sponsor Table Component

**Files:**
- Create: `src/components/admin/sponsors/sponsor-table.tsx`

**Step 1: Create sponsor-table.tsx**

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Mail } from "lucide-react";
import type { Sponsor } from "@/types";

interface SponsorTableProps {
  sponsors: Sponsor[];
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (sponsor: Sponsor) => void;
  onInvite: (sponsor: Sponsor) => void;
}

const tierColors: Record<Sponsor["tier"], string> = {
  platinum: "bg-slate-200 text-slate-800",
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-600",
  bronze: "bg-orange-100 text-orange-800",
  community: "bg-green-100 text-green-800",
};

export function SponsorTable({ sponsors, onEdit, onDelete, onInvite }: SponsorTableProps) {
  const sortedSponsors = [...sponsors].sort((a, b) => {
    const tierOrder = ["platinum", "gold", "silver", "bronze", "community"];
    return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sponsor</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Contribution</TableHead>
          <TableHead>Track</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSponsors.map((sponsor) => (
          <TableRow key={sponsor.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-slate-200" />
                )}
                <div>
                  <p className="font-medium">{sponsor.name}</p>
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {sponsor.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={tierColors[sponsor.tier]}>{sponsor.tier}</Badge>
            </TableCell>
            <TableCell>${sponsor.prizePoolContribution.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={sponsor.hasDedicatedTrack ? "default" : "outline"}>
                {sponsor.hasDedicatedTrack ? "Yes" : "No"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p>{sponsor.contactName}</p>
                <p className="text-muted-foreground">{sponsor.contactEmail}</p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onInvite(sponsor)}
                  title="Invite sponsor user"
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(sponsor)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(sponsor)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {sortedSponsors.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No sponsors yet. Add a sponsor to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/sponsors/sponsor-table.tsx
git commit -m "feat: add sponsor table component"
```

---

### Task 4.3: Create Invite Sponsor Form

**Files:**
- Create: `src/components/admin/sponsors/invite-sponsor-form.tsx`

**Step 1: Create invite-sponsor-form.tsx**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSponsorSchema, type InviteSponsorFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mockSponsors } from "@/data/mock-data";
import type { Sponsor } from "@/types";

interface InviteSponsorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InviteSponsorFormData) => void;
  defaultSponsor?: Sponsor;
}

export function InviteSponsorForm({
  open,
  onOpenChange,
  onSubmit,
  defaultSponsor,
}: InviteSponsorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<InviteSponsorFormData>({
    resolver: zodResolver(inviteSponsorSchema),
    defaultValues: {
      email: defaultSponsor?.contactEmail || "",
      name: defaultSponsor?.contactName || "",
      sponsorId: defaultSponsor?.id || "",
    },
  });

  const onFormSubmit = (data: InviteSponsorFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Sponsor User</DialogTitle>
          <DialogDescription>
            Send an invitation email to create a sponsor account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sponsorId">Sponsor Organization *</Label>
            <Select
              value={watch("sponsorId")}
              onValueChange={(value) => setValue("sponsorId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {mockSponsors.map((sponsor) => (
                  <SelectItem key={sponsor.id} value={sponsor.id}>
                    {sponsor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sponsorId && (
              <p className="text-sm text-red-500">{errors.sponsorId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="John Doe" />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Send Invitation</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/admin/sponsors/invite-sponsor-form.tsx
git commit -m "feat: add invite sponsor form component"
```

---

### Task 4.4: Create Admin Sponsors Page

**Files:**
- Create: `src/app/(dashboard)/admin/sponsors/page.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/app/(dashboard)/admin/sponsors`

**Step 2: Create page.tsx**

```typescript
"use client";

import { useState } from "react";
import { mockSponsors, mockCohorts } from "@/data/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import { SponsorForm } from "@/components/admin/sponsors/sponsor-form";
import { SponsorTable } from "@/components/admin/sponsors/sponsor-table";
import { InviteSponsorForm } from "@/components/admin/sponsors/invite-sponsor-form";
import type { Sponsor } from "@/types";
import type { SponsorFormData, InviteSponsorFormData } from "@/lib/schemas";

export default function AdminSponsorsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | undefined>();
  const [invitingSponsor, setInvitingSponsor] = useState<Sponsor | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCohort, setFilterCohort] = useState<string>("all");

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsFormOpen(true);
  };

  const handleDelete = (sponsor: Sponsor) => {
    if (confirm(`Delete sponsor "${sponsor.name}"?`)) {
      console.log("Delete:", sponsor.id);
    }
  };

  const handleInvite = (sponsor: Sponsor) => {
    setInvitingSponsor(sponsor);
    setIsInviteOpen(true);
  };

  const handleFormSubmit = (data: SponsorFormData) => {
    console.log("Sponsor form submitted:", data);
    setEditingSponsor(undefined);
  };

  const handleInviteSubmit = (data: InviteSponsorFormData) => {
    console.log("Invite submitted:", data);
    setInvitingSponsor(undefined);
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingSponsor(undefined);
  };

  const handleInviteOpenChange = (open: boolean) => {
    setIsInviteOpen(open);
    if (!open) setInvitingSponsor(undefined);
  };

  const filteredSponsors = mockSponsors.filter((sponsor) => {
    const matchesSearch =
      sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCohort = filterCohort === "all" || sponsor.cohortId === filterCohort;
    return matchesSearch && matchesCohort;
  });

  const totalContribution = mockSponsors.reduce(
    (sum, s) => sum + s.prizePoolContribution,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sponsors</h1>
          <p className="mt-2 text-muted-foreground">
            Manage sponsor organizations and invitations
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Sponsor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSponsors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalContribution.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSponsors.filter((s) => s.hasDedicatedTrack).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platinum/Gold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSponsors.filter((s) => ["platinum", "gold"].includes(s.tier)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sponsors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCohort} onValueChange={setFilterCohort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            {mockCohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {cohort.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sponsors Table */}
      <Card>
        <CardContent className="p-0">
          <SponsorTable
            sponsors={filteredSponsors}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onInvite={handleInvite}
          />
        </CardContent>
      </Card>

      {/* Forms */}
      <SponsorForm
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        sponsor={editingSponsor}
        onSubmit={handleFormSubmit}
      />

      <InviteSponsorForm
        open={isInviteOpen}
        onOpenChange={handleInviteOpenChange}
        onSubmit={handleInviteSubmit}
        defaultSponsor={invitingSponsor}
      />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/(dashboard)/admin/sponsors/page.tsx
git commit -m "feat: add admin sponsors management page"
```

---

## Phase 5: Track Management (Sponsor)

### Task 5.1: Create Track Form Component

**Files:**
- Create: `src/components/sponsor/tracks/track-form.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/components/sponsor/tracks`

**Step 2: Create track-form.tsx**

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackSchema, type TrackFormData } from "@/lib/schemas";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Track } from "@/types";
import { mockCohorts } from "@/data/mock-data";

interface TrackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: Track;
  onSubmit: (data: TrackFormData) => void;
  allowedCohortIds?: string[];
}

export function TrackForm({
  open,
  onOpenChange,
  track,
  onSubmit,
  allowedCohortIds,
}: TrackFormProps) {
  const [requirements, setRequirements] = useState<string[]>(
    track?.requirements || [""]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackSchema),
    defaultValues: track
      ? {
          name: track.name,
          description: track.description,
          prizePool: track.prizePool || "",
          cohortId: track.cohortId,
          requirements: track.requirements,
        }
      : {
          cohortId: allowedCohortIds?.[0] || "",
        },
  });

  const availableCohorts = allowedCohortIds
    ? mockCohorts.filter((c) => allowedCohortIds.includes(c.id))
    : mockCohorts;

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const onFormSubmit = (data: TrackFormData) => {
    const filteredRequirements = requirements.filter((r) => r.trim() !== "");
    onSubmit({ ...data, requirements: filteredRequirements });
    reset();
    setRequirements([""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{track ? "Edit Track" : "Create Track"}</DialogTitle>
          <DialogDescription>
            {track ? "Update track details" : "Create a new bounty track"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Track Name *</Label>
              <Input id="name" {...register("name")} placeholder="AI Agents" />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohortId">Cohort *</Label>
              <Select
                value={watch("cohortId")}
                onValueChange={(value) => setValue("cohortId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {availableCohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cohortId && (
                <p className="text-sm text-red-500">{errors.cohortId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What should participants build for this track?"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizePool">Prize Pool</Label>
            <Input
              id="prizePool"
              {...register("prizePool")}
              placeholder="$5,000"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Requirements</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder="Must use Story Protocol SDK"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRequirement(index)}
                    disabled={requirements.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{track ? "Save Changes" : "Create Track"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/sponsor/tracks/track-form.tsx
git commit -m "feat: add track form component for sponsors"
```

---

### Task 5.2: Create Sponsor Tracks Page

**Files:**
- Create: `src/app/(dashboard)/sponsor/tracks/page.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/app/(dashboard)/sponsor/tracks`

**Step 2: Create page.tsx**

```typescript
"use client";

import { useState } from "react";
import { mockTracks, mockCohorts, mockSponsors } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { TrackForm } from "@/components/sponsor/tracks/track-form";
import type { Track } from "@/types";
import type { TrackFormData } from "@/lib/schemas";

export default function SponsorTracksPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | undefined>();

  // Get sponsor's organization
  const sponsor = mockSponsors.find((s) => s.id === user?.sponsorId);

  // Get tracks owned by this sponsor
  const sponsorTracks = mockTracks.filter((t) => t.sponsorId === sponsor?.id);

  // Get cohorts where this sponsor is participating
  const sponsorCohortIds = mockSponsors
    .filter((s) => s.id === sponsor?.id)
    .map((s) => s.cohortId);

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setIsFormOpen(true);
  };

  const handleDelete = (track: Track) => {
    if (confirm(`Delete track "${track.name}"?`)) {
      console.log("Delete:", track.id);
    }
  };

  const handleSubmit = (data: TrackFormData) => {
    console.log("Track form submitted:", data);
    setEditingTrack(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingTrack(undefined);
  };

  const getCohortName = (cohortId: string) => {
    return mockCohorts.find((c) => c.id === cohortId)?.name || "Unknown";
  };

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tracks</h1>
          <p className="mt-2 text-muted-foreground">
            Manage bounty tracks for {sponsor.name}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Track
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorTracks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sponsorTracks
                .map((t) => t.prizePool || "$0")
                .join(" + ") || "$0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorCohortIds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tracks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Prize Pool</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorTracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{track.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {track.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCohortName(track.cohortId)}</Badge>
                  </TableCell>
                  <TableCell>{track.prizePool || "-"}</TableCell>
                  <TableCell>
                    {track.requirements?.length || 0} requirements
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(track)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(track)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sponsorTracks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No tracks yet. Create a track to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Track Form */}
      <TrackForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        track={editingTrack}
        onSubmit={handleSubmit}
        allowedCohortIds={sponsorCohortIds}
      />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/(dashboard)/sponsor/tracks/page.tsx
git commit -m "feat: add sponsor tracks management page"
```

---

## Phase 6: Workshop Forms (Basic - without Tiptap)

### Task 6.1: Create Basic Workshop Form

**Files:**
- Create: `src/components/shared/workshop/workshop-form.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/components/shared/workshop`

**Step 2: Create workshop-form.tsx**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workshopSchema, type WorkshopFormData } from "@/lib/schemas";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Workshop } from "@/types";

interface WorkshopFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop?: Workshop;
  onSubmit: (data: WorkshopFormData) => void;
}

const categories = ["Basics", "Advanced", "Business", "Technical"];

export function WorkshopForm({
  open,
  onOpenChange,
  workshop,
  onSubmit,
}: WorkshopFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: workshop
      ? {
          title: workshop.title,
          description: workshop.description,
          content: workshop.content || "",
          category: workshop.category,
          duration: workshop.duration || "",
          videoUrl: workshop.videoUrl || "",
          articleUrl: workshop.articleUrl || "",
          status: workshop.status,
        }
      : {
          status: "draft",
          category: "Basics",
        },
  });

  const onFormSubmit = (data: WorkshopFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{workshop ? "Edit Workshop" : "Create Workshop"}</DialogTitle>
          <DialogDescription>
            {workshop ? "Update workshop details" : "Create new learning content"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Getting Started with Story Protocol"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What will learners gain from this content?"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                {...register("duration")}
                placeholder="e.g., 30 min"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              {...register("videoUrl")}
              type="url"
              placeholder="https://youtube.com/..."
            />
            {errors.videoUrl && (
              <p className="text-sm text-red-500">{errors.videoUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="articleUrl">Article URL</Label>
            <Input
              id="articleUrl"
              {...register("articleUrl")}
              type="url"
              placeholder="https://docs..."
            />
            {errors.articleUrl && (
              <p className="text-sm text-red-500">{errors.articleUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as WorkshopFormData["status"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{workshop ? "Save Changes" : "Create Workshop"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/shared/workshop/workshop-form.tsx
git commit -m "feat: add basic workshop form component"
```

---

### Task 6.2: Create Sponsor Workshops Page

**Files:**
- Create: `src/app/(dashboard)/sponsor/workshops/page.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/app/(dashboard)/sponsor/workshops`

**Step 2: Create page.tsx**

```typescript
"use client";

import { useState } from "react";
import { mockWorkshops, mockSponsors } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2, Play, FileText } from "lucide-react";
import { WorkshopForm } from "@/components/shared/workshop/workshop-form";
import type { Workshop } from "@/types";
import type { WorkshopFormData } from "@/lib/schemas";

const statusColors: Record<Workshop["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-amber-100 text-amber-700",
};

export default function SponsorWorkshopsPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | undefined>();

  // Get sponsor's organization
  const sponsor = mockSponsors.find((s) => s.id === user?.sponsorId);

  // Get workshops created by this sponsor
  const sponsorWorkshops = mockWorkshops.filter((w) => w.sponsorId === sponsor?.id);

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setIsFormOpen(true);
  };

  const handleDelete = (workshop: Workshop) => {
    if (confirm(`Delete workshop "${workshop.title}"?`)) {
      console.log("Delete:", workshop.id);
    }
  };

  const handleSubmit = (data: WorkshopFormData) => {
    console.log("Workshop form submitted:", data);
    setEditingWorkshop(undefined);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingWorkshop(undefined);
  };

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  const publishedCount = sponsorWorkshops.filter((w) => w.status === "published").length;
  const draftCount = sponsorWorkshops.filter((w) => w.status === "draft").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Workshops</h1>
          <p className="mt-2 text-muted-foreground">
            Manage learning content for {sponsor.name}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Workshop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorWorkshops.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workshops Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorWorkshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {workshop.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{workshop.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[workshop.status]}>
                      {workshop.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {workshop.videoUrl && (
                        <Badge variant="secondary" className="gap-1">
                          <Play className="h-3 w-3" />
                          Video
                        </Badge>
                      )}
                      {workshop.articleUrl && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Article
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{workshop.duration || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(workshop)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(workshop)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sponsorWorkshops.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No workshops yet. Create a workshop to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Workshop Form */}
      <WorkshopForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        workshop={editingWorkshop}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/(dashboard)/sponsor/workshops/page.tsx
git commit -m "feat: add sponsor workshops management page"
```

---

### Task 6.3: Create Sponsor Dashboard

**Files:**
- Create: `src/app/(dashboard)/sponsor/dashboard/page.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/app/(dashboard)/sponsor/dashboard`

**Step 2: Create page.tsx**

```typescript
"use client";

import { mockWorkshops, mockTracks, mockSponsors, mockReviews } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, Trophy, Star, ArrowRight } from "lucide-react";

export default function SponsorDashboardPage() {
  const { user } = useAuth();

  // Get sponsor's organization
  const sponsor = mockSponsors.find((s) => s.id === user?.sponsorId);

  if (!sponsor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          You are not associated with a sponsor organization.
        </p>
      </div>
    );
  }

  // Get sponsor's data
  const sponsorWorkshops = mockWorkshops.filter((w) => w.sponsorId === sponsor.id);
  const sponsorTracks = mockTracks.filter((t) => t.sponsorId === sponsor.id);
  const pendingReviews = mockReviews.filter(
    (r) => r.judgeId === user?.id && r.status === "pending"
  );

  const publishedWorkshops = sponsorWorkshops.filter((w) => w.status === "published").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {sponsor.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your workshops, tracks, and reviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Workshops</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorWorkshops.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedWorkshops} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tracks</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorTracks.length}</div>
            <p className="text-xs text-muted-foreground">bounty tracks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="text-xs text-muted-foreground">submissions to review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="text-lg px-3 py-1 capitalize">{sponsor.tier}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Workshops</CardTitle>
            <CardDescription>Create learning content for participants</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sponsor/workshops">
                Manage Workshops
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bounty Tracks</CardTitle>
            <CardDescription>Set up tracks for your sponsored bounties</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sponsor/tracks">
                Manage Tracks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Judge submissions assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant={pendingReviews.length > 0 ? "default" : "outline"} className="w-full">
              <Link href="/sponsor/reviews">
                {pendingReviews.length > 0 ? `Review ${pendingReviews.length} Submissions` : "View Reviews"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workshops</CardTitle>
        </CardHeader>
        <CardContent>
          {sponsorWorkshops.length > 0 ? (
            <div className="space-y-4">
              {sponsorWorkshops.slice(0, 3).map((workshop) => (
                <div key={workshop.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{workshop.title}</p>
                    <p className="text-sm text-muted-foreground">{workshop.category}</p>
                  </div>
                  <Badge
                    className={
                      workshop.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }
                  >
                    {workshop.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No workshops yet. Create your first workshop!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/(dashboard)/sponsor/dashboard/page.tsx
git commit -m "feat: add sponsor dashboard page"
```

---

### Task 6.4: Create Sponsor Reviews Page

**Files:**
- Create: `src/app/(dashboard)/sponsor/reviews/page.tsx`

**Step 1: Create directory**

Run: `mkdir -p /Users/timtimtim/Workspace/buildathon/src/app/(dashboard)/sponsor/reviews`

**Step 2: Create page.tsx**

```typescript
"use client";

import { mockReviews, mockSubmissions } from "@/data/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Eye } from "lucide-react";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function SponsorReviewsPage() {
  const { user } = useAuth();

  // Get reviews assigned to this user
  const userReviews = mockReviews.filter((r) => r.judgeId === user?.id);

  const pendingCount = userReviews.filter((r) => r.status === "pending").length;
  const completedCount = userReviews.filter((r) => r.status === "completed").length;

  const getSubmission = (submissionId: string) => {
    return mockSubmissions.find((s) => s.id === submissionId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="mt-2 text-muted-foreground">
          Judge submissions assigned to you
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userReviews.map((review) => {
                const submission = getSubmission(review.submissionId);
                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission?.title || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission?.tagline}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{submission?.team?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[review.status]}>
                        {review.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {review.overallScore ? (
                        <span className="font-medium">{review.overallScore}/10</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/reviews/${review.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {userReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No reviews assigned yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/(dashboard)/sponsor/reviews/page.tsx
git commit -m "feat: add sponsor reviews page"
```

---

### Task 6.5: Final Build Verification

**Step 1: Run full build**

Run: `cd /Users/timtimtim/Workspace/buildathon && npm run build`
Expected: Build succeeds with no errors

**Step 2: Final commit with all changes**

```bash
git status
git add -A
git commit -m "feat: complete admin forms implementation - Phase 1-6"
```

---

## Summary

This plan implements:

1. **Phase 1:** Types and mock data for Sponsor, MediaAsset, WorkshopVersion, and updated User/Workshop/Track
2. **Phase 2:** Sidebar navigation updates for sponsor role
3. **Phase 3:** Cohort management with multi-step form
4. **Phase 4:** Sponsor organization management with invite flow
5. **Phase 5:** Track management for sponsors
6. **Phase 6:** Workshop forms and sponsor portal pages

**Not included in this plan (future phases):**
- Tiptap rich text editor integration
- Media library with file uploads
- Workshop version history and diff viewer
- Cohort detail page with tabs
