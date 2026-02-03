# E2E Testing Plan - SWA.XYZ Buildathon Platform

## Test Environment Setup

### Prerequisites
- Supabase project configured with database schema
- Storage buckets created (`banners`, `screenshots`) via migration `003_storage_buckets.sql`
- Seed data loaded (`npx tsx scripts/seed.ts`)
- Dev server running (`npm run dev`)

### Test Accounts
| Email | Password | Role |
|-------|----------|------|
| timothy.shen@piplabs.xyz | password123 | admin |
| judge@example.com | password123 | judge |
| builder@example.com | password123 | participant |
| sponsor@gamefi.com | password123 | sponsor |
| sam@example.com | password123 | participant |

---

## 1. Authentication Tests

### 1.1 Login Flow
- [x] Navigate to `/login`
- [x] Enter valid credentials → redirects to `/dashboard`
- [ ] Enter invalid credentials → shows error message
- [ ] Enter non-existent email → shows error message
- [x] Login persists after page refresh
- [x] Logout clears session and redirects to home

### 1.2 Registration Flow
- [ ] Navigate to `/register`
- [ ] Register with new email → creates account
- [ ] Register with existing email → shows error
- [ ] Password validation works (minimum length)
- [ ] Redirects to onboarding after registration

### 1.3 Onboarding Flow
- [ ] New user redirected to `/onboarding`
- [ ] Can fill out profile details (name, bio, social links)
- [ ] Completing onboarding redirects to dashboard
- [ ] Skipping onboarding works (if allowed)

---

## 2. Public Pages Tests

### 2.1 Home Page (`/`)
- [x] Page loads without errors
- [x] Navigation links work
- [ ] Waitlist form submits successfully
- [ ] Responsive on mobile

### 2.2 Cohorts Page (`/cohorts`)
- [x] Lists all public cohorts
- [x] Shows cohort status badges (active, upcoming, completed)
- [x] Click cohort card → navigates to detail page

### 2.3 Cohort Detail (`/cohorts/[slug]`)
- [x] Shows cohort information (dates, prizes, description)
- [x] Banner image displays in hero when set, SVG pattern fallback when not
- [x] Lists tracks for the cohort
- [x] Shows sponsors
- [x] "Apply" or "Submit" CTA works

### 2.4 Explore Page (`/explore`)
- [x] Lists submitted projects
- [x] Search filters by title/description
- [x] Tech stack filter works
- [x] Track filter works
- [x] Winner badges display correctly
- [x] Click project → navigates to detail

### 2.5 Project Detail (`/projects/[id]`)
- [x] Shows project info (title, description, screenshots)
- [x] Screenshot gallery displays uploaded images
- [x] Shows team members
- [x] Demo/Repo links work
- [x] Tech stack badges display
- [x] Prize badges show for winners

### 2.6 Workshops Page (`/workshops`)
- [x] Lists upcoming workshops
- [x] Shows workshop categories
- [x] RSVP button works (when logged in)
- [x] Calendar integration works
- [x] Learning resources section displays

### 2.7 About Page (`/about`)
- [x] Page loads without errors
- [x] Content displays correctly

---

## 3. Participant Dashboard Tests

### 3.1 Dashboard Home (`/dashboard`)
- [x] Shows participant-specific content
- [x] Displays active cohorts
- [x] Shows user's submissions
- [x] Shows upcoming workshops

### 3.2 Teams (`/teams`)
- [x] Lists user's teams
- [x] Can create new team
- [x] Can view team details
- [x] Pending invites display

### 3.3 Team Detail (`/teams/[id]`)
- [x] Shows team members
- [x] Team lead can invite members
- [x] Team lead can remove members
- [x] Can edit team info (if lead)
- [x] Pending invites show status

### 3.4 Create Team (`/teams/new`)
- [x] Form validates required fields
- [x] Creates team successfully
- [x] Redirects to team page after creation

### 3.5 Submissions (`/submissions`)
- [x] Lists user's submissions
- [x] Shows submission status
- [x] Can view submission details
- [x] Can edit draft submissions

### 3.6 Submit Project (`/submit`)
- [x] Multi-step form navigation works (5 steps)
- [x] Step 1 (Details): Title, tagline, description via rich text editor
- [x] Step 2 (Media): Upload screenshots (minimum 3, maximum 10)
- [ ] Step 2: Cannot proceed with fewer than 3 screenshots
- [ ] Step 2: Image uploads via drag-and-drop or click
- [x] Step 2: Can remove uploaded screenshots
- [x] Step 3 (Links & Tech): Demo URL, repo URL, video URL, presentation URL, tech stack, license
- [x] Step 4 (Tracks): Select cohort and tracks
- [x] Step 5 (Review): Shows summary of all steps with edit buttons
- [x] Step 5: Screenshot thumbnails display in review
- [x] Draft saving works
- [x] Final submission changes status

### 3.7 Submission Detail (`/submissions/[id]`)
- [x] Shows all submission details
- [x] Can edit if status is draft
- [ ] Shows review scores (if available)
- [x] Shows submission status

