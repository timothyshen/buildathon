# V2 Plan: Ideation Board + Modular Foundation

## Overview

V2 focuses on two things:

1. **Ideation Board** (build now) — An always-on space where any authenticated user can propose ideas, gather interest from builders, and convert ideas into cohort submissions
2. **Modular Foundation** (documented for later) — Architectural vision for white-labeling, feature flags, plugin ecosystem, and multi-tenant support

Phase 1 ships the ideation board as a full feature. The modularity vision is captured here for future reference.

---

## Ideation Board

### Concept

A persistent, always-on board at `/ideas` — independent of cohorts. Users post ideas, others upvote and comment, interested builders signal intent with their role, and when a team forms, the idea converts into a submission for an active cohort.

The pipeline: **Idea -> Interest -> Team -> Submission -> Project**

### Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/ideas` | Public (view), Auth (vote/comment) | Browse, search, and filter ideas |
| `/ideas/new` | Authenticated | Post a new idea |
| `/ideas/[id]` | Public (view), Auth (interact) | Idea detail with comments, votes, interest |

### Data Model

#### `ideas` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | Required |
| description | text | Rich text (TipTap) |
| tags | text[] | Predefined + custom tags |
| author_id | uuid | FK -> users |
| status | enum | `open`, `seeking_team`, `in_progress`, `built`, `archived` |
| cohort_id | uuid? | Optional link to a cohort |
| submission_id | uuid? | Set when converted to submission |
| vote_count | int | Denormalized count (default 0) |
| comment_count | int | Denormalized count (default 0) |
| interest_count | int | Denormalized count (default 0) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `idea_votes` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| idea_id | uuid | FK -> ideas |
| user_id | uuid | FK -> users |
| created_at | timestamptz | |

Unique constraint on `(idea_id, user_id)` — one vote per user per idea.

#### `idea_comments` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| idea_id | uuid | FK -> ideas |
| author_id | uuid | FK -> users |
| parent_id | uuid? | FK -> idea_comments (threaded replies) |
| body | text | Comment content |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `idea_interests` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| idea_id | uuid | FK -> ideas |
| user_id | uuid | FK -> users |
| role | enum | `builder`, `designer`, `business`, `other` |
| message | text? | Optional pitch from the interested user |
| created_at | timestamptz | |

Unique constraint on `(idea_id, user_id)` — one interest per user per idea.

### TypeScript Types

```typescript
type IdeaStatus = "open" | "seeking_team" | "in_progress" | "built" | "archived";

interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorId: string;
  author?: User;
  status: IdeaStatus;
  cohortId?: string;
  submissionId?: string;
  voteCount: number;
  commentCount: number;
  interestCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IdeaVote {
  id: string;
  ideaId: string;
  userId: string;
  createdAt: Date;
}

interface IdeaComment {
  id: string;
  ideaId: string;
  authorId: string;
  author?: User;
  parentId?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

type IdeaInterestRole = "builder" | "designer" | "business" | "other";

interface IdeaInterest {
  id: string;
  ideaId: string;
  userId: string;
  user?: User;
  role: IdeaInterestRole;
  message?: string;
  createdAt: Date;
}
```

### Service (`src/services/ideas.service.ts`)

```typescript
interface IdeasService {
  // CRUD
  list(options?: {
    page?: number;
    pageSize?: number;
    sort?: "trending" | "newest" | "seeking_team";
    tags?: string[];
    status?: IdeaStatus;
    authorId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Idea>>;
  getById(id: string): Promise<ServiceResponse<Idea | null>>;
  create(data: { title: string; description: string; tags: string[]; cohortId?: string }): Promise<ServiceResponse<Idea>>;
  update(id: string, data: Partial<Pick<Idea, "title" | "description" | "tags" | "status" | "cohortId">>): Promise<ServiceResponse<Idea>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Voting
  vote(ideaId: string): Promise<ServiceResponse<void>>;
  unvote(ideaId: string): Promise<ServiceResponse<void>>;
  hasVoted(ideaId: string, userId: string): Promise<ServiceResponse<boolean>>;

  // Interest
  addInterest(ideaId: string, data: { role: IdeaInterestRole; message?: string }): Promise<ServiceResponse<IdeaInterest>>;
  removeInterest(ideaId: string): Promise<ServiceResponse<void>>;
  getInterests(ideaId: string): Promise<ServiceResponse<IdeaInterest[]>>;

  // Comments
  getComments(ideaId: string): Promise<ServiceResponse<IdeaComment[]>>;
  addComment(ideaId: string, data: { body: string; parentId?: string }): Promise<ServiceResponse<IdeaComment>>;
  deleteComment(id: string): Promise<ServiceResponse<void>>;

  // Conversion
  convertToSubmission(ideaId: string, cohortId: string): Promise<ServiceResponse<{ submissionId: string }>>;
}
```

### Pages & Components

#### Browse Page (`/ideas`)

- **Header:** Title ("Ideas"), search input, "Post Idea" CTA button
- **Filter tabs:** All | Trending | Newest | Seeking Team
- **Tag chips:** Horizontal scrollable row (DeFi, AI, Gaming, Social, Infra, etc.)
- **Card grid:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
  - Each card: title, 2-line description preview, author avatar + name, vote count (arrow icon), comment count, interest count, tags, status dot
- **Pagination:** Reuse existing `TablePagination` or infinite scroll
- **Bento style:** Cards use `rounded-xl border hover:border-foreground transition-colors`

#### New Idea Page (`/ideas/new`)

- **Form fields:**
  - Title — text input, required
  - Description — TipTap rich text editor (`immediatelyRender: false` for SSR)
  - Tags — multi-select from predefined list + custom input
  - Link to cohort — optional dropdown of active cohorts
