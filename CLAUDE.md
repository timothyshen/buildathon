# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Always use pnpm** (not npm or yarn).

```bash
pnpm dev         # Start development server at http://localhost:5567
pnpm build       # Production build (also runs TypeScript checks)
pnpm lint        # Run ESLint
pnpm start       # Start production server at http://localhost:5567
```

## Architecture

This is a **Next.js 16 App Router** buildathon/hackathon management platform using React 19, TypeScript, and Tailwind CSS 4.

### Route Groups

- `src/app/(dashboard)/` - Protected routes with sidebar layout, requires authentication
- `src/app/(auth)/` - Authentication routes (login)
- `src/app/` - Public marketing pages (home, cohorts, workshops, explore)

### Key Patterns

**Authentication**: Supabase Auth via `src/contexts/auth-context.tsx`. Session managed by Supabase with middleware for server-side redirects.

**Data Layer**: Supabase (PostgreSQL) via service layer in `src/services/`. All entities (Cohort, Submission, Track, Workshop, etc.) defined in `src/types/index.ts`.

**Role-Based Views**: Dashboard renders different components based on `user.role`:
- `admin` → AdminDashboard, access to `/admin/*` routes
- `sponsor` → SponsorDashboard, access to `/sponsor/*` routes
- `judge` → JudgeDashboard, access to `/reviews/*`
- `participant` → ParticipantDashboard, access to `/submissions/*`, `/submit`

**UI Components**: shadcn/ui pattern with Radix primitives in `src/components/ui/`. Key custom components:
- `RichTextEditor` - TipTap-based editor (use `immediatelyRender: false` for SSR)
- `Sheet` - Mobile slide-out drawer
- `AlertDialog` - Confirmation dialogs (replaces browser confirm())

### Data Model Relationships

```
SponsorOrg (persistent) ←→ CohortSponsor (junction) ←→ Cohort
                                    ↓
                                  Track (sponsor's prize track per cohort)
                                    ↓
                                Submission (can have multiple tracks)
```

Sponsors participate in multiple cohorts via `CohortSponsor` junction with tier and contribution info.

### Layout Structure

- Root: `Providers` (AuthProvider + Toaster) → `LayoutWrapper` (conditional header/footer)
- Dashboard: `Sidebar` (hidden on mobile) + `DashboardHeader` (hamburger menu with Sheet drawer + user dropdown)

## Design System — Bento Style

All dashboard pages **must** follow the Bento design language. Inspired by Linear and Vercel — minimal, clean, no visual clutter.

### Core Rules

1. **No Card/CardHeader/CardContent wrappers** — Use `<section>` with `rounded-xl border` or `rounded-2xl border` instead
2. **No Badge for status** — Use status dots: `<span className="h-2 w-2 rounded-full bg-{color}-500" />`
3. **No heavy bg-accent active states** — Use subtle `bg-muted/80` or `bg-muted/50`
4. **No hover chevrons in nav** — Keep sidebars and nav clean

### Typography

| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-semibold tracking-tight` |
| Section header | `text-[11px] uppercase tracking-widest text-muted-foreground font-medium` |
| Body text | `text-sm` |
| Small text / metadata | `text-xs text-muted-foreground` |
| Tiny labels | `text-[11px] text-muted-foreground` |
| Nav items | `text-[13px]` |

### Numbers & Stats

- Stats use `font-mono font-semibold tabular-nums` with semantic colors
- Stats strips: horizontal row separated by `divide-x`
- Bento stat tiles: `rounded-2xl border p-6` with oversized `text-4xl font-mono font-bold tabular-nums`
- Semantic colors: emerald for success/positive, amber for warnings/drafts, violet for special/rank, blue for info

### Containers

- Sections: `rounded-xl border p-5` (forms, settings, charts)
- List items: `rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors`
- Bento tiles: `rounded-2xl border p-6`
- No Card component — use plain `<section>` or `<div>` with border classes

### Spacing

- Between page sections: `space-y-10`
- Inside tab content: `space-y-8`
- Inside containers: `space-y-5` or `space-y-6`
- Between list items: `space-y-2`
- Nav items: `space-y-px`

### Interactive Patterns

- Primary CTA buttons: `bg-foreground text-background hover:bg-foreground/90`
- Secondary actions: `variant="ghost"` with `text-muted-foreground hover:text-foreground`
- `+ Add` / `+ New` buttons: ghost variant, top-right of section headers
- Delete actions: `text-muted-foreground hover:text-destructive`, hidden until hover with `opacity-0 group-hover:opacity-100`
- Filter tabs: `px-2.5 py-1 text-xs rounded-md`, active = `bg-foreground text-background font-medium`
- Tabs: use `variant="line"` (underline style) for page-level tabs

### Status Dots

```
draft:        bg-muted-foreground
submitted:    bg-blue-500
under_review: bg-amber-500
accepted:     bg-violet-500
winner:       bg-emerald-500
verified:     h-1.5 w-1.5 rounded-full bg-emerald-500
connected:    h-1.5 w-1.5 rounded-full bg-emerald-500
```

### Form Styling

- Labels: `text-xs text-muted-foreground`
- Group headers within forms: `text-[11px] uppercase tracking-widest text-muted-foreground font-medium`
- Error messages: `text-xs text-destructive`
- Input spacing: `space-y-1.5` between label and input
- Monospace for addresses/codes: `font-mono text-sm`

### Empty States

- Centered icon (`h-8 w-8 opacity-50`) + `text-sm` message + `text-xs` subtitle
- Wrapped in `py-12` padding

## Conventions

- Toast notifications via `sonner` (imported as `toast` from `sonner`)
- Icons from `lucide-react`
- Form validation with `zod` + `react-hook-form`
- Responsive: mobile-first, use `md:` breakpoint for desktop sidebar visibility
- Tables hide non-essential columns on mobile with `hidden md:table-cell`