### 3.8 Settings (`/settings`)
- [x] Can update profile info
- [x] Can update social links
- [ ] Can connect wallet
- [ ] Changes persist after save

---

## 4. Judge Dashboard Tests

### 4.1 Dashboard Home
- [x] Shows judge-specific stats
- [x] Pending reviews count
- [x] Completed reviews count

issue: sidebar showing participant side bar

### 4.2 Reviews List (`/reviews`)
- [x] Lists assigned reviews
- [x] Filter by status (pending, completed)
- [x] Shows submission preview

### 4.3 Review Detail (`/reviews/[id]`)
- [x] Shows submission details
- [x] Can view demo/repo
- [x] Scoring form with 5 categories
- [x] Can add feedback
- [x] Can add internal notes
- [x] Submit review works
- [ ] Can save draft review

---

## 5. Sponsor Dashboard Tests

### 5.1 Dashboard Home
- [x] Shows sponsor org info
- [x] Participating cohorts list
- [x] Track submissions count

### 5.2 Tracks (`/sponsor/tracks`)
- [x] Lists sponsor's tracks across cohorts
- [x] Shows submission counts per track
- [x] Can view track details

### 5.3 Reviews (`/sponsor/reviews`)
- [x] Lists submissions to sponsor tracks
- [ ] Can filter by track
- [ ] Can view submission details

### 5.4 Workshops (`/sponsor/workshops`)
- [x] Lists sponsor's workshops
- [x] Can create new workshop
- [x] Can edit existing workshop
- [x] RSVP count displays

### 5.5 Create Workshop (`/sponsor/workshops/new`)
- [x] Form validates required fields
- [x] Can set schedule details
- [x] Can add video/article links
- [x] Creates workshop successfully

### 5.6 Edit Workshop (`/sponsor/workshops/[id]`)
- [x] Loads existing data
- [x] Can update all fields
- [x] Can change status (draft → published)
- [x] Can archive workshop

---

## 6. Admin Dashboard Tests

### 6.1 Dashboard Home
- [x] Shows admin stats overview
- [x] Quick links to admin sections

### 6.2 Cohorts (`/admin/cohorts`)
- [x] Lists all cohorts
- [x] Can create new cohort
- [x] Stats cards show correct counts
- [x] Search/filter works

### 6.3 Cohort Detail (`/admin/cohorts/[id]`)
- [x] Shows cohort details
- [x] Banner image displays when set
- [x] Can edit cohort info
- [x] Can manage tracks
- [x] Can manage sponsors
- [x] Can change status

### 6.4 Cohort Edit (`/admin/cohorts/[id]/edit`)
- [x] Multi-step form loads with existing data (Basic Info, Dates, Settings, Prizes, Sponsors)
- [x] Can click any step tab directly in edit mode
- [x] Changing name auto-updates slug field
- [x] Banner image uploader shows current image with replace/remove
- [x] Can upload new banner image (drag-and-drop or click)
- [x] Can remove banner image
- [x] Rejects non-image files and files > 5MB
- [x] Save persists all changes across all steps
- [x] Validation errors navigate to the step with the error and show toast
- [x] Sponsor add/update/remove syncs correctly on save

### 6.5 Create Cohort (`/admin/cohorts/new`)
- [x] Multi-step form works (must complete steps sequentially)
- [x] Name auto-generates slug
- [x] Can upload banner image
- [x] Creates cohort and redirects to list

### 6.6 Submissions (`/admin/submissions`)
- [x] Lists all submissions
- [x] Filter by cohort
- [x] Filter by status
- [x] Search by title/team
- [x] Can view submission details

### 6.7 Submission Detail (`/admin/submissions/[id]`)
- [x] Shows full submission info
- [x] Can change status
- [x] Can assign reviews
- [x] Can mark as winner

### 6.8 Judges (`/admin/judges`)
- [x] Lists all judges
- [x] Shows review stats
- [x] Can invite new judge
- [x] Can assign reviews

### 6.9 Reviews (`/admin/reviews`)
- [x] Lists all reviews across cohorts
- [x] Filter by cohort, status, reviewer
- [x] Shows review scores and feedback

### 6.10 Review Detail (`/admin/reviews/[id]`)
- [x] Shows submission with review scores
- [x] Admin can submit/edit reviews with 5 scoring categories
- [x] Can add feedback and internal notes
- [x] Three-role review system: admin, sponsor, judge reviews distinguished

### 6.11 Sponsors (`/admin/sponsors`)
- [x] Lists sponsor organizations
- [x] Can create new org
- [x] Can edit org details
- [x] Can manage cohort sponsorships

### 6.12 Users (`/admin/users`)
- [x] Lists all users
- [x] Stats show role counts
- [x] Search by name/email
- [x] Filter by role
- [x] Can edit user role
- [x] Sponsor org selector shows when role = sponsor
- [x] Role change persists

### 6.13 Workshops (`/admin/workshops`)
- [x] Lists all workshops
- [ ] Can create workshop
- [x] Can edit any workshop
- [ ] Can change workshop status