- **Submit button:** `bg-foreground text-background hover:bg-foreground/90`
- **Validation:** Zod schema, title required (min 5 chars), description required (min 20 chars)

#### Detail Page (`/ideas/[id]`)

- **Hero section:** Title, author (avatar + name + date), status dot, tags
- **Description:** Rich text rendered content
- **Action bar:**
  - Vote button (arrow + count, toggle, fills on active)
  - "I'm interested" button → opens sheet/dialog with role select + optional message
  - If author: "Edit" button, status dropdown, "Convert to Submission" button
- **Interested users section:** Grid of user cards (avatar, name, role badge, message preview)
- **Comments section:** Threaded comments (reuse pattern from feedback board)
  - Comment input at top
  - Nested replies with indent

### Integration Points

**Navigation:**
- Public nav: Add "Ideas" link (between Explore and Workshops)
- Dashboard sidebar: Add "Ideas" under a "Community" group

**Notifications** (2 new types):
- `idea_comment` — "Someone commented on your idea: {title}"
- `idea_interest` — "{userName} wants to build your idea: {title}"

**Convert to Submission:**
1. Author clicks "Convert to Submission"
2. Picks an active cohort from dropdown
3. System creates a draft submission pre-filled with idea's title, description, tags
4. Interested users who accepted become the team (auto-creates team if needed)
5. Idea status → `in_progress`, idea.submissionId set
6. Redirects to submission edit page to complete remaining fields

**Explore page tie-in:**
Projects on `/explore` that originated from an idea show a small "idea" chip linking back to `/ideas/[id]`.

### Status Dots (Bento)

```
open:          bg-blue-500
seeking_team:  bg-amber-500
in_progress:   bg-violet-500
built:         bg-emerald-500
archived:      bg-muted-foreground
```

---

## Modular Foundation (Future — Not Built in Phase 1)

This section documents the architectural vision for making the platform white-labelable and extensible. None of this is built in Phase 1 — it serves as a reference for future phases.

### Tenant / Organization Model

Each organization gets an isolated workspace:

- **Tenant config** — stored in a `tenants` table with: id, slug, name, domain, logo, primary color, font
- **Data isolation** — all core tables get a `tenant_id` column; RLS policies enforce isolation
- **Custom domain** — Next.js middleware reads hostname, resolves to tenant, injects config into React context
- **Branding** — CSS custom properties (`--brand-primary`, `--brand-font`, etc.) driven by tenant config, replacing hardcoded Tailwind tokens

### Feature Flags

Per-tenant configuration to enable/disable platform modules:

```typescript
interface TenantFeatures {
  ideation: boolean;        // Ideas board
  referrals: boolean;       // Referral system
  traction: boolean;        // Traction tracking
  workshops: boolean;       // Workshop/learning library
  feedback: boolean;        // Feedback board
  walletLogin: boolean;     // Web3 wallet auth
  ipRegistration: boolean;  // Story Protocol IP registration
  notifications: {
    push: boolean;          // Web Push
    email: boolean;         // Email notifications (future)
    inApp: boolean;         // In-app notifications
  };
}
```

Stored in `tenant_config` table, loaded at app init, exposed via React context. Components conditionally render based on flags. Navigation items auto-hide for disabled features.

### Custom Fields

Schema-extensible entities:

- `custom_field_definitions` — tenant_id, entity_type (idea/submission/review), field_name, field_type (text/number/select/date/url), options (for select), required, order
- `custom_field_values` — entity_id, field_definition_id, value (JSONB)

Admin UI for defining custom fields per entity type. Forms auto-render custom fields alongside built-in fields.

### Event Bus

All platform actions emit structured events:

```typescript
interface PlatformEvent {
  type: string;           // e.g. "idea.created", "submission.status_changed"
  tenantId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}
```

Events stored in `platform_events` table for audit trail. Future: webhook subscriptions so external systems can react to events. Future: plugin handlers can subscribe to event types.

### Plugin API

Register custom extensions per tenant:

- **Custom track types** — beyond the built-in sponsor tracks
- **Custom scoring rubrics** — alternative review dimensions
- **Custom milestone types** — beyond the 10 built-in types
- **Custom notification handlers** — Slack, Discord, email integrations
- **Custom export formats** — CSV, PDF report generation

Plugin registry stored in `tenant_plugins` table. Plugins are JavaScript modules loaded at runtime. Admin UI for enabling/configuring plugins per tenant.

### Theming Engine

CSS custom properties driven by tenant config:

```css
:root {
  --brand-primary: var(--tenant-primary, hsl(0 0% 9%));
  --brand-accent: var(--tenant-accent, hsl(0 0% 96%));
  --brand-font: var(--tenant-font, "Inter");
  --brand-radius: var(--tenant-radius, 0.75rem);
}
```

Tenant config injected via `<style>` tag in root layout. All components reference brand tokens instead of hardcoded values. Logo, favicon, and OG images served from tenant storage bucket.

---

## Implementation Sequence (Phase 1 Only)

1. **Database migration** — Create `ideas`, `idea_votes`, `idea_comments`, `idea_interests` tables
2. **Types & service** — Add types to `src/types/index.ts`, create `src/services/ideas.service.ts`
3. **Browse page** — `/ideas` with card grid, filters, search, pagination
4. **New idea page** — `/ideas/new` with form, validation, rich text
5. **Detail page** — `/ideas/[id]` with voting, comments, interest
6. **Notifications** — Add `idea_comment` and `idea_interest` notification types
7. **Navigation** — Add "Ideas" to public nav and dashboard sidebar
8. **Convert to submission** — Wire up idea-to-submission flow
9. **Explore integration** — Show "idea" origin chip on converted projects
