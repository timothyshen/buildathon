# Team System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a team management system where participants can create teams (up to 5 members), invite members via email, and manage team membership for buildathon submissions.

**Architecture:** Add TeamInvite type to data model, create team management pages under `/teams`, add team components for cards/lists/forms, update sidebar navigation, and integrate team selection into submission wizard.

**Tech Stack:** Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS, localStorage (mock persistence)

---

## Task 1: Add TeamInvite Type

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add the TeamInvite interface after TeamMember**

Add this after line 68 (after TeamMember interface):

```ts
export interface TeamInvite {
  id: string;
  teamId: string;
  team?: Team;
  email: string;
  invitedBy: string;
  inviter?: User;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  expiresAt: Date;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(teams): add TeamInvite type"
```

---

## Task 2: Add Mock Team Invites Data

**Files:**
- Modify: `src/data/mock-data.ts`

**Step 1: Add mockTeamInvites after mockTeams**

Add after the mockTeams array (around line 167):

```ts
// Mock Team Invites
export const mockTeamInvites: TeamInvite[] = [
  {
    id: "invite-1",
    teamId: "team-1",
    team: mockTeams[0],
    email: "newuser@example.com",
    invitedBy: "user-3",
    inviter: mockUsers[2],
    status: "pending",
    createdAt: new Date("2024-06-15"),
    expiresAt: new Date("2024-06-22"),
  },
];
```

**Step 2: Update the import at the top of the file**

Add `TeamInvite` to the import from `@/types`:

```ts
import type { User, Cohort, Track, Team, TeamInvite, Submission, Review, Workshop, Template, SponsorOrg, CohortSponsor, Sponsor, MediaAsset, WorkshopVersion, WorkshopRSVP } from "@/types";
```

**Step 3: Add helper functions at the end of the file**

```ts
// Team helper functions
export function getUserTeams(userId: string): Team[] {
  return mockTeams.filter((t) => t.members.some((m) => m.userId === userId));
}

export function getUserTeamForCohort(userId: string, cohortId: string): Team | undefined {
  return mockTeams.find(
    (t) => t.cohortId === cohortId && t.members.some((m) => m.userId === userId)
  );
}

export function getPendingInvitesForUser(email: string): TeamInvite[] {
  return mockTeamInvites.filter((i) => i.email === email && i.status === "pending");
}

export function getTeamInvites(teamId: string): TeamInvite[] {
  return mockTeamInvites.filter((i) => i.teamId === teamId);
}

export function isTeamLead(userId: string, teamId: string): boolean {
  const team = mockTeams.find((t) => t.id === teamId);
  return team?.members.some((m) => m.userId === userId && m.role === "lead") ?? false;
}
```

**Step 4: Commit**

```bash
git add src/data/mock-data.ts
git commit -m "feat(teams): add mock team invites and helper functions"
```

---

## Task 3: Create Team Card Component

**Files:**
- Create: `src/components/teams/team-card.tsx`

**Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, ChevronRight } from "lucide-react";
import { Team, Cohort } from "@/types";
import { mockCohorts } from "@/data/mock-data";

interface TeamCardProps {
  team: Team;
  currentUserId: string;
}

