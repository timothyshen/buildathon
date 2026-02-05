# E2E Test Cases - Human Testing Scripts

This document provides detailed step-by-step test scripts for sections 8, 10, 11, and 12 of the E2E Testing Plan.

---

## Table of Contents

- [Section 8: Image Upload Tests](#section-8-image-upload-tests)
- [Section 10: Workshop RSVP Tests](#section-10-workshop-rsvp-tests)
- [Section 11: Search and Filter Tests](#section-11-search-and-filter-tests)
- [Section 12: Responsive Design Tests](#section-12-responsive-design-tests)

---

## Section 8: Image Upload Tests

### Prerequisites
- Test images prepared:
  - `valid-small.jpg` (< 1MB, 800x600)
  - `valid-large.jpg` (> 5MB, 4000x3000)
  - `valid-medium.png` (2MB, 1920x1080)
  - `valid.webp` (500KB)
  - `valid.gif` (animated, 800KB)
  - `invalid.pdf` (any PDF file)
  - `invalid.zip` (any ZIP file)
- Logged in as admin: `timothy.shen@piplabs.xyz` / `password123`
- Dev server running at `http://localhost:5567`

---

### TC-8.1: Upload API Validation

#### TC-8.1.1: Accept Valid Image Types

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open browser DevTools → Network tab | Network tab visible |
| 2 | Navigate to `/admin/cohorts/new` | Create cohort form loads |
| 3 | In Step 1 (Basic Info), click the banner upload area | File picker opens |
| 4 | Select `valid-small.jpg` | - Upload starts (spinner visible)<br>- Network shows POST to `/api/upload`<br>- Response status 200<br>- Image preview appears |
| 5 | Remove the image and repeat with `valid-medium.png` | Same as step 4 |
| 6 | Remove and repeat with `valid.webp` | Same as step 4 |
| 7 | Remove and repeat with `valid.gif` | Same as step 4 |

**Pass Criteria:** All four image types upload successfully with 200 response.

---

#### TC-8.1.2: Reject Non-Image File Types

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On `/admin/cohorts/new`, click banner upload area | File picker opens |
| 2 | Select `invalid.pdf` | - Error toast appears: "Invalid file type"<br>- No image preview shown<br>- Network shows 400 response OR client-side rejection |
| 3 | Click upload area again, select `invalid.zip` | Same rejection behavior |

**Pass Criteria:** Non-image files are rejected with clear error message.

---

#### TC-8.1.3: Validate Bucket Parameter

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools Console | Console visible |
| 2 | Run the following code to test invalid bucket: | |
```javascript
const formData = new FormData();
formData.append('file', new Blob(['test'], {type: 'image/jpeg'}), 'test.jpg');
formData.append('bucket', 'invalid-bucket');
fetch('/api/upload', { method: 'POST', body: formData })
  .then(r => console.log('Status:', r.status));
```
| 3 | Check console output | Status: 400 (Bad Request) |
| 4 | Repeat with bucket = 'banners' | Status: 200 (or 401 if auth required) |
| 5 | Repeat with bucket = 'screenshots' | Status: 200 (or 401 if auth required) |

**Pass Criteria:** Only `banners` and `screenshots` buckets are accepted.

---

### TC-8.2: Client-Side Image Compression

#### TC-8.2.1: Large Images Auto-Compressed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/cohorts/new` | Form loads |
| 2 | Open DevTools → Network tab | Network tab visible |
| 3 | Clear network log | Log cleared |
| 4 | Upload `valid-large.jpg` (> 5MB) to banner | - Upload completes successfully<br>- In Network tab, check request payload size<br>- Payload should be significantly smaller than original file |
| 5 | Check the uploaded file dimensions | Image should be max 2560px on longest dimension |

**Pass Criteria:** Large image is compressed before upload; final dimensions ≤ 2560px.

---

#### TC-8.2.2: Small Images Skip Compression

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/cohorts/new` | Form loads |
| 2 | Upload `valid-small.jpg` (< 1MB) | - Upload completes quickly<br>- Image displays at original dimensions |
| 3 | In DevTools, compare request size with original file size | Should be similar (compression skipped for < 1MB) |

**Pass Criteria:** Small images upload without unnecessary compression.

---

#### TC-8.2.3: GIFs Skip Compression

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/submit` (as participant) or `/admin/cohorts/new` | Form loads |
| 2 | Upload `valid.gif` | - GIF uploads successfully<br>- Animation preserved (if displayed)<br>- File not converted to WebP |

**Pass Criteria:** GIF files bypass compression to preserve animation.

---

### TC-8.3: Cohort Banner Upload

#### TC-8.3.1: Banner Upload in Create Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/cohorts/new` | Multi-step form loads at Step 1 |
| 2 | Locate "Banner Image" section in Basic Info step | Upload area visible with drop zone |
| 3 | Drag `valid-medium.png` onto drop zone | - Shows upload progress/spinner<br>- Image preview appears after upload |
| 4 | Hover over the image preview | "Replace" and "Remove" buttons appear |
| 5 | Click "Remove" | Image removed, drop zone reappears |
| 6 | Click the drop zone (not drag) | File picker opens |
| 7 | Select `valid-small.jpg` | Image uploads and displays |
| 8 | Complete the form and create cohort | Cohort created successfully |
| 9 | Navigate to public cohort page `/cohorts/[slug]` | Banner image displays in hero section |

**Pass Criteria:** Full banner upload lifecycle works in create flow.

---

#### TC-8.3.2: Banner Upload in Edit Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/cohorts` | Cohort list displays |
| 2 | Click Edit on a cohort with existing banner | Edit form loads with banner preview shown |
| 3 | Hover over banner, click "Replace" | File picker opens |
| 4 | Select a different image | New image uploads and replaces old one |
| 5 | Click "Save" | Changes saved |
| 6 | Refresh page | New banner still displays |
| 7 | Edit again, click "Remove" on banner | Banner removed |
| 8 | Save and view public cohort page | SVG pattern fallback displays (no banner) |

**Pass Criteria:** Banner can be replaced and removed in edit mode.

---

### TC-8.4: Submission Screenshots Upload

#### TC-8.4.1: Multiple Image Upload Requirements

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as participant: `builder@example.com` / `password123` | Dashboard loads |
| 2 | Navigate to `/submit` | Multi-step submission form loads |
| 3 | Complete Step 1 (Details) with valid data | Proceed to Step 2 |
| 4 | Observe Media step header | Shows "0/3 required" or similar counter |
| 5 | Try to proceed to Step 3 | - Blocked or validation error<br>- Message: "Minimum 3 screenshots required" |
| 6 | Upload 1 image | Counter updates to "1/3", "(2 more needed)" in red |
| 7 | Upload 2 more images (total 3) | - Counter shows "3/3"<br>- "Next" button enabled<br>- Red warning disappears |

**Pass Criteria:** Minimum 3 screenshots enforced; counter updates correctly.

---

#### TC-8.4.2: Multi-Select Upload

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Step 2 (Media), click upload area | File picker opens |
| 2 | Select 3+ images at once (Ctrl/Cmd + click) | - All images begin uploading<br>- Placeholder spinners for each<br>- All images appear in grid when complete |
| 3 | Verify count matches selection | All selected images uploaded (none dropped) |

**Pass Criteria:** Batch selection uploads all selected images.

---

#### TC-8.4.3: Maximum Images Limit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload 10 images total | - Grid shows 10 images<br>- Add button disabled or hidden |
| 2 | Try to upload another image | - Prevented or shows toast: "Maximum 10 screenshots" |
| 3 | Remove 1 image (click X on thumbnail) | - Image removed<br>- Add button re-enabled<br>- Count shows 9 |

**Pass Criteria:** Maximum 10 screenshots enforced; can remove to add more.

---

#### TC-8.4.4: Screenshot Display in Review Step

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete Steps 1-4 with valid data and 3+ screenshots | Proceed to Step 5 (Review) |
| 2 | Locate Media section in review | Screenshot thumbnails display |
| 3 | Click "Edit" button on Media section | Returns to Step 2 |
| 4 | Make no changes, proceed back to Step 5 | Screenshots still display correctly |
| 5 | Submit the project | Submission created successfully |
| 6 | Navigate to `/projects/[id]` (public project page) | Screenshots display in gallery |

**Pass Criteria:** Screenshots persist through review and display on public page.

---

### TC-8.5: Supabase Storage Verification

#### TC-8.5.1: Public URL Accessibility

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Upload a banner image in cohort form | Image uploads successfully |
| 2 | Right-click preview image → "Copy Image Address" | URL copied |
| 3 | Open new incognito/private browser window | Clean session |
| 4 | Paste and visit the URL | Image loads (public access works) |
| 5 | Repeat for a screenshot URL | Same result |

**Pass Criteria:** Uploaded images accessible via public URLs without auth.

---

#### TC-8.5.2: File Persistence After Refresh

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a cohort with banner image | Cohort created |
| 2 | Refresh browser (F5 / Cmd+R) | Banner still displays in admin view |
| 3 | Wait 5 minutes | |
| 4 | Navigate away and return to cohort edit | Banner still displays |
| 5 | Check public cohort page | Banner displays |

**Pass Criteria:** Uploaded files persist in storage indefinitely.

---

## Section 10: Workshop RSVP Tests

### Prerequisites
- Logged in as participant: `builder@example.com` / `password123`
- At least one published workshop with future date exists
- Dev server running

---

### TC-10.1: RSVP Flow

#### TC-10.1.1: RSVP from Workshop Card

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/workshops` | Workshop list displays |
| 2 | Find a workshop card (not past) | Card shows RSVP button |
| 3 | Click "RSVP" button on card | - Button changes to "Cancel RSVP" or shows RSVPd state<br>- Attendee count increments |
| 4 | Refresh page | RSVP state persists (still shows RSVPd) |

**Pass Criteria:** RSVP from card works and persists.

---

#### TC-10.1.2: RSVP from Workshop Detail Modal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On `/workshops`, click on a workshop card (not the RSVP button) | Detail modal opens |
| 2 | Check for meeting link | Should say "RSVP to receive the meeting link" (if not RSVPd) |
| 3 | Click "RSVP for this Workshop" in modal | - Button changes to "Cancel RSVP"<br>- "RSVPd" badge appears<br>- Meeting link now visible |
| 4 | Close modal, check card | Card shows RSVPd status |

**Pass Criteria:** RSVP from modal works; meeting link revealed after RSVP.

---

#### TC-10.1.3: Cancel RSVP

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With an active RSVP, click "Cancel RSVP" | - Confirmation may appear (if implemented)<br>- RSVP cancelled<br>- Button returns to "RSVP" state |
| 2 | Check attendee count | Count decremented |
| 3 | Check meeting link | Hidden again / "RSVP to receive..." message |

**Pass Criteria:** RSVP can be cancelled; UI reverts appropriately.

---

#### TC-10.1.4: RSVP Count Display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Note the RSVP count on a workshop card (e.g., "5/50 attending") | Count visible |
| 2 | RSVP to the workshop | Count increments (e.g., "6/50 attending") |
| 3 | Open workshop in second browser/incognito | Count shows same updated value |
| 4 | Cancel RSVP | Count decrements back |

**Pass Criteria:** RSVP count updates in real-time across views.

---

#### TC-10.1.5: Unauthenticated User RSVP Attempt

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open incognito browser (not logged in) | |
| 2 | Navigate to `/workshops` | Workshop list displays |
| 3 | Click RSVP on any workshop | Redirected to `/login` page |
| 4 | Login with valid credentials | Redirected back (or to dashboard) |

**Pass Criteria:** Unauthenticated users redirected to login before RSVP.

---

### TC-10.2: Calendar Integration

#### TC-10.2.1: Google Calendar Link

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On a workshop card, find calendar dropdown/icon | Calendar options visible |
| 2 | Click "Google Calendar" option | - New tab opens<br>- Google Calendar event creation page loads<br>- Event details pre-filled (title, dates, description, location) |
| 3 | Verify event details | - Title matches workshop name<br>- Time/date correct<br>- Description includes workshop info<br>- Location or meeting URL included |

**Pass Criteria:** Google Calendar link opens with correct pre-filled data.

---

#### TC-10.2.2: ICS File Download

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On workshop card, click "iCal" or "Apple Calendar" option | - File download starts<br>- File named `[workshop-name].ics` |
| 2 | Open downloaded .ics file | - Default calendar app opens<br>- Event details displayed |
| 3 | Verify event in calendar app | - Title, time, description correct<br>- Location/meeting URL included |

**Pass Criteria:** ICS file downloads with valid calendar data.

---

#### TC-10.2.3: Apple Calendar / Outlook Options

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Apple Calendar" option | ICS file downloads (same as TC-10.2.2) |
| 2 | Click "Outlook" option | Opens Outlook web/link or downloads ICS |
| 3 | Verify each calendar option works | Events can be added to respective calendars |

**Pass Criteria:** All calendar integration options functional.

---

## Section 11: Search and Filter Tests

### Prerequisites
- Multiple projects with varying tech stacks submitted (use seed data)
- Logged in as admin for admin filter tests
- Dev server running

---

### TC-11.1: Explore Page Filters

#### TC-11.1.1: Text Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/explore` | Project grid displays |
| 2 | Note total project count | e.g., "24 projects" |
| 3 | Type "react" in search box | - Results filter in real-time<br>- Only projects with "react" in title/description/tagline shown<br>- Count updates |
| 4 | Clear search (X button or backspace) | All projects show again |

**Pass Criteria:** Text search filters by title, description, tagline.

---

#### TC-11.1.2: Tech Stack Filter (@ Symbol)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On `/explore`, type `@typescript` in search | - Filter chip appears for "typescript" (tech)<br>- Results show only projects with TypeScript |
| 2 | Add another: type `@react` | - Second chip appears<br>- Results show projects with BOTH techs |
| 3 | Click X on one chip | That filter removed, results update |

**Pass Criteria:** Tech filter works with @ prefix; multiple techs combine.

---

#### TC-11.1.3: Cohort Filter (# Symbol)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type `#buildathon` or known cohort name | - Cohort filter chip appears<br>- Results show only projects from that cohort |
| 2 | Combine with text search: `#buildathon ai` | Results: cohort filter + text search AND combination |

**Pass Criteria:** Cohort filter works with # prefix.

---

#### TC-11.1.4: Prize Filter (! Symbol)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type `!winner` | - Prize filter chip appears<br>- Only winning projects shown |
| 2 | Type `!first` | Shows first-place winners |

**Pass Criteria:** Prize filter works with ! prefix.

---

#### TC-11.1.5: Multiple Filters Combined

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Build complex query: `@react #cohort1 !winner game` | - 4 filter chips: tech, cohort, prize, text<br>- Results match ALL criteria |
| 2 | Check URL | Query persisted: `?q=%40react+%23cohort1+%21winner+game` |
| 3 | Copy URL and open in new tab | Same filters applied on load |

**Pass Criteria:** Multiple filters combine with AND logic; URL persistence works.

---

#### TC-11.1.6: Clear All Filters

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Apply 3+ filters | Multiple filter chips visible |
| 2 | Click "Clear All" button | - All chips removed<br>- Search box cleared<br>- Full results restored<br>- URL cleared |

**Pass Criteria:** Clear all removes all active filters.

---

#### TC-11.1.7: Segmented Control Filters

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Winners" segment | Only winning projects shown |
| 2 | Click "AI Projects" segment | Projects with AI tech stack shown |
| 3 | Click "All" segment | All projects restored |
| 4 | Combine segment with search: "Winners" + type "finance" | Results = winners + "finance" text match |

**Pass Criteria:** Segmented controls work alone and combined with search.

---

### TC-11.2: Admin Table Filters

#### TC-11.2.1: Submissions Search and Filter

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/submissions` | Submissions table loads |
| 2 | Type in search box | Table filters by title and team name |
| 3 | Select a cohort from dropdown | Only submissions from that cohort shown |
| 4 | Select a status from dropdown | Only submissions with that status shown |
| 5 | Combine: search + cohort + status | All three filters apply (AND) |
| 6 | Clear all filters | Full table restored |

**Pass Criteria:** Admin submissions table filters work correctly.

---

#### TC-11.2.2: Users Search and Filter

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/users` | Users table loads |
| 2 | Type email in search | Filters by email |
| 3 | Type name in search | Filters by name |
| 4 | Select "judge" from role dropdown | Only judges shown |
| 5 | Combine search + role filter | Both apply |

**Pass Criteria:** Admin users table filters by name, email, role.

---

#### TC-11.2.3: Sponsors Search and Filter

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/sponsors` | Sponsors table loads |
| 2 | Search by sponsor org name | Matches found |
| 3 | Search by contact email | Matches found |
| 4 | Filter by cohort | Only sponsors in that cohort shown |

**Pass Criteria:** Admin sponsors table filters correctly.

---

#### TC-11.2.4: Reviews Multi-Filter

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/reviews` | Reviews table loads |
| 2 | Set cohort filter | Filters by cohort |
| 3 | Set judge filter | Shows only that judge's reviews |
| 4 | Set status filter (pending/completed) | Filters by review status |
| 5 | Add search text | Further filters by judge name or submission title |
| 6 | All four filters active | Results match ALL criteria |

**Pass Criteria:** Admin reviews table supports 4-way filtering.

---

## Section 12: Responsive Design Tests

### Prerequisites
- Browser DevTools for responsive testing
- Real mobile device (optional, recommended)
- Test all roles: admin, participant, sponsor, judge

---

### TC-12.1: Mobile Views (< 768px)

#### TC-12.1.1: Dashboard Header - Mobile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open DevTools → Toggle device toolbar (Ctrl+Shift+M) | Mobile emulation active |
| 2 | Set viewport to 375px width (iPhone SE) | |
| 3 | Login and navigate to `/dashboard` | Dashboard loads |
| 4 | Check header | - Hamburger menu icon (left)<br>- Logo (center)<br>- Avatar dropdown (right) |
| 5 | Sidebar should NOT be visible | No sidebar on screen |
| 6 | Click hamburger icon | Sidebar slides in from left (Sheet component) |
| 7 | Navigation items visible in sheet | All nav items accessible |
| 8 | Click outside sheet or X | Sheet closes |

**Pass Criteria:** Mobile header shows hamburger + logo + avatar; sidebar in sheet.

---

#### TC-12.1.2: Avatar Dropdown - Mobile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On mobile dashboard, click avatar (top right) | Dropdown menu opens |
| 2 | Check dropdown contents | - User name<br>- User email<br>- Avatar image<br>- "Settings" link<br>- "Sign Out" button |
| 3 | Click "Settings" | Navigates to `/settings` |
| 4 | Return and click "Sign Out" | Logged out, redirected to home |

**Pass Criteria:** Avatar dropdown fully functional on mobile.

---

#### TC-12.1.3: Mobile Sidebar Sheet Navigation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open hamburger menu | Sheet slides in |
| 2 | Click each nav item in turn | - Navigates to correct page<br>- Sheet closes after navigation |
| 3 | Check badge counts (if any) | Badges visible and correct |
| 4 | Test role-specific nav items | - Admin: sees admin links<br>- Sponsor: sees sponsor links<br>- etc. |

**Pass Criteria:** All navigation works from mobile sheet.

---

#### TC-12.1.4: Admin Tables - Mobile Column Hiding

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/cohorts` on mobile | Table loads |
| 2 | Check visible columns | Only essential columns: Name, Actions |
| 3 | Hidden columns | Dates, Sponsors, Visibility hidden |
| 4 | Navigate to `/admin/users` | Only Name/Email + Actions visible |
| 5 | Navigate to `/admin/submissions` | Only Title + Actions visible |

**Pass Criteria:** Non-essential columns hidden on mobile to prevent horizontal scroll.

---

#### TC-12.1.5: Forms Usability - Mobile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/submit` on mobile | Form loads |
| 2 | Fill out Step 1 (Details) | - All inputs accessible<br>- Rich text editor usable<br>- Labels visible |
| 3 | Proceed through all steps | - Step indicators visible<br>- Navigation buttons reachable |
| 4 | Test `/admin/cohorts/new` | Multi-step form usable |
| 5 | Test any modal/dialog | - Fits screen<br>- Close button reachable<br>- Content scrollable if needed |

**Pass Criteria:** All forms usable on mobile without horizontal scrolling.

---

#### TC-12.1.6: Explore Page - Mobile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/explore` on mobile | Page loads |
| 2 | Check project cards | - Single column layout<br>- Cards full width<br>- All info visible |
| 3 | Use search and filters | - Filter chips wrap properly<br>- Search input full width |
| 4 | Open project detail | - Detail page/modal fits screen<br>- Screenshots scrollable |

**Pass Criteria:** Explore page fully functional on mobile.

---

### TC-12.2: Tablet Views (768px - 1024px)

#### TC-12.2.1: Dashboard Layout - Tablet

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 768px (iPad mini) | |
| 2 | Navigate to `/dashboard` | Dashboard loads |
| 3 | Check layout | - Sidebar may be visible OR collapsed<br>- Content area fills remaining space |
| 4 | Set viewport to 1024px (iPad Pro) | |
| 5 | Check layout | Sidebar visible, wider content area |

**Pass Criteria:** Layout adapts smoothly at tablet breakpoints.

---

#### TC-12.2.2: Tables - Tablet

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/submissions` at 768px | Table loads |
| 2 | Check visible columns | More columns than mobile, fewer than desktop |
| 3 | Increase to 900px | Additional columns may appear |
| 4 | Check horizontal scrolling | None required (columns fit) |

**Pass Criteria:** Tables show appropriate columns for tablet width.

---

#### TC-12.2.3: Grid Layouts - Tablet

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/explore` at 768px | |
| 2 | Check project grid | 2 columns (sm:grid-cols-2) |
| 3 | Navigate to `/workshops` | |
| 4 | Check workshop card grid | 2 columns |
| 5 | Navigate to admin dashboard | |
| 6 | Check stats cards | 2 or 4 columns depending on layout |

**Pass Criteria:** Grids adjust to 2-column layout on tablets.

---

### TC-12.3: Desktop Views (> 1024px)

#### TC-12.3.1: Full Dashboard Layout - Desktop

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 1280px | |
| 2 | Navigate to `/dashboard` | Dashboard loads |
| 3 | Check layout | - Sidebar always visible (256px fixed width)<br>- Content area fills remaining space<br>- No hamburger menu |
| 4 | Check header | Avatar dropdown visible on right |

**Pass Criteria:** Desktop shows full sidebar, no mobile elements.

---

#### TC-12.3.2: Tables - Desktop

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/cohorts` | Table loads |
| 2 | Check columns | All columns visible: Name, Dates, Sponsors, Visibility, Actions |
| 3 | Navigate to `/admin/users` | All columns: Name, Email, Role, Org, Actions |
| 4 | Navigate to `/admin/submissions` | All columns: Title, Team, Cohort, Status, Date, Actions |

**Pass Criteria:** All table columns visible on desktop.

---

#### TC-12.3.3: Grid Layouts - Desktop

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/explore` at 1280px | |
| 2 | Check project grid | 4 columns (md:grid-cols-4) |
| 3 | Navigate to admin dashboard | |
| 4 | Check stats cards | 4 columns |
| 5 | Navigate to `/workshops` | |
| 6 | Check workshop card grid | 3-4 columns |

**Pass Criteria:** Grids maximize column count on desktop.

---

#### TC-12.3.4: Public Header - Desktop

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/` (home page) at 1280px | |
| 2 | Check header | - Full navigation links visible<br>- No hamburger icon<br>- Login/Avatar on right |
| 3 | Navigate to `/cohorts`, `/workshops`, `/explore` | Same header behavior |

**Pass Criteria:** Public pages show full nav on desktop.

---

### TC-12.4: Cross-Breakpoint Transitions

#### TC-12.4.1: Live Resize Behavior

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `/dashboard` in resizable window | |
| 2 | Slowly resize from 1280px → 768px → 375px | - Layout transitions smoothly<br>- No content overlap<br>- No horizontal scrollbar appears |
| 3 | Resize back up 375px → 768px → 1280px | - Elements expand smoothly<br>- Sidebar appears at md breakpoint |

**Pass Criteria:** No layout breaking during live resize.

---

#### TC-12.4.2: Sheet Close on Resize

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open dashboard at mobile width | |
| 2 | Open hamburger menu (sheet) | Sheet visible |
| 3 | Resize to desktop width (> 768px) | Sheet should close OR become irrelevant (sidebar visible) |

**Pass Criteria:** No conflicting UI elements across breakpoints.

---

## Test Execution Checklist

### Before Testing
- [ ] Dev server running (`pnpm dev`)
- [ ] Database seeded with test data (`npx tsx scripts/seed.ts`)
- [ ] Browser cache cleared
- [ ] DevTools open for network/console monitoring
- [ ] Test images prepared (various sizes/types)

### During Testing
- [ ] Note any console errors
- [ ] Screenshot failures
- [ ] Record exact reproduction steps
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on actual mobile device if available

### After Testing
- [ ] Document bugs using template below
- [ ] Prioritize by severity
- [ ] Re-test after fixes

---

## Bug Report Template

```markdown
### Bug Title

**Test Case ID:** TC-X.X.X

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**

**Actual Result:**

**Screenshots:**

**Console Errors:**

**Browser/Device:**
- Browser: Chrome 120 / Firefox 121 / Safari 17
- OS: macOS 14 / Windows 11 / iOS 17
- Viewport: 375px / 768px / 1280px

**Additional Notes:**
```
