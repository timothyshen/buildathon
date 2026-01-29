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
- [ ] Navigate to `/login`
- [ ] Enter valid credentials → redirects to `/dashboard`
- [ ] Enter invalid credentials → shows error message
- [ ] Enter non-existent email → shows error message
- [ ] Login persists after page refresh
- [ ] Logout clears session and redirects to home

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
- [ ] Page loads without errors
- [ ] Navigation links work
- [ ] Waitlist form submits successfully
- [ ] Responsive on mobile

### 2.2 Cohorts Page (`/cohorts`)
- [ ] Lists all public cohorts
- [ ] Shows cohort status badges (active, upcoming, completed)
- [ ] Click cohort card → navigates to detail page

### 2.3 Cohort Detail (`/cohorts/[slug]`)
- [ ] Shows cohort information (dates, prizes, description)
- [ ] Banner image displays in hero when set, SVG pattern fallback when not
- [ ] Lists tracks for the cohort
- [ ] Shows sponsors
- [ ] "Apply" or "Submit" CTA works

### 2.4 Explore Page (`/explore`)
- [ ] Lists submitted projects
- [ ] Search filters by title/description
- [ ] Tech stack filter works
- [ ] Track filter works
- [ ] Winner badges display correctly
- [ ] Click project → navigates to detail

### 2.5 Project Detail (`/projects/[id]`)
- [ ] Shows project info (title, description, screenshots)
- [ ] Screenshot gallery displays uploaded images
- [ ] Shows team members
- [ ] Demo/Repo links work
- [ ] Tech stack badges display
- [ ] Prize badges show for winners

### 2.6 Workshops Page (`/workshops`)
- [ ] Lists upcoming workshops
- [ ] Shows workshop categories
- [ ] RSVP button works (when logged in)
- [ ] Calendar integration works
- [ ] Learning resources section displays

### 2.7 About Page (`/about`)
- [ ] Page loads without errors
- [ ] Content displays correctly

---

## 3. Participant Dashboard Tests

### 3.1 Dashboard Home (`/dashboard`)
- [ ] Shows participant-specific content
- [ ] Displays active cohorts
- [ ] Shows user's submissions
- [ ] Shows upcoming workshops

### 3.2 Teams (`/teams`)
- [ ] Lists user's teams
- [ ] Can create new team
- [ ] Can view team details
- [ ] Pending invites display

### 3.3 Team Detail (`/teams/[id]`)
- [ ] Shows team members
- [ ] Team lead can invite members
- [ ] Team lead can remove members
- [ ] Can edit team info (if lead)
- [ ] Pending invites show status

### 3.4 Create Team (`/teams/new`)
- [ ] Form validates required fields
- [ ] Creates team successfully
- [ ] Redirects to team page after creation

### 3.5 Submissions (`/submissions`)
- [ ] Lists user's submissions
- [ ] Shows submission status
- [ ] Can view submission details
- [ ] Can edit draft submissions

### 3.6 Submit Project (`/submit`)
- [ ] Multi-step form navigation works (5 steps)
- [ ] Step 1 (Details): Title, tagline, description via rich text editor
- [ ] Step 2 (Media): Upload screenshots (minimum 3, maximum 10)
- [ ] Step 2: Cannot proceed with fewer than 3 screenshots
- [ ] Step 2: Image uploads via drag-and-drop or click
- [ ] Step 2: Can remove uploaded screenshots
- [ ] Step 3 (Links & Tech): Demo URL, repo URL, video URL, presentation URL, tech stack, license
- [ ] Step 4 (Tracks): Select cohort and tracks
- [ ] Step 5 (Review): Shows summary of all steps with edit buttons
- [ ] Step 5: Edit buttons navigate back to correct step
- [ ] Step 5: Screenshot thumbnails display in review
- [ ] Draft saving works
- [ ] Final submission changes status

### 3.7 Submission Detail (`/submissions/[id]`)
- [ ] Shows all submission details
- [ ] Can edit if status is draft
- [ ] Shows review scores (if available)
- [ ] Shows submission status

### 3.8 Settings (`/settings`)
- [ ] Can update profile info
- [ ] Can update social links
- [ ] Can connect wallet
- [ ] Changes persist after save

---

## 4. Judge Dashboard Tests

### 4.1 Dashboard Home
- [ ] Shows judge-specific stats
- [ ] Pending reviews count
- [ ] Completed reviews count

### 4.2 Reviews List (`/reviews`)
- [ ] Lists assigned reviews
- [ ] Filter by status (pending, completed)
- [ ] Shows submission preview

### 4.3 Review Detail (`/reviews/[id]`)
- [ ] Shows submission details
- [ ] Can view demo/repo
- [ ] Scoring form with 5 categories
- [ ] Can add feedback
- [ ] Can add internal notes
- [ ] Submit review works
- [ ] Can save draft review
n
---

## 5. Sponsor Dashboard Tests

