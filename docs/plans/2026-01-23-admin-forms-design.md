# Admin Forms Design: Cohort, Sponsor & Workshop Management

## Overview

Build admin forms for managing cohorts, sponsors, and workshop content with role-based access for admins and sponsors.

## Roles & Permissions

### User Roles

```typescript
type UserRole = "admin" | "sponsor" | "judge" | "participant"
```

### Permission Matrix

| Action | Admin | Sponsor | Judge | Participant |
|--------|-------|---------|-------|-------------|
| Manage all cohorts | ✓ | | | |
| Manage all sponsors | ✓ | | | |
| Manage all workshops | ✓ | | | |
| Manage all tracks | ✓ | | | |
| Manage judges | ✓ | | | |
| View all submissions | ✓ | | | |
| Manage own workshops | ✓ | ✓ | | |
| Manage own bounty tracks | ✓ | ✓ | | |
| Judge submissions | ✓ | ✓ | ✓ | |
| View assigned submissions | ✓ | ✓ | ✓ | |
| Submit projects | | | | ✓ |

## Data Models

### Sponsor (New)

```typescript
type Sponsor = {
  id: string
  cohortId: string
  name: string
  logo: string              // URL from media library
  website: string
  description: string
  tier: "platinum" | "gold" | "silver" | "bronze" | "community"
  prizePoolContribution: number
  hasDedicatedTrack: boolean
  contactName: string
  contactEmail: string
  createdAt: string
  updatedAt: string
}
```

### User (Updated)

```typescript
type User = {
  id: string
  email: string
  name: string
  role: "admin" | "sponsor" | "judge" | "participant"
  sponsorId?: string        // If role is "sponsor", links to their org
  // ... existing fields
}
```

### Workshop (Enhanced)

```typescript
type Workshop = {
  id: string
  title: string
  description: string       // Short summary
  content: string           // Tiptap JSON content
  category: string
  duration: number
  status: "draft" | "published" | "archived"
  sponsorId?: string        // If created by sponsor
  createdBy: string         // User ID
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### WorkshopVersion (New)

```typescript
type WorkshopVersion = {
  id: string
  workshopId: string
  content: string           // Tiptap JSON snapshot
  title: string
  authorId: string          // Who made this edit
  createdAt: string         // When this version was saved
  changeNote: string        // Optional commit message
}
```

### MediaAsset (New)

```typescript
type MediaAsset = {
  id: string
  filename: string
  url: string               // Supabase Storage URL
  mimeType: string
  size: number              // bytes
  uploadedBy: string        // User ID
  createdAt: string
}
```

### Track (Updated)

```typescript
type Track = {
  id: string
  cohortId: string
  sponsorId?: string        // Links to Sponsor for ownership
  name: string
  description: string
  prizePool: number
  requirements: string[]
  // ... existing fields
}
```

## Navigation by Role

### Admin Sidebar

- Dashboard
- Cohorts (manage all)
- All Submissions
- Judges
- Sponsors (manage all sponsor orgs)
- Workshop (manage all)
- Media Library
- Settings

### Sponsor Sidebar

- Dashboard (their stats)
- My Workshops (create/edit their own)
- My Tracks (manage their bounty tracks)
- Review Queue (judge assigned submissions)
- Media Library (their uploads)
- Settings

### Judge Sidebar

- Dashboard
- Review Queue (assigned only)
- Settings

### Participant Sidebar

- Dashboard
- My Submissions
- New Submission
- Settings

## Pages Structure

### Admin Pages

```
/admin/cohorts              # List all cohorts
/admin/cohorts/new          # Create cohort (or dialog)
/admin/cohorts/[id]         # Cohort detail with tabs (overview, sponsors, tracks)

/admin/sponsors             # List all sponsor organizations
/admin/sponsors/[id]        # Sponsor org detail, invite users

/admin/workshop             # List all workshops
/admin/workshop/[id]        # Workshop editor (Tiptap)

