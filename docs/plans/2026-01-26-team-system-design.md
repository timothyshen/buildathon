# Team System Design

## Goal

Enable participants to form teams (up to 5 members) for buildathon submissions with invite-only membership.

## Core Concept

- Teams are cohort-scoped (one team per buildathon)
- Maximum 5 members per team
- Invite-only: team lead creates team, invites members via email
- Two roles: "lead" (creator, can manage) and "member"
- User can only be on one team per cohort

## Data Model

**Existing Types (no changes needed):**

```ts
interface Team {
  id: string;
  cohortId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  members: TeamMember[];
}

interface TeamMember {
  userId: string;
  user: User;
  role: "lead" | "member";
  joinedAt: Date;
}
```

**New Type - Team Invitation:**

```ts
interface TeamInvite {
  id: string;
  teamId: string;
  team: Team;
  email: string;           // Invitee's email
  invitedBy: string;       // Lead's userId
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  expiresAt: Date;         // 7 days from creation
}
```

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/teams` | Dashboard showing user's teams + pending invites |
| `/teams/new` | Create team form (cohort dropdown, name, description) |
| `/teams/[id]` | Team detail: view members, invite new, leave/delete |

## File Structure

```
src/app/(dashboard)/teams/
  page.tsx                    # Teams list + invites banner
  new/page.tsx                # Create team form
  [id]/page.tsx               # Team detail & management

src/components/teams/
  team-card.tsx               # Card showing team name, cohort, member count
  team-member-list.tsx        # List of members with roles, remove button
  invite-form.tsx             # Email input + send invite button
  pending-invites.tsx         # List of invites with accept/decline
```

## User Flows

### Create Team

1. User clicks "Create Team" on `/teams`
2. Selects cohort (only active cohorts where they don't have a team)
3. Enters team name, optional description
4. Becomes team lead automatically
5. Redirected to team detail page to invite members

### Invite Members

1. Lead enters email on team page
2. Invite created (pending)
3. Invitee sees banner on `/teams` with pending invites
4. Accept → added as member
5. Decline → invite removed

### Submit as Team

1. User goes to `/submit`
2. First selects team (only teams for active cohorts where they're a member)
3. Proceeds through wizard as before
4. Submission linked to selected team

## Rules & Constraints

- Only team lead can invite/remove members
- Can't invite someone already on the team
- Can't invite if team has 5 members
- Can't invite to a cohort that's ended
- Pending invites count toward 5-member limit
- User can only be on one team per cohort

## Permissions Matrix

| Action | Lead | Member |
|--------|------|--------|
| Invite members | ✓ | ✗ |
| Remove members | ✓ | ✗ |
| Edit team info | ✓ | ✗ |
| Leave team | ✓ | ✓ |
| Delete team | ✓ | ✗ |
| Submit project | ✓ | ✓ |

## Edge Cases

- **User joins second team in same cohort** → Blocked with error message
- **Invite sent to non-existent user** → Invite created, visible when they sign up
- **Team lead leaves** → Oldest member becomes lead; if solo, team deleted
- **Cohort ends** → Team becomes read-only, no new invites allowed

## Sidebar Navigation

Add "Teams" link under "Builder" section for participants:

```
Builder
  My Submissions
  New Submission
  My Teams        ← NEW
```

## Integration Points

1. **Submission wizard** - Add team selection before project details
2. **Auth context** - Track user's teams and pending invites
3. **Sidebar** - Add Teams navigation link
