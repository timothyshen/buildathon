# SWA.XYZ Brand Guide

## Brand Overview

**Brand Name:** SWA.XYZ (Story Web3 Accelerator)
**Tagline:** Building the future of programmable IP
**Style:** Linear Precision — minimal, clean, developer-focused

## Design Principles

1. **Clarity over decoration** — Every element serves a purpose
2. **Typography-first** — Let the content speak through clear hierarchy
3. **Subtle interactivity** — Hover states and transitions that feel intentional
4. **Technical authenticity** — Monospace for code/tech, system fonts for content
5. **Accessible by default** — High contrast, clear focus states, keyboard-friendly

---

## Color System

### Primary Palette (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#ffffff` (white) | Page backgrounds |
| `--foreground` | `#000000` (black) | Primary text |
| `--muted` | `#f5f5f5` (neutral-100) | Muted backgrounds, inputs |
| `--muted-foreground` | `#737373` (neutral-500) | Secondary text |
| `--border` | `#e5e5e5` (neutral-200) | Default borders |
| `--border-hover` | `#000000` (black) | Borders on hover/focus |

### Primary Palette (Dark Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0a` (neutral-950) | Page backgrounds |
| `--foreground` | `#ffffff` (white) | Primary text |
| `--muted` | `#262626` (neutral-800) | Muted backgrounds |
| `--muted-foreground` | `#a3a3a3` (neutral-400) | Secondary text |
| `--border` | `#262626` (neutral-800) | Default borders |
| `--border-hover` | `#ffffff` (white) | Borders on hover/focus |

### Semantic Colors

| Type | Light | Dark | Usage |
|------|-------|------|-------|
| Success | `emerald-500` | `emerald-400` | Active states, wins |
| Warning | `amber-500` | `amber-400` | Grand prizes, attention |
| Info | `blue-500` | `blue-400` | Informational badges |
| Error | `red-500` | `red-400` | Errors, destructive |

### Prize Badge Colors

| Prize Type | Background | Text | Icon |
|------------|------------|------|------|
| Grand Prize | `amber-100/900` | `amber-700/400` | Trophy |
| Runner Up | `slate-100/800` | `slate-700/300` | Medal |
| Track Winner | `violet-100/900` | `violet-700/400` | Award |
| Honorable | `blue-100/900` | `blue-700/400` | Star |

---

## Typography

### Font Stack

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 4xl-6xl | Bold (700) | Tight (1.1) | Page titles, hero |
| H1 | 3xl (30px) | Bold (700) | Tight (1.2) | Section headers |
| H2 | 2xl (24px) | Bold (700) | Snug (1.3) | Card titles |
| H3 | xl (20px) | Semibold (600) | Snug (1.3) | Subsections |
| Body | base (16px) | Normal (400) | Normal (1.5) | Paragraphs |
| Small | sm (14px) | Normal (400) | Normal (1.5) | Meta info, labels |
| Caption | xs (12px) | Medium (500) | Normal (1.5) | Tags, badges |

### Typography Patterns

- **Headings:** Tight tracking (`tracking-tight`), bold weight
- **Overlines:** Uppercase, wider tracking (`tracking-widest`), muted color
- **Tech terms:** Monospace font (`font-mono`)
- **Links:** Underline on hover, not by default

---

## Spacing

### Base Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, inline spacing |
| `space-2` | 8px | Between related elements |
| `space-3` | 12px | Input padding, small gaps |
| `space-4` | 16px | Component gaps |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section padding (small) |
| `space-8` | 32px | Section gaps |
| `space-12` | 48px | Large section spacing |
| `space-16` | 64px | Page section padding |

### Layout Patterns

- **Max width:** `max-w-6xl` (72rem / 1152px) for content
- **Max width:** `max-w-7xl` (80rem / 1280px) for full-width sections
- **Page padding:** `px-4 sm:px-6 lg:px-8`
- **Section padding:** `py-16` for major sections

---

## Components

### Cards

```
Default: border border-neutral-200 dark:border-neutral-800
         rounded-md bg-white dark:bg-neutral-900

Hover:   border-black dark:border-white (transition-colors)

Winner:  Colored top line (absolute, h-0.5, left-4 right-4)
```

### Buttons

**Primary (solid):**
```
bg-black dark:bg-white
text-white dark:text-black
hover:bg-neutral-800 dark:hover:bg-neutral-200
rounded-md px-4 py-2
```

**Secondary (outline):**
```
border border-neutral-200 dark:border-neutral-700
hover:border-black dark:hover:border-white
rounded-md px-4 py-2
```