/admin/media                # Media library
```

### Sponsor Pages

```
/sponsor/dashboard          # Sponsor overview stats
/sponsor/workshops          # Their workshops list
/sponsor/workshops/new      # Create workshop
/sponsor/workshops/[id]     # Workshop editor (Tiptap)
/sponsor/tracks             # Their bounty tracks
/sponsor/tracks/new         # Create track
/sponsor/tracks/[id]        # Track detail/edit
/sponsor/reviews            # Judge submissions assigned to them
```

## Component Structure

```
/src/components/admin/
  /cohorts/
    cohort-form.tsx          # Multi-step add/edit dialog
    cohort-table.tsx         # List view table
    cohort-detail.tsx        # Detail page with tabs
  /sponsors/
    sponsor-org-form.tsx     # Create/edit sponsor organization
    sponsor-org-table.tsx    # List all sponsor orgs
    invite-sponsor-form.tsx  # Invite user to sponsor org
  /workshop/
    workshop-table.tsx       # Admin: all workshops list
  /media/
    media-library.tsx        # Full page grid
    upload-zone.tsx          # Drag & drop

/src/components/sponsor/
  /dashboard/
    sponsor-dashboard.tsx    # Stats overview
  /workshops/
    workshop-table.tsx       # Their workshops only
  /tracks/
    track-form.tsx           # Create/edit bounty track
    track-table.tsx          # Their tracks list

/src/components/shared/
  /editor/
    tiptap-editor.tsx        # Configured Tiptap (reused by admin & sponsor)
    version-history.tsx      # Version list + diff viewer
  /media/
    media-picker.tsx         # Shared media picker modal
```

## Form Specifications

### Cohort Form (Multi-step Dialog)

**Step 1: Basic Info**
- Name (text, required)
- Slug (text, auto-generated from name, editable)
- Tagline (text)
- Description (textarea)
- Banner Image (media picker)

**Step 2: Dates**
- Start Date (date picker)
- End Date (date picker)
- Submission Deadline (datetime picker)
- Judging Start (datetime picker)
- Judging End (datetime picker)

**Step 3: Settings**
- Status (select: draft/upcoming/active/judging/completed)
- Is Public (checkbox)
- Max Team Size (number)

**Step 4: Prizes**
- Dynamic list with Add/Remove
- Each: Place (1st, 2nd, etc.), Amount ($), Description

### Sponsor Org Form (Dialog)

- Name (text, required)
- Logo (media picker)
- Website (URL)
- Description (textarea)
- Tier (select: platinum/gold/silver/bronze/community)
- Prize Pool Contribution (number)
- Has Dedicated Track (checkbox)
- Contact Name (text)
- Contact Email (email)

### Invite Sponsor Form (Dialog)

- Email (required)
- Name (required)
- Sponsor Org (select from existing orgs)
- Sends invite email automatically

### Track Form (Sponsor manages)

- Name (text, required)
- Description (textarea)
- Prize Pool (number)
- Requirements (dynamic list of text inputs)
- Cohort (select - admin can assign any, sponsor sees cohorts they're part of)

### Workshop Editor

- Title (text input at top)
- Tiptap editor (main content area)
- Sidebar: category, duration, status toggle, publish button
- Version history panel (expandable)

## Dependencies

### New Packages

```
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-image
@tiptap/extension-link
@tiptap/extension-youtube
@tiptap/extension-placeholder
@tiptap/extension-typography
diff                        # For version diff comparison
```

### Tiptap Extensions

- StarterKit (basic formatting)
- Image (with media library integration)
- Link
- YouTube (video embeds)
- Placeholder
- Typography

## File Storage

- Supabase Storage bucket: `media`
- Path pattern: `/{userId}/{timestamp}-{filename}`

## Sponsor Onboarding Flow

1. Admin creates Sponsor org in `/admin/sponsors`
2. Admin invites sponsor user via email (creates user with role="sponsor", linked sponsorId)
3. Sponsor receives invite email, sets password
4. Sponsor logs in, sees their dashboard

## Implementation Scope

- **Pages:** ~12 new pages/routes
- **Components:** ~20 new components
- **Forms:** 5 main forms (cohort, sponsor org, invite sponsor, track, workshop editor)

## Validation (Zod Schemas)

- `cohortSchema` - validates all cohort fields, dates must be in order
- `sponsorSchema` - validates sponsor fields, email format, URL format
- `workshopSchema` - validates title required, content required for publish
- `trackSchema` - validates name required, prize pool >= 0