### 6.14 Theme Guide (`/admin/theme`)
- [x] Displays color palette
- [x] Shows component examples

---

## 7. Cross-Role Tests

### 7.1 Access Control
- [x] Participant cannot access `/admin/*`
- [x] Judge cannot access `/sponsor/*`
- [x] Sponsor cannot access `/admin/*`
- [x] Unauthenticated users redirected to login

---

## 8. Image Upload Tests

### 8.1 Upload API (`POST /api/upload`)
- [ ] Accepts valid image files (JPEG, PNG, WebP, GIF)
- [ ] Rejects non-image file types (PDF, ZIP, etc.)
- [ ] Rejects files over 5MB
- [ ] Returns public URL on success
- [ ] Requires valid bucket parameter (`banners` or `screenshots`)
- [ ] Rejects invalid bucket names

### 8.2 Cohort Banner Upload
- [ ] ImageUploader renders in cohort form (Basic Info step)
- [ ] Click or drag-and-drop uploads image
- [ ] Shows upload progress/spinner
- [ ] Displays image preview after upload
- [ ] Can replace existing banner with new upload
- [ ] Can remove banner image
- [ ] Banner URL persists after saving cohort
- [ ] Banner displays in CohortHero on public cohort page
- [ ] Cohorts without banner show SVG pattern fallback

### 8.3 Submission Screenshots Upload
- [ ] MultiImageUploader renders in submit form (Media step)
- [ ] Shows "{current}/3 required" counter
- [ ] Shows "(X more needed)" in red when below minimum
- [ ] Can upload multiple images
- [ ] Grid layout displays uploaded thumbnails
- [ ] Can remove individual screenshots
- [ ] Cannot proceed past Media step with < 3 screenshots
- [ ] Disables add button at 10 screenshots (max)
- [ ] Screenshots display in review step summary
- [ ] Screenshots persist after submission
- [ ] ProjectGallery displays screenshots on project detail page

### 8.4 Supabase Storage
- [ ] `banners` bucket exists and is public
- [ ] `screenshots` bucket exists and is public
- [ ] Uploaded files accessible via public URL
- [ ] Files persist after page refresh

---

## 9. Workshop RSVP Tests

### 9.1 RSVP Flow
- [ ] Can RSVP from workshop card
- [ ] Can RSVP from workshop detail modal
- [ ] RSVP count updates
- [ ] User marked as RSVP'd
- [ ] Can cancel RSVP
- [ ] Meeting link shown after RSVP

### 9.2 Calendar Integration
- [ ] Google Calendar link works
- [ ] ICS download works
- [ ] Apple Calendar link works

---

## 10. Search and Filter Tests

### 10.1 Explore Page Filters
- [x] Text search filters results
- [x] Track filter works
- [x] Tech stack filter works
- [x] Multiple filters combine correctly
- [x] Clear filters resets view

### 10.2 Admin Table Filters
- [ ] Search filters table rows
- [ ] Dropdown filters work
- [ ] Pagination works (if implemented)

---

## 11. Responsive Design Tests

### 11.1 Mobile Views (< 768px)
- [ ] Navigation collapses to hamburger
- [ ] Mobile sidebar works
- [ ] Tables hide non-essential columns
- [ ] Forms are usable
- [ ] Modals fit screen

### 11.2 Tablet Views (768px - 1024px)
- [ ] Layout adapts properly
- [ ] Sidebar may be collapsed
- [ ] Tables show more columns

### 11.3 Desktop Views (> 1024px)
- [ ] Full layout displayed
- [ ] Sidebar always visible (dashboard)
- [ ] Full tables displayed

---

## 12. Error Handling Tests

### 12.1 Network Errors
- [ ] Shows error message on API failure
- [ ] Can retry failed requests
- [ ] Graceful degradation

### 12.2 Form Validation
- [ ] Required fields show errors
- [ ] Email format validated
- [ ] URL format validated
- [ ] Error messages are clear

### 12.3 404 Pages
- [ ] Invalid routes show 404 page
- [ ] 404 has navigation back

---

## 13. Data Integrity Tests

### 13.1 Submission Flow
- [ ] Creating submission updates team's submissions
- [ ] Deleting submission removes from lists
- [ ] Status changes reflect everywhere

### 13.2 Team Management
- [ ] Adding member updates team list
- [ ] Removing member updates counts
- [ ] Team deletion handles submissions

### 13.3 User Role Changes
- [ ] Changing to judge → user appears in judges list
- [ ] Changing to sponsor → can link to org
- [ ] Changing from sponsor → org link cleared

---

## Test Execution Checklist

### Pre-Test
- [ ] Fresh database seed
- [ ] Clear browser cache
- [ ] Dev server running
- [ ] Console open for errors

### During Test
- [ ] Note any console errors
- [ ] Screenshot failures
- [ ] Record reproduction steps

### Post-Test
- [ ] Document bugs found
- [ ] Prioritize fixes
- [ ] Re-test after fixes

---

## Bug Report Template

```markdown
### Bug Title

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
```