**Ghost:**
```
text-neutral-600 dark:text-neutral-400
hover:text-black dark:hover:text-white
hover:bg-neutral-100 dark:hover:bg-neutral-800
```

### Segmented Control

```
Container: p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md

Inactive:  text-neutral-600 dark:text-neutral-400
           hover:text-black dark:hover:text-white

Active:    bg-white dark:bg-neutral-900
           text-black dark:text-white
           shadow-sm rounded
```

### Badges

**Status badges:**
```
px-2 py-0.5 text-xs rounded
+ semantic color classes
```

**Tech stack badges:**
```
px-2 py-0.5 text-xs font-mono rounded
bg-neutral-100 dark:bg-neutral-800
text-neutral-600 dark:text-neutral-400
```

### Inputs

```
w-full px-4 py-3 text-sm
bg-white dark:bg-neutral-900
border border-neutral-200 dark:border-neutral-800
rounded-md

Focus: outline-none border-black dark:border-white
       transition-colors
```

---

## Icons

- **Library:** Lucide React
- **Size:** 16px (h-4 w-4) for inline, 20px (h-5 w-5) for buttons
- **Stroke width:** Default (2px)
- **Color:** Inherit from text color

### Common Icons

| Purpose | Icon |
|---------|------|
| External link | `ExternalLink` |
| GitHub | `Github` |
| Search | `Search` |
| Filter | `Filter` |
| Close | `X` |
| Menu | `Menu` |
| Loading | `Loader2` (with animate-spin) |
| Calendar | `Calendar` |
| Users | `Users` |
| Trophy | `Trophy` |
| Award | `Award` |
| Star | `Star` |
| Medal | `Medal` |

---

## Motion

### Timing

| Type | Duration | Usage |
|------|----------|-------|
| Micro | 150ms | Button states, focus rings |
| Default | 200ms | Hover states, color changes |
| Emphasis | 300ms | Card transforms, slides |
| Page | 500ms | Hero animations, reveals |

### Easing

- **Enter:** `ease-out` — Quick start, smooth end
- **Exit:** `ease-in` — Smooth start, quick end
- **Movement:** `ease-in-out` — Smooth both ends

### Common Patterns

```css
/* Color transitions */
transition-colors

/* All property transitions */
transition-all

/* Transform transitions */
transition-transform duration-500

/* Spring-like effect */
transition-all duration-300 ease-out
```

---

## Layout Patterns

### Page Header

```tsx
<header className="border-b border-neutral-200 dark:border-neutral-800">
  <div className="mx-auto max-w-6xl px-6 py-16">
    <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
      Page Title
    </h1>
    <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400 max-w-xl">
      Description text
    </p>
  </div>
</header>
```

### Content Grid

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

### Empty State

```tsx
<div className="text-center py-16">
  <Icon className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700" />
  <h3 className="mt-4 text-lg font-semibold text-black dark:text-white">
    Title
  </h3>
  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
    Description
  </p>
</div>
```

---

## Header Navigation

### Style

- Sticky with backdrop blur
- Minimal B/W color scheme
- Logo: Text-based "SWA.XYZ" in bold
- Navigation: Ghost-style links, active state with subtle bg
- CTAs: Primary button style for main action

### Structure

```
[Logo] .............. [Nav Links] .............. [CTA / User Menu]
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Larger phones |
| `md` | 768px | Tablets, show desktop nav |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Standard desktops |
| `2xl` | 1536px | Large displays |

### Mobile Patterns

- Hide complex elements below `md:`
- Use `hidden md:block` for desktop-only
- Use `md:hidden` for mobile-only
- Stack layouts: `flex-col md:flex-row`

---

## Accessibility

### Focus States

```css
focus:outline-none focus-visible:ring-2 focus-visible:ring-black
dark:focus-visible:ring-white focus-visible:ring-offset-2
```

### Color Contrast

- Text on light: minimum 4.5:1 ratio (black on white = 21:1 ✓)
- Large text: minimum 3:1 ratio
- UI elements: minimum 3:1 ratio

### Interactive Elements

- Minimum touch target: 44x44px
- Keyboard navigable
- Visible focus indicators
- Descriptive link text

---

## File Naming

- Components: `kebab-case.tsx` (e.g., `project-card-explore.tsx`)
- Pages: `page.tsx` in route folders
- Utils: `kebab-case.ts` (e.g., `prize-utils.ts`)
- Types: Defined in `src/types/index.ts`

---

*Last updated: Brand refresh implementation*
