# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build (also runs TypeScript checks)
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

This is a **Next.js 16 App Router** buildathon/hackathon management platform using React 19, TypeScript, and Tailwind CSS 4.

### Route Groups

- `src/app/(dashboard)/` - Protected routes with sidebar layout, requires authentication
- `src/app/(auth)/` - Authentication routes (login)
- `src/app/` - Public marketing pages (home, cohorts, workshops, explore)

### Key Patterns

**Authentication**: Mock auth via `src/contexts/auth-context.tsx`. Uses localStorage for persistence. Dev mode role switcher in sidebar allows testing admin/sponsor/judge/participant views.

**Data Layer**: Currently uses mock data from `src/data/mock-data.ts`. All entities (Cohort, Submission, Track, Workshop, etc.) defined in `src/types/index.ts`.

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
- Dashboard: `Sidebar` (hidden on mobile) + `MobileHeader` (hamburger menu with Sheet drawer)

## Conventions

- Toast notifications via `sonner` (imported as `toast` from `sonner`)
- Icons from `lucide-react`
- Form validation with `zod` + `react-hook-form`
- Responsive: mobile-first, use `md:` breakpoint for desktop sidebar visibility
- Tables hide non-essential columns on mobile with `hidden md:table-cell`