export function TeamCard({ team, currentUserId }: TeamCardProps) {
  const cohort = mockCohorts.find((c) => c.id === team.cohortId);
  const isLead = team.members.some(
    (m) => m.userId === currentUserId && m.role === "lead"
  );
  const memberCount = team.members.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              {isLead && (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Lead
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              {cohort?.name || "Unknown Cohort"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teams/${team.id}`}>
              View
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {team.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {team.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{memberCount}/5 members</span>
            </div>
            {cohort && (
              <Badge
                variant={cohort.status === "active" ? "default" : "secondary"}
                className="text-xs"
              >
                {cohort.status}
              </Badge>
            )}
          </div>
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((member) => (
              <img
                key={member.userId}
                src={
                  member.user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`
                }
                alt={member.user.name}
                title={member.user.name}
                className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/teams/team-card.tsx
git commit -m "feat(teams): add team card component"
```

---

## Task 4: Create Pending Invites Component

**Files:**
- Create: `src/components/teams/pending-invites.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Users } from "lucide-react";
import { TeamInvite } from "@/types";
import { toast } from "sonner";

interface PendingInvitesProps {
  invites: TeamInvite[];
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
}

export function PendingInvites({ invites, onAccept, onDecline }: PendingInvitesProps) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <Card className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-violet-600" />
          <CardTitle className="text-lg">Team Invitations</CardTitle>
        </div>
        <CardDescription>
          You have {invites.length} pending team invitation{invites.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-white p-3 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium">{invite.team?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Invited by {invite.inviter?.name || "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(invite.id)}
              >
                <Check className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(invite.id)}
              >
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/teams/pending-invites.tsx
git commit -m "feat(teams): add pending invites component"
```

---

## Task 5: Create Team Member List Component

**Files:**
- Create: `src/components/teams/team-member-list.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X } from "lucide-react";
import { TeamMember } from "@/types";

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId: string;
  isLead: boolean;
  onRemove?: (userId: string) => void;
}

