# Design Implementation Plan: Brand System Refresh

## Summary
- **Scope:** Full brand system applied to Explore page
- **Style:** "Linear Precision" - minimal, clean, developer-focused
- **Winner variant:** A (with segmented control filters)
- **Key improvements:** Modern B/W palette, clearer hierarchy, technical aesthetic

## Design Tokens

### Colors
Update `src/app/globals.css` to use these tokens:

```css
:root {
  /* Core palette - keep neutral grays */
  --background: oklch(1 0 0);           /* Pure white */
  --foreground: oklch(0 0 0);           /* Pure black */

  /* Primary = black for this theme */
  --primary: oklch(0 0 0);
  --primary-foreground: oklch(1 0 0);

  /* Muted backgrounds */
  --muted: oklch(0.97 0 0);             /* neutral-100 equivalent */
  --muted-foreground: oklch(0.45 0 0);  /* neutral-500 */

  /* Borders - subtle by default */
  --border: oklch(0.9 0 0);             /* neutral-200 */
  --border-hover: oklch(0 0 0);         /* Black on hover */

  /* Winner accent */
  --winner: oklch(0.55 0.15 145);       /* Green-600 */
  --winner-light: oklch(0.9 0.05 145);  /* Green-100 */
}
```

### Typography
- **Headings:** System sans-serif, bold (700), tight tracking
- **Body:** System sans-serif, normal (400)
- **Tech tags:** Monospace font for technical authenticity

### Spacing
- **Card padding:** 20px (p-5)
- **Section gaps:** 32px (gap-8)
- **Element gaps:** 16px (gap-4)

### Border Radius
- **Buttons/inputs:** 6px (rounded-md)
- **Cards:** 6px (rounded-md)
- **Tags:** 4px (rounded)

## Files to Change

### Core Updates
- [ ] `src/app/globals.css` - Update color tokens
- [ ] `src/components/ui/button.tsx` - Ensure B/W variants work
- [ ] `src/components/ui/card.tsx` - Add hover:border-black pattern

### New Components
- [ ] `src/components/ui/segmented-control.tsx` - New filter component

### Explore Page
- [ ] `src/app/explore/page.tsx` - Apply new design
- [ ] `src/components/explore/project-card-explore.tsx` - Update card design
- [ ] `src/components/explore/quick-filters.tsx` - Replace with SegmentedControl
- [ ] `src/components/explore/advanced-search-input.tsx` - Update styling

## Implementation Steps

### 1. Create SegmentedControl Component
```tsx
// src/components/ui/segmented-control.tsx
"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  return (
    <div className={cn("inline-flex p-1 bg-muted rounded-md", className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded transition-all",
            value === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
```

### 2. Update Card Hover Pattern
Add hover border transition to cards:
```tsx
className="border border-border transition-colors hover:border-foreground"
```

### 3. Update Project Card
Key changes:
- Add winner indicator line at top: `absolute -top-px left-4 right-4 h-0.5 bg-winner`
- Use monospace for tech stack badges
- Add border-t for footer section
- Use solid black button for primary action (Demo)
- Use outline button for secondary action (Code)

### 4. Replace Quick Filters
Replace the current pill-style QuickFilters with SegmentedControl:
```tsx
<SegmentedControl
  options={["All", "Winners", "AI Projects", "Story Protocol"]}
  value={activeFilter}
  onChange={setActiveFilter}
/>
```

### 5. Update Search Input
- Keep current structure
- Ensure border transitions to black on focus
- Maintain icon placement

## Required UI States

### Cards
- **Default:** Subtle border (--border)
- **Hover:** Black border (--foreground)
- **Winner:** Green top accent line

### Buttons
- **Primary (Demo):** Black bg, white text
- **Secondary (Code):** White bg, black border, hover border-black
- **Disabled:** 50% opacity

### Segmented Control
- **Inactive:** Muted background, muted text
- **Active:** White background, black text, subtle shadow
- **Hover (inactive):** Text darkens

## Accessibility Checklist
- [ ] Focus states visible on all interactive elements
- [ ] Color contrast meets WCAG AA (black/white = excellent)
- [ ] Keyboard navigation works for segmented control
- [ ] Winner indicator has text alternative (badge)

## Testing Checklist
- [ ] Verify dark mode still works (update .dark tokens if needed)
- [ ] Test responsive behavior on mobile
- [ ] Verify hover states work correctly
- [ ] Test filter functionality

## Design Memory Updates
After implementation, update these brand guidelines:
- **Color approach:** Monochrome with green accent for success states
- **Border pattern:** Subtle → black on hover
- **Filter UI:** Segmented controls for small option sets
- **Tech display:** Always use monospace for technical terms

---

*Generated by Design Lab*