### 5.1 Dashboard Home
- [ ] Shows sponsor org info
- [ ] Participating cohorts list
- [ ] Track submissions count

### 5.2 Tracks (`/sponsor/tracks`)
- [ ] Lists sponsor's tracks across cohorts
- [ ] Shows submission counts per track
- [ ] Can view track details

### 5.3 Reviews (`/sponsor/reviews`)
- [ ] Lists submissions to sponsor tracks
- [ ] Can filter by track
- [ ] Can view submission details

### 5.4 Workshops (`/sponsor/workshops`)
- [ ] Lists sponsor's workshops
- [ ] Can create new workshop
- [ ] Can edit existing workshop
- [ ] RSVP count displays

### 5.5 Create Workshop (`/sponsor/workshops/new`)
- [ ] Form validates required fields
- [ ] Can set schedule details
- [ ] Can add video/article links
- [ ] Creates workshop successfully

### 5.6 Edit Workshop (`/sponsor/workshops/[id]`)
- [ ] Loads existing data
- [ ] Can update all fields
- [ ] Can change status (draft → published)
- [ ] Can archive workshop

---

## 6. Admin Dashboard Tests

### 6.1 Dashboard Home
- [ ] Shows admin stats overview
- [ ] Quick links to admin sections

### 6.2 Cohorts (`/admin/cohorts`)
- [ ] Lists all cohorts
- [ ] Can create new cohort
- [ ] Stats cards show correct counts
- [ ] Search/filter works

### 6.3 Cohort Detail (`/admin/cohorts/[id]`)
- [ ] Shows cohort details
- [ ] Banner image displays when set
- [ ] Can edit cohort info
- [ ] Can manage tracks
- [ ] Can manage sponsors
- [ ] Can change status

### 6.4 Cohort Edit (`/admin/cohorts/[id]/edit`)
- [ ] Multi-step form loads with existing data (Basic Info, Dates, Settings, Prizes, Sponsors)
- [ ] Can click any step tab directly in edit mode
- [ ] Changing name auto-updates slug field
- [ ] Banner image uploader shows current image with replace/remove
- [ ] Can upload new banner image (drag-and-drop or click)
- [ ] Can remove banner image
- [ ] Rejects non-image files and files > 5MB
- [ ] Save persists all changes across all steps
- [ ] Validation errors navigate to the step with the error and show toast
- [ ] Sponsor add/update/remove syncs correctly on save

### 6.5 Create Cohort (`/admin/cohorts/new`)
- [ ] Multi-step form works (must complete steps sequentially)
- [ ] Name auto-generates slug
- [ ] Can upload banner image
- [ ] Creates cohort and redirects to list

### 6.6 Submissions (`/admin/submissions`)
- [ ] Lists all submissions
- [ ] Filter by cohort
- [ ] Filter by status
- [ ] Search by title/team
- [ ] Can view submission details

### 6.7 Submission Detail (`/admin/submissions/[id]`)
- [ ] Shows full submission info
- [ ] Can change status
- [ ] Can assign reviews
- [ ] Can mark as winner

### 6.8 Judges (`/admin/judges`)
- [ ] Lists all judges
- [ ] Shows review stats
- [ ] Can invite new judge
- [ ] Can assign reviews

### 6.9 Reviews (`/admin/reviews`)
- [ ] Lists all reviews across cohorts
- [ ] Filter by cohort, status, reviewer
- [ ] Shows review scores and feedback

### 6.10 Review Detail (`/admin/reviews/[id]`)
- [ ] Shows submission with review scores
- [ ] Admin can submit/edit reviews with 5 scoring categories
- [ ] Can add feedback and internal notes
- [ ] Three-role review system: admin, sponsor, judge reviews distinguished

### 6.11 Sponsors (`/admin/sponsors`)
- [ ] Lists sponsor organizations
- [ ] Can create new org
- [ ] Can edit org details
- [ ] Can manage cohort sponsorships

### 6.12 Users (`/admin/users`)
- [ ] Lists all users
- [ ] Stats show role counts
- [ ] Search by name/email
- [ ] Filter by role
- [ ] Can edit user role
- [ ] Sponsor org selector shows when role = sponsor
- [ ] Role change persists

### 6.13 Workshops (`/admin/workshops`)
- [ ] Lists all workshops
- [ ] Can create workshop
- [ ] Can edit any workshop
- [ ] Can change workshop status

### 6.14 Theme Guide (`/admin/theme`)
- [ ] Displays color palette
- [ ] Shows component examples

---

## 7. Cross-Role Tests

### 7.1 Access Control
- [ ] Participant cannot access `/admin/*`
- [ ] Judge cannot access `/sponsor/*`
- [ ] Sponsor cannot access `/admin/*`
- [ ] Unauthenticated users redirected to login

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
- [ ] Text search filters results
- [ ] Track filter works
- [ ] Tech stack filter works
- [ ] Multiple filters combine correctly
- [ ] Clear filters resets view

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
