# Project Showcase Design

Enhance the existing `/projects/[id]` page into a full project showcase with traction data, video embeds, winner highlights, and bento design conversion.

## Current State

The page already has: hero (status badge, logo, title, tagline, team, action buttons), screenshot gallery, about/description, tech stack badges, track info with sponsor, team card, IP registration details, and related projects. Uses Card components throughout.

## Enhancements

### 1. Traction Section

**Stats strip** (below hero, full width):
- Horizontal row of latest snapshot metrics: DAU, MAU, total visits, tx count
- `font-mono font-semibold tabular-nums` with semantic colors
- Only shown if at least one snapshot exists
- Separated by `divide-x`

**Traction chart** (main content area):
- Recharts line chart showing metrics over time from all snapshots
- X-axis: snapshot dates, Y-axis: metric values
- Toggle between metrics (visits, DAU, MAU, tx count) with filter tabs (`px-2.5 py-1 text-xs rounded-md`)
- Wrapped in `rounded-xl border p-5` section

**Data source**: `tractionService.getSnapshots(submissionId)` and `tractionService.getLatestSnapshot(submissionId)`

### 2. Milestones Timeline (sidebar)

- Vertical timeline with dots and connecting lines
- Each milestone: type icon + title + date + description
- Verified milestones get an emerald checkmark badge
- Milestone types: testnet_launch, mainnet_launch, funding_round, partnership, user_milestone, product_launch, other
- Data source: `tractionService.getMilestones(submissionId)`

### 3. Video Embed

Replace "Watch Video" external link with inline player:

- URL parser utility `parseVideoUrl(url)` returns `{ provider, embedUrl } | null`
- YouTube: `youtube.com/watch?v=` or `youtu.be/` → `youtube.com/embed/{id}`
- Loom: `loom.com/share/` → `loom.com/embed/{id}`
- Other URLs → fall back to external link button
- Container: `aspect-video rounded-xl overflow-hidden`
- Placed in gallery section

### 4. Winner Highlight

For `status === "winner"`:
- Prominent gold/amber gradient banner below hero
- Project name + "Winner" + track name + prize amount
- Trophy icon, `font-semibold`

### 5. Bento Conversion

- Replace all `Card/CardHeader/CardContent` with `<section className="rounded-xl border p-5">`
- Section headers: `text-[11px] uppercase tracking-widest text-muted-foreground font-medium`
- Status dots instead of Badge (except winner keeps gold treatment)

### 6. Dynamic Metadata

Convert static `metadata` export to `generateMetadata()`:
- `<title>`: "{project title} - SWA.XYZ"
- `<meta description>`: tagline or truncated description
- Open Graph: `og:title`, `og:description`, `og:image` (first screenshot or logo)
- Twitter card: `summary_large_image`

## Files

| File | Action | Description |
|------|--------|-------------|
| `src/app/projects/[id]/page.tsx` | Modify | Traction fetch, video embed, winner banner, bento, dynamic metadata |
| `src/components/projects/project-hero.tsx` | Modify | Bento style updates |
| `src/components/projects/project-traction.tsx` | Create | Stats strip + Recharts line chart |
| `src/components/projects/project-milestones.tsx` | Create | Vertical timeline |
| `src/components/projects/project-video.tsx` | Create | Video embed with URL parsing |
| `src/components/projects/project-winner-banner.tsx` | Create | Gold winner banner |
| `src/components/projects/project-gallery.tsx` | Modify | Integrate video embed |
| `src/components/projects/project-team.tsx` | Modify | Bento conversion |
| `package.json` | Modify | Add `recharts` dependency |

## Dependencies

- `recharts` (new) — line chart for traction data