export function TeamMemberList({
  members,
  currentUserId,
  isLead,
  onRemove,
}: TeamMemberListProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const canRemove = isLead && !isSelf && member.role !== "lead";

        return (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  member.user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`
                }
                alt={member.user.name}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {member.user.name}
                    {isSelf && (
                      <span className="ml-1 text-muted-foreground">(you)</span>
                    )}
                  </p>
                  {member.role === "lead" && (
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="h-3 w-3" />
                      Lead
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>
            {canRemove && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(member.userId)}
                className="text-destructive hover:text-destructive"
                aria-label={`Remove ${member.user.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/teams/team-member-list.tsx
git commit -m "feat(teams): add team member list component"
```

---

## Task 6: Create Invite Form Component

**Files:**
- Create: `src/components/teams/invite-form.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InviteFormProps {
  teamId: string;
  currentMemberCount: number;
  existingEmails: string[];
  onInvite: (email: string) => Promise<void>;
}

export function InviteForm({
  teamId,
  currentMemberCount,
  existingEmails,
  onInvite,
}: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canInvite = currentMemberCount < 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (existingEmails.includes(trimmedEmail)) {
      toast.error("This person is already on the team or has a pending invite");
      return;
    }

    if (!canInvite) {
      toast.error("Team is full (maximum 5 members)");
      return;
    }

    setIsLoading(true);
    try {
      await onInvite(trimmedEmail);
      setEmail("");
      toast.success("Invitation sent!");
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Invite by Email</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !canInvite}
          />
          <Button type="submit" disabled={isLoading || !canInvite}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Invite
              </>
            )}
          </Button>
        </div>
        {!canInvite && (
          <p className="text-sm text-amber-600">
            Team is full. Remove a member to invite someone new.
          </p>
        )}
      </div>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/teams/invite-form.tsx
git commit -m "feat(teams): add invite form component"
```

---

## Task 7: Create Components Index

**Files:**
- Create: `src/components/teams/index.ts`

**Step 1: Create barrel export**

```ts
export { TeamCard } from "./team-card";
export { PendingInvites } from "./pending-invites";
export { TeamMemberList } from "./team-member-list";
export { InviteForm } from "./invite-form";
```

**Step 2: Commit**

```bash
git add src/components/teams/index.ts
git commit -m "feat(teams): add component barrel export"
```

---

## Task 8: Create Teams List Page

**Files:**
- Create: `src/app/(dashboard)/teams/page.tsx`

**Step 1: Create the page**

```tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserTeams, getPendingInvitesForUser, mockTeamInvites, mockTeams } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";
import { TeamCard, PendingInvites } from "@/components/teams";
import { toast } from "sonner";
import { useState } from "react";

export default function TeamsPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return null;

  const userTeams = getUserTeams(user.id);
  const pendingInvites = getPendingInvitesForUser(user.email);

  const handleAcceptInvite = (inviteId: string) => {
    // Mock: Find the invite and update it
    const invite = mockTeamInvites.find((i) => i.id === inviteId);
    if (invite) {
      invite.status = "accepted";
      // Add user to team
      const team = mockTeams.find((t) => t.id === invite.teamId);
      if (team) {
        team.members.push({
          userId: user.id,
          user: user,
          role: "member",
          joinedAt: new Date(),
        });
      }
    }
    toast.success("You have joined the team!");
    setRefreshKey((k) => k + 1);
  };

  const handleDeclineInvite = (inviteId: string) => {
    const invite = mockTeamInvites.find((i) => i.id === inviteId);
    if (invite) {
      invite.status = "declined";
    }
    toast.success("Invitation declined");
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-8" key={refreshKey}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your buildathon teams and invitations
          </p>
        </div>
        <Button asChild>
          <Link href="/teams/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      <PendingInvites
        invites={pendingInvites}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      {userTeams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a team to start collaborating on buildathon projects.
            </p>
            <Button asChild className="mt-4">
              <Link href="/teams/new">Create Team</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {userTeams.map((team) => (
            <TeamCard key={team.id} team={team} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/teams/page.tsx
git commit -m "feat(teams): add teams list page"
```

---

## Task 9: Create New Team Page

**Files:**
- Create: `src/app/(dashboard)/teams/new/page.tsx`

**Step 1: Create the page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { mockCohorts, mockTeams, getUserTeamForCohort } from "@/data/mock-data";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewTeamPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [cohortId, setCohortId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  // Only show cohorts where user doesn't already have a team
  const availableCohorts = mockCohorts.filter((c) => {
    const isActiveOrUpcoming = c.status === "active" || c.status === "upcoming";
    const hasNoTeam = !getUserTeamForCohort(user.id, c.id);
    return isActiveOrUpcoming && c.isPublic && hasNoTeam;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!cohortId) newErrors.cohortId = "Please select a cohort";
    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "Team name must be at least 3 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Mock: Create new team
      const newTeam = {
        id: `team-${Date.now()}`,
        cohortId,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description.trim() || undefined,
        members: [
          {
            userId: user.id,
            user: user,
            role: "lead" as const,
            joinedAt: new Date(),
          },
        ],
      };

      mockTeams.push(newTeam);

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Team created successfully!");
      router.push(`/teams/${newTeam.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams" aria-label="Back to teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Team</h1>
          <p className="mt-1 text-muted-foreground">
            Start a new team for a buildathon
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>
            You'll be the team lead and can invite up to 4 more members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cohort">Cohort *</Label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a buildathon" />
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
                <p className="text-sm text-destructive">{errors.cohortId}</p>
              )}
              {availableCohorts.length === 0 && (
                <p className="text-sm text-amber-600">
                  You already have a team in all active buildathons.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g., IP Innovators"
                maxLength={50}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is your team building?"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/200 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/teams">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isLoading || availableCohorts.length === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Team"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/teams/new/page.tsx
git commit -m "feat(teams): add create team page"
```

---

## Task 10: Create Team Detail Page

**Files:**
- Create: `src/app/(dashboard)/teams/[id]/page.tsx`

**Step 1: Create the page**

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  mockTeams,
  mockCohorts,
  mockTeamInvites,
  getTeamInvites,
  isTeamLead,
} from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Trophy, LogOut, Trash2, Clock } from "lucide-react";
import { TeamMemberList, InviteForm } from "@/components/teams";
import { toast } from "sonner";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const teamId = params.id as string;
  const team = mockTeams.find((t) => t.id === teamId);

  if (!user || !team) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Team not found</h2>
        <Button asChild className="mt-4">
          <Link href="/teams">Back to Teams</Link>
        </Button>
      </div>
    );
  }

  const cohort = mockCohorts.find((c) => c.id === team.cohortId);
  const isLead = isTeamLead(user.id, teamId);
  const isMember = team.members.some((m) => m.userId === user.id);
  const pendingInvites = getTeamInvites(teamId).filter(
    (i) => i.status === "pending"
  );

  const existingEmails = [
    ...team.members.map((m) => m.user.email.toLowerCase()),
    ...pendingInvites.map((i) => i.email.toLowerCase()),
  ];

  const handleInvite = async (email: string) => {
    // Mock: Create new invite
    const newInvite = {
      id: `invite-${Date.now()}`,
      teamId,
      team,
      email: email.toLowerCase(),
      invitedBy: user.id,
      inviter: user,
      status: "pending" as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    mockTeamInvites.push(newInvite);
    setRefreshKey((k) => k + 1);
  };

  const handleRemoveMember = (userId: string) => {
    const memberIndex = team.members.findIndex((m) => m.userId === userId);
    if (memberIndex > -1) {
      team.members.splice(memberIndex, 1);
      toast.success("Member removed");
      setRefreshKey((k) => k + 1);
    }
  };

  const handleLeaveTeam = () => {
    const memberIndex = team.members.findIndex((m) => m.userId === user.id);
    if (memberIndex > -1) {
      if (isLead && team.members.length > 1) {
        // Transfer lead to next member
        const nextMember = team.members.find((m) => m.userId !== user.id);
        if (nextMember) nextMember.role = "lead";
      }
      team.members.splice(memberIndex, 1);

      // Delete team if no members left
      if (team.members.length === 0) {
        const teamIndex = mockTeams.findIndex((t) => t.id === teamId);
        if (teamIndex > -1) mockTeams.splice(teamIndex, 1);
      }

      toast.success("You have left the team");
      router.push("/teams");
    }
  };

  const handleDeleteTeam = () => {
    const teamIndex = mockTeams.findIndex((t) => t.id === teamId);
    if (teamIndex > -1) {
      mockTeams.splice(teamIndex, 1);
      toast.success("Team deleted");
      router.push("/teams");
    }
  };

  if (!isMember) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">You're not a member of this team</h2>
        <Button asChild className="mt-4">
          <Link href="/teams">Back to Teams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8" key={refreshKey}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams" aria-label="Back to teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {cohort?.name || "Unknown Cohort"}
          </p>
        </div>
      </div>

      {team.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <Badge variant="secondary">
              {team.members.length}/5 members
            </Badge>
          </div>
          <CardDescription>
            {isLead
              ? "Manage your team members and send invitations"
              : "View your team members"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TeamMemberList
            members={team.members}
            currentUserId={user.id}
            isLead={isLead}
            onRemove={isLead ? handleRemoveMember : undefined}
          />

          {isLead && (
            <>
              <hr />
              <InviteForm
                teamId={teamId}
                currentMemberCount={team.members.length + pendingInvites.length}
                existingEmails={existingEmails}
                onInvite={handleInvite}
              />

              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Invitations
                  </p>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border border-dashed p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{invite.email}</span>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Leave Team
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Team?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isLead && team.members.length > 1
                    ? "As the lead, leaving will transfer leadership to another member."
                    : isLead && team.members.length === 1
                    ? "You're the only member. Leaving will delete the team."
                    : "Are you sure you want to leave this team?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveTeam}>
                  Leave Team
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isLead && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the team and remove all members.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/teams/[id]/page.tsx
git commit -m "feat(teams): add team detail page with member management"
```

---

## Task 11: Add Teams to Sidebar Navigation

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: Import Users2 icon (add to imports around line 5-20)**

Add `Users2` to the lucide-react import:

```tsx
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Trophy,
  Star,
  Users,
  Users2,
  FolderKanban,
  GraduationCap,
  LogOut,
  ChevronRight,
  Sparkles,
  Home,
  Compass,
  BookOpen,
} from "lucide-react";
```

**Step 2: Add Teams nav item to the Builder section (around line 77)**

Add after the "New Submission" item:

```tsx
{ href: "/teams", label: "My Teams", icon: Users2 },
```

The Builder section should look like:

```tsx
{
  title: "Builder",
  roles: ["participant"],
  items: [
    {
      href: "/submissions",
      label: "My Submissions",
      icon: FileText,
      badge: draftCount > 0 ? `${draftCount} draft` : undefined,
    },
    { href: "/submit", label: "New Submission", icon: PlusCircle },
    { href: "/teams", label: "My Teams", icon: Users2 },
  ],
},
```

**Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(teams): add teams link to sidebar navigation"
```

---

## Task 12: Update Submission Wizard with Team Selection

**Files:**
- Modify: `src/app/(dashboard)/submit/page.tsx`

**Step 1: Add team selection state and import**

Add to imports (around line 13):
```tsx
import { getUserTeams, mockCohorts } from "@/data/mock-data";
```

Update the SubmissionDraft interface to add teamId (around line 26):
```tsx
interface SubmissionDraft {
  teamId: string;  // Add this line
  title: string;
  // ... rest stays the same
}
```

Update initialData to add teamId (around line 40):
```tsx
const initialData: SubmissionDraft = {
  teamId: "",  // Add this line
  title: "",
  // ... rest stays the same
};
```

**Step 2: Add team selection before step 1**

In the component, get user teams:
```tsx
const { user } = useAuth();  // This should already exist
// Add after it:
const userTeams = user ? getUserTeams(user.id) : [];
```

Add team validation in validateStep (add as step 0 or modify step 1):
In the validation for step 1, add team check:
```tsx
if (step === 1) {
  if (!data.teamId) {
    newErrors.teamId = "Please select a team";
  }
  if (!data.title || data.title.trim().length < 3) {
    // existing validation
  }
  // rest of step 1 validation
}
```

**Step 3: Add team selector to StepDetails or create separate first step**

In the step 1 content (StepDetails section around line 228), add team selection before the existing form:

Modify the StepDetails rendering to include team selection:
```tsx
{currentStep === 1 && (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Select Team</CardTitle>
        <CardDescription>Choose which team is submitting this project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="team">Team *</Label>
          <Select
            value={data.teamId}
            onValueChange={(value) => handleChange("teamId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your team" />
            </SelectTrigger>
            <SelectContent>
              {userTeams
                .filter((t) => {
                  const cohort = mockCohorts.find((c) => c.id === t.cohortId);
                  return cohort?.status === "active";
                })
                .map((team) => {
                  const cohort = mockCohorts.find((c) => c.id === team.cohortId);
                  return (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({cohort?.name})
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
          {errors.teamId && (
            <p className="text-sm text-destructive">{errors.teamId}</p>
          )}
          {userTeams.filter((t) => {
            const cohort = mockCohorts.find((c) => c.id === t.cohortId);
            return cohort?.status === "active";
          }).length === 0 && (
            <p className="text-sm text-amber-600">
              You need to <Link href="/teams/new" className="underline">create a team</Link> first.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
    <StepDetails
      data={{ title: data.title, tagline: data.tagline, description: data.description }}
      onChange={handleChange}
      errors={errors}
    />
  </div>
)}
```

Add necessary imports at top:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

**Step 4: Commit**

```bash
git add src/app/(dashboard)/submit/page.tsx
git commit -m "feat(submit): add team selection to submission wizard"
```

---

## Task 13: Final Build Verification and Cleanup

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 2: Test the flow manually**

1. Log in as participant
2. Go to /teams - should see empty state or existing teams
3. Create a new team for an active cohort
4. Invite a member (email doesn't need to exist)
5. Go to /submit - should see team selection
6. Complete a submission

**Step 3: Final commit**

```bash
git add .
git commit -m "feat(teams): complete team management system"
```

---

## Verification Checklist

1. [ ] TeamInvite type exists in types/index.ts
2. [ ] Mock team invites and helper functions exist
3. [ ] Team card component renders correctly
4. [ ] Pending invites component shows/hides appropriately
5. [ ] Team member list shows lead badge and remove buttons
6. [ ] Invite form validates email and team capacity
7. [ ] Teams list page shows user's teams
8. [ ] Create team page validates input and creates team
9. [ ] Team detail page shows members and allows management
10. [ ] Sidebar shows "My Teams" link for participants
11. [ ] Submission wizard requires team selection
12. [ ] `npm run build` passes
