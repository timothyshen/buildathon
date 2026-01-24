# Cohort, Project Detail & Workshop Pages Design

## Overview

Three new public page groups for the buildathon platform:
1. **Cohort pages** - Listing and detail views for buildathon cohorts
2. **Project pages** - Public showcase and private submission detail views
3. **Workshop page** - Interactive calendar with scheduled sessions and RSVP

All pages are publicly accessible. RSVP functionality requires login.

---

## Routes

```
/cohorts                       → Public cohort listing
/cohorts/[slug]               → Public cohort detail
/projects/[id]                → Public project showcase
/(dashboard)/submissions/[id] → Protected submission detail
/workshops                    → Public workshop calendar
```

---

## 1. Cohort Pages

### Listing Page (`/cohorts`)

- Hero section with title "Explore Buildathons"
- Filter tabs: All | Upcoming | Active | Completed
- Grid of cohort cards:
  - Banner image (or placeholder gradient)
  - Name, tagline, status badge
  - Date range (e.g., "Jan 15 - Feb 28, 2026")
  - Track count, prize pool total
- Click card → navigates to `/cohorts/[slug]`

### Detail Page (`/cohorts/[slug]`)

- Hero with banner image, name, tagline, status badge
- Key info bar: dates, submission deadline, team size limit
- Tabbed content:
  - **Overview** - Description, prizes list, timeline visualization
  - **Tracks** - Cards for each track with sponsor logos, prize pools, requirements
  - **Sponsors** - Grid of sponsor logos grouped by tier
  - **Projects** - Grid of submitted projects (links to `/projects/[id]`)
- CTA: "Submit Your Project" button (if cohort is active)

---

## 2. Project Pages

### Public Showcase (`/projects/[id]`)

- Hero: project title, tagline, team name, status/winner badge
- Media gallery: screenshots carousel, embedded demo video
- Action buttons: "View Demo", "View Repo", "View Presentation"
- Content sections:
  - **About** - Full description, "Built With" story
  - **Tech Stack** - Technology tags/badges
  - **Track** - Submission track with sponsor info
  - **Team** - Member avatars, names, roles, social links
- IP Registration section (if registered): License type, Story Protocol badge
- Related projects from same cohort

### Private Submission Detail (`/(dashboard)/submissions/[id]`)

- Same content as public showcase, plus:
  - Edit button (if status is draft)
  - Status indicator with next steps
  - Review scores & feedback (after judging)
  - Judge internal notes (if any)
- Access: team members only

---

## 3. Workshop Page

### Layout (`/workshops`)

- Hero: "Workshops & Learning Sessions"
- Two-column desktop layout:
  - Left (wider): Calendar component
  - Right (sidebar): Next 5 upcoming sessions

### Calendar Component

- View toggle: "Month" | "Agenda"
- **Month View:**
  - Traditional grid calendar
  - Workshop indicators on event dates
  - Click date → shows workshops in popover
  - Navigation: prev/next month, "Today" button
- **Agenda View:**
  - Chronological list grouped by date
  - Shows: time, title, partner logo, duration, category

### Workshop Card

Displays in both calendar views:
- Title, partner name/logo
- Date, time, duration
- Category badge (Technical, Design, Business)
- Attendee count
- Actions:
  - "View Details" → modal with description, video link
  - "Add to Calendar" → Google, Apple, ICS download
  - "RSVP" → requires login, toggles to "Cancel RSVP"

---

## 4. Data Model Updates

### Workshop Type Extensions

```typescript
Workshop {
  // Existing fields...

  // New scheduling fields
  scheduledAt?: Date        // Live session datetime
  endTime?: Date            // Session end time
  timezone?: string         // e.g., "America/New_York"
  isLive?: boolean          // true = scheduled, false = on-demand
  maxAttendees?: number     // Optional capacity limit
  location?: string         // "Online" or physical
  meetingUrl?: string       // Link shown after RSVP
}
```

### New WorkshopRSVP Type

```typescript
WorkshopRSVP {
  id: string
  workshopId: string
  userId: string
  user?: User
  status: 'registered' | 'attended' | 'cancelled'
  registeredAt: Date
}
```

### New Helper Functions

- `getWorkshopsByDateRange(start: Date, end: Date)`
- `getRSVPsByWorkshop(workshopId: string)`
- `getRSVPsByUser(userId: string)`

---

## 5. File Structure

```
src/app/
├── cohorts/
│   ├── page.tsx              # Listing page
│   └── [slug]/
│       └── page.tsx          # Detail page
├── projects/
│   └── [id]/
│       └── page.tsx          # Public showcase
├── workshops/
│   └── page.tsx              # Calendar page
└── (dashboard)/
    └── submissions/
        └── [id]/
            └── page.tsx      # Private detail

src/components/
├── cohorts/
│   ├── cohort-card.tsx
│   ├── cohort-hero.tsx
│   ├── cohort-tracks.tsx
│   └── cohort-timeline.tsx
├── projects/
│   ├── project-hero.tsx
│   ├── project-gallery.tsx
│   ├── project-team.tsx
│   └── project-card.tsx
└── workshops/
    ├── workshop-calendar.tsx
    ├── calendar-month-view.tsx
    ├── calendar-agenda-view.tsx
    ├── workshop-card.tsx
    ├── workshop-detail-modal.tsx
    └── add-to-calendar-button.tsx
```

---

## 6. Implementation Notes

- Use existing UI components (Card, Badge, Tabs, Button, Dialog)
- Calendar built with custom components (no external library)
- Add to Calendar uses generated URLs/ICS files
- RSVP state managed via auth context + mock data
- Mobile responsive: calendar switches to agenda-only on small screens
