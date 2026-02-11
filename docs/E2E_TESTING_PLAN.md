# E2E Testing Plan - SWA.XYZ Buildathon Platform

## Test Environment Setup

### Prerequisites
- Supabase project configured with database schema
- Storage buckets created (`banners`, `screenshots`) via migration `003_storage_buckets.sql`
- Notifications migration applied (`009_notifications.sql`)
- Seed data loaded (`npx tsx scripts/seed.ts`)
- Sponsor invites migration applied (`003_sponsor_invites.sql`)
- VAPID keys configured (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) for push notifications
- Dynamic Labs environment ID configured (`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`) for wallet integration
- Dev server running (`pnpm dev`)
- MetaMask or compatible EVM wallet extension installed (for wallet tests)

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

### 1.2 Wallet Login Flow
- [ ] Login page shows "Sign in with Wallet" button below the email/password form
- [ ] Click "Sign in with Wallet" → Dynamic wallet connect modal opens
- [ ] Connect MetaMask with a wallet that IS bound to an account → auto-logs in → redirects to `/dashboard`
- [ ] Connect MetaMask with a wallet NOT bound to any account → shows error: "No account found with this wallet. Register with email first, then connect your wallet in Settings."
- [ ] Wallet login error clears when clicking "Sign in with Wallet" again
- [ ] Dynamic modal can be dismissed without side effects
- [ ] After failed wallet login attempt, Dynamic session is cleaned up (no stale wallet state)
- [ ] Network error during wallet login → shows "Network error. Please try again."

### 1.3 Registration Flow
- [ ] Navigate to `/register`
- [ ] Register with new email → creates account
- [ ] Register with existing email → shows error
- [ ] Password validation works (minimum 6 characters)
- [ ] Password confirmation must match
- [ ] Redirects to onboarding after registration

### 1.4 Sponsor Invite Registration Flow
- [ ] Navigate to `/register?invite=<valid-token>` → shows org banner with name, logo, "Sponsor" badge
- [ ] Navigate to `/register?invite=<invalid-token>` → shows "Invalid Invite" error with fallback link
- [ ] Navigate to `/register?invite=<expired-token>` → shows expiry error
- [ ] Navigate to `/register?invite=<used-token>` → shows "already been used" error
- [ ] Email field is locked when invite has a restricted email
- [ ] After registration with valid invite → user role set to `sponsor`, `sponsor_org_id` set
- [ ] After registration with valid invite → invite token marked as used
- [ ] Sponsor user proceeds through onboarding → role preserved as `sponsor` (not overwritten to `participant`)
- [ ] Sponsor lands in sponsor dashboard after onboarding

### 1.5 Onboarding Flow
- [ ] New user redirected to `/onboarding`
- [ ] Can fill out profile details (name, bio, social links)
- [ ] Completing onboarding redirects to dashboard
- [ ] Onboarding preserves existing role (sponsor, judge) instead of defaulting to participant
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

### 3.1 Dashboard Header (All Roles)
- [ ] Desktop: notification bell + user avatar dropdown visible on the right
- [ ] Mobile: hamburger menu + logo + notification bell + user avatar dropdown
- [ ] Notification bell shows unread count badge when notifications exist
- [ ] Click notification bell → popover opens with notification list
- [ ] Notification list shows type-specific icons (submission, review, team, etc.)
- [ ] Notification list shows relative timestamps (e.g., "2 minutes ago")
- [ ] Click a notification → navigates to linked page (e.g., submission detail)
- [ ] Click a notification → marks it as read (removes bold styling)
- [ ] "Mark all read" button clears all unread notifications
- [ ] "Load more" appears when there are older notifications to fetch
- [ ] Empty state shown when no notifications exist
- [ ] Dropdown shows user name, email, avatar
- [ ] Dropdown "Settings" link navigates to `/settings`
- [ ] Dropdown "Sign Out" logs out and redirects to home
- [ ] Sidebar includes "Settings" link in Quick Actions

### 3.2 Dashboard Home (`/dashboard`)
- [ ] Shows participant-specific content
- [ ] Displays active cohorts
- [ ] Shows user's submissions
- [ ] Shows upcoming workshops

### 3.3 Teams (`/teams`)
- [ ] Lists user's teams
- [ ] Can create new team
- [ ] Can view team details
- [ ] Pending invites display

### 3.4 Team Detail (`/teams/[id]`)
- [ ] Shows team members
- [ ] Team lead can invite members
- [ ] Team lead can remove members
- [ ] Can edit team info (if lead)
- [ ] Pending invites show status

### 3.5 Create Team (`/teams/new`)
- [ ] Form validates required fields
- [ ] Creates team successfully
- [ ] Redirects to team page after creation

### 3.6 Submissions (`/submissions`)
- [ ] Lists user's submissions
- [ ] Shows submission status
- [ ] Can view submission details
- [ ] Can edit draft submissions

### 3.7 Submit Project (`/submit`)
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

### 3.8 Submission Detail (`/submissions/[id]`)
- [ ] Shows all submission details
- [ ] Can edit if status is draft
- [ ] Shows review scores (if available)
- [ ] Shows submission status

### 3.9 Settings (`/settings`)
- [ ] Can update profile info (name, bio)
- [ ] Can update social links (Twitter, GitHub)
- [ ] Changes persist after save and page refresh
- [ ] "Save Changes" button shows loading spinner while saving
- [ ] Toast confirms successful save

### 3.10 Settings — Wallet Connect (`/settings`)
- [ ] Wallet section shows "Connect Wallet" button when no wallet is bound
- [ ] "Loading wallet SDK..." shown while Dynamic SDK initializes
- [ ] Click "Connect Wallet" → Dynamic modal opens
- [ ] Approve connection in MetaMask → wallet address saved to account → shows connected state
- [ ] Connected state shows truncated address (e.g., `0x742d...bD38`) in mono font
- [ ] Green status dot indicates connected wallet
- [ ] Copy button copies full wallet address to clipboard
- [ ] Copy button shows checkmark briefly after copying
- [ ] Disconnect button (unplug icon) opens confirmation dialog
- [ ] Confirm disconnect → wallet removed from account → reverts to "Connect Wallet" button
- [ ] Cancel disconnect → dialog closes, wallet remains connected
- [ ] Connecting a wallet already bound to another account → error toast: "This wallet is already connected to another account"
- [ ] Wallet connect/disconnect is immediate (not tied to "Save Changes" button)
- [ ] After disconnect, wallet login with that address shows "No account found" on login page

### 3.11 Settings — Notification Preferences (`/settings`)
- [ ] Notifications section shows 5 toggles: Push, Submission updates, Review alerts, Deadline reminders, Team activity
- [ ] All toggles default to enabled (except Push which defaults to disabled)
- [ ] Toggling a preference and clicking "Save Changes" persists the change
- [ ] Preferences survive page refresh after save
- [ ] Push notifications toggle prompts browser permission dialog when enabled (if not already granted)
- [ ] Disabling "Submission updates" suppresses submission-related push notifications
- [ ] Disabling "Review alerts" suppresses review-related push notifications
- [ ] Disabling "Deadline reminders" suppresses deadline reminder push notifications
- [ ] Disabling "Team activity" suppresses team invite push notifications
- [ ] In-app notifications (bell) are always shown regardless of push preference toggles

---

## 4. Judge Dashboard Tests

### 4.1 Dashboard Home
- [x] Shows judge-specific stats
- [x] Pending reviews count
- [x] Completed reviews count

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
- [ ] RSVP count displays

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
- [ ] Large images auto-compressed client-side (resized to 2560px max, WebP)
- [ ] Save persists all changes across all steps
- [ ] Validation errors navigate to the step with the error and show toast
- [ ] Sponsor add/update/remove syncs correctly on save
- [ ] Can create new sponsor org inline via "+" button in Sponsors step

### 6.5 Create Cohort (`/admin/cohorts/new`)
- [ ] Multi-step form works (must complete steps sequentially)
- [ ] Name auto-generates slug
- [ ] Can upload banner image
- [ ] Sponsors step: "+" button opens "Create New Organization" dialog
- [ ] Create org dialog validates required fields (name, contact name, contact email)
- [ ] New org appears in dropdown immediately after creation
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
- [ ] Link icon button generates invite link for a sponsor org
- [ ] Invite link dialog shows copyable URL
- [ ] Copy button copies link to clipboard with visual feedback (checkmark)
- [ ] Dialog describes 7-day expiry and single-use constraint
- [ ] Mail icon button opens existing "Invite Sponsor" form (assign role to existing user)
- [ ] Stats cards show correct counts (total sponsors, contributions, tracks, platinum/gold)

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
- [ ] Participant cannot access `/admin/*` (redirected to `/dashboard`)
- [ ] Judge cannot access `/sponsor/*`
- [ ] Sponsor cannot access `/admin/*` (redirected to `/dashboard`)
- [ ] Unauthenticated users redirected to login
- [ ] Admin layout performs client-side role check (defense-in-depth)
- [ ] Middleware performs server-side redirect for protected routes

---

## 8. Image Upload Tests

### 8.1 Upload API (`POST /api/upload`)
- [ ] Accepts valid image files (JPEG, PNG, WebP, GIF)
- [ ] Rejects non-image file types (PDF, ZIP, etc.)
- [ ] Rejects files over 5MB (after client-side compression)
- [ ] Returns public URL on success
- [ ] Requires valid bucket parameter (`banners` or `screenshots`)
- [ ] Rejects invalid bucket names

### 8.2 Client-Side Image Compression
- [ ] Large images (>1MB) are auto-compressed before upload
- [ ] Banners resized to max 2560px dimension, WebP at 85% quality
- [ ] Screenshots resized to max 1920px dimension, WebP at 85% quality
- [ ] GIFs are skipped (not compressed)
- [ ] Files under 1MB are skipped (not compressed)
- [ ] Compression result only used if smaller than original
- [ ] Users can upload images larger than 5MB (compressed to fit)

### 8.3 Cohort Banner Upload
- [ ] ImageUploader renders in cohort form (Basic Info step)
- [ ] Click or drag-and-drop uploads image
- [ ] Shows upload progress/spinner
- [ ] Displays image preview after upload
- [ ] Can replace existing banner with new upload
- [ ] Can remove banner image
- [ ] Banner URL persists after saving cohort
- [ ] Banner displays in CohortHero on public cohort page
- [ ] Cohorts without banner show SVG pattern fallback

### 8.4 Submission Screenshots Upload
- [ ] MultiImageUploader renders in submit form (Media step)
- [ ] Shows "{current}/3 required" counter
- [ ] Shows "(X more needed)" in red when below minimum
- [ ] Can upload multiple images simultaneously (select 3+ at once)
- [ ] All selected images upload correctly (no dropped uploads)
- [ ] Grid layout displays uploaded thumbnails
- [ ] Can remove individual screenshots
- [ ] Cannot proceed past Media step with < 3 screenshots
- [ ] Disables add button at 10 screenshots (max)
- [ ] Screenshots display in review step summary
- [ ] Screenshots persist after submission
- [ ] ProjectGallery displays screenshots on project detail page

### 8.5 Supabase Storage
- [ ] `banners` bucket exists and is public
- [ ] `screenshots` bucket exists and is public
- [ ] Uploaded files accessible via public URL
- [ ] Files persist after page refresh

---

## 9. Sponsor Invite API Tests

### 9.1 Create Invite (`POST /api/invites`)
- [ ] Admin can create invite with `sponsorOrgId`
- [ ] Returns token, orgName, expiresAt
- [ ] Non-admin gets 403 Forbidden
- [ ] Unauthenticated gets 401 Unauthorized
- [ ] Invalid sponsorOrgId returns 404
- [ ] Optional `email` field restricts invite to specific email
- [ ] Optional `expiresInDays` (default 7) sets correct expiry

### 9.2 Validate Invite (`GET /api/invites/[token]`)
- [ ] Valid token returns orgName, orgLogo, restrictedEmail
- [ ] No auth required (public endpoint)
- [ ] Invalid token returns 404
- [ ] Expired token returns 410
- [ ] Used token returns 410

### 9.3 Consume Invite (`POST /api/invites/[token]`)
- [ ] Authenticated user can consume valid token
- [ ] Sets user role to `sponsor` and `sponsor_org_id`
- [ ] Marks invite as used (used_at, used_by)
- [ ] Email-restricted invite rejects mismatched email (403)
- [ ] Expired token returns 410
- [ ] Already-used token returns 410
- [ ] Unauthenticated gets 401

---

## 10. Workshop RSVP Tests

### 10.1 RSVP Flow
- [ ] Can RSVP from workshop card
- [ ] Can RSVP from workshop detail modal
- [ ] RSVP count updates
- [ ] User marked as RSVP'd
- [ ] Can cancel RSVP
- [ ] Meeting link shown after RSVP

### 10.2 Calendar Integration
- [ ] Google Calendar link works
- [ ] ICS download works
- [ ] Apple Calendar link works

---

## 11. Notification System Tests

### 11.1 Notification Triggers
- [ ] Submitting a project → admin(s) receive "New submission" notification
- [ ] Admin changes submission status → submitter receives "Status changed" notification
- [ ] Judge completes a review → submitter receives "Review completed" notification
- [ ] Admin assigns reviews to a judge → judge receives "Review assigned" notification
- [ ] Team lead invites a member → invitee receives "Team invite" notification
- [ ] User submits feedback → admin receives "New feedback" notification

### 11.2 Realtime Notifications
- [ ] New notification appears in bell popover without page refresh (Supabase Realtime)
- [ ] Unread badge count increments in real-time when new notification arrives
- [ ] Toast notification appears for high-priority types (review_assigned, submission_status_changed)
- [ ] Multiple rapid notifications all appear correctly (no race conditions)

### 11.3 Notification List Behavior
- [ ] Notifications sorted by newest first
- [ ] Unread notifications have bold title styling
- [ ] Read notifications have normal weight styling
- [ ] Clicking notification navigates to correct page:
  - submission_submitted → `/admin/submissions/[id]`
  - submission_status_changed → `/submissions/[id]`
  - review_completed → `/submissions/[id]`
  - review_assigned → `/reviews/[id]`
  - team_invite_created → `/teams/[id]`
  - deadline_reminder → `/submissions` or `/reviews`
- [ ] "Mark all read" clears badge count to 0
- [ ] Pagination loads older notifications via "Load more"
- [ ] Empty state shows when user has no notifications

### 11.4 Push Notifications (Browser)
- [ ] Service worker registers successfully on first visit
- [ ] Browser permission prompt appears when enabling push in settings
- [ ] After granting permission, push subscription saved to `push_subscriptions` table
- [ ] Push notification displays with correct title and body when app is backgrounded
- [ ] Clicking push notification opens correct page in browser
- [ ] Denying browser permission → push toggle stays disabled with explanation
- [ ] Revoking browser permission → push notifications stop (no errors)
- [ ] Multiple devices: push sent to all subscribed devices for the user

### 11.5 Deadline Reminder Cron
- [ ] Cron endpoint (`/api/cron/deadline-reminders`) requires `CRON_SECRET` authorization
- [ ] Sends 24-hour reminder for cohorts with submission deadlines tomorrow
- [ ] Sends 2-hour reminder for cohorts with submission deadlines in 2 hours
- [ ] Only reminds users with draft submissions (not already submitted)
- [ ] Sends judge reminders for pending review deadlines
- [ ] Does not send duplicate reminders (idempotent within time window)

### 11.6 Notification Preferences Filtering
- [ ] User with `submission_updates: false` does NOT receive push for submission status changes
- [ ] User with `review_alerts: false` does NOT receive push for review assignments
- [ ] User with `deadline_reminders: false` does NOT receive push for deadline reminders
- [ ] User with `team_activity: false` does NOT receive push for team invites
- [ ] User with `push_enabled: false` does NOT receive any push notifications
- [ ] In-app notifications (in the bell) are always created regardless of push preferences

---

## 12. Wallet Integration Tests

### 12.1 Wallet Login API (`POST /api/auth/wallet-login`)
- [ ] Valid wallet address bound to an account → returns `{ email, token_hash }`
- [ ] Valid wallet address NOT bound to any account → returns `{ error: "NO_ACCOUNT" }` with 404
- [ ] Missing `walletAddress` field → returns `{ error: "INVALID_REQUEST" }` with 400
- [ ] Non-string `walletAddress` → returns 400
- [ ] Case-insensitive lookup works (lowercase address matches checksummed DB entry)
- [ ] Server error returns `{ error: "SERVER_ERROR" }` with 500

### 12.2 Wallet Binding Flow (Settings)
- [ ] Connect wallet in settings → address saved to `users.wallet_address` in database
- [ ] Wallet address stored case-preserved (checksummed)
- [ ] Disconnect wallet → `wallet_address` set to null in database
- [ ] Re-connect same wallet after disconnect → works without error
- [ ] Connect wallet on Account A → try connecting same wallet on Account B → error "already connected to another account"
- [ ] After binding wallet in settings, wallet login works on login page

### 12.3 Wallet Login End-to-End
- [ ] Bind wallet to Account A in settings → log out → go to login page → "Sign in with Wallet" → connect same wallet → logged back into Account A
- [ ] After wallet login, session persists across page refresh
- [ ] After wallet login, all dashboard features work normally (submissions, reviews, etc.)
- [ ] Wallet login works with different EVM chains in MetaMask (Ethereum Mainnet, Base, Polygon) — address is chain-agnostic

### 12.4 Dynamic SDK Integration
- [ ] Dynamic SDK loads without console errors
- [ ] Dynamic modal matches app theme (dark/light mode)
- [ ] Dynamic modal shows supported wallet options (MetaMask, WalletConnect, etc.)
- [ ] Closing Dynamic modal without connecting does not cause errors
- [ ] Dynamic session cleaned up properly on page navigation
- [ ] No stale Dynamic wallet state after logout

---

## 13. Search and Filter Tests

### 13.1 Explore Page Filters
- [ ] Text search filters results
- [ ] Track filter works
- [ ] Tech stack filter works
- [ ] Multiple filters combine correctly
- [ ] Clear filters resets view

### 13.2 Admin Table Filters
- [ ] Search filters table rows
- [ ] Dropdown filters work
- [ ] Pagination works (if implemented)

---

## 14. Responsive Design Tests

### 14.1 Mobile Views (< 768px)
- [ ] Dashboard header shows hamburger + logo + notification bell + avatar dropdown
- [ ] Mobile sidebar sheet opens/closes correctly
- [ ] Tables hide non-essential columns
- [ ] Forms are usable
- [ ] Modals fit screen
- [ ] Notification bell popover fits within mobile viewport
- [ ] Wallet connect modal (Dynamic) fits within mobile viewport

### 14.2 Tablet Views (768px - 1024px)
- [ ] Layout adapts properly
- [ ] Sidebar may be collapsed
- [ ] Tables show more columns

### 14.3 Desktop Views (> 1024px)
- [ ] Full layout displayed
- [ ] Sidebar always visible (dashboard)
- [ ] Dashboard header shows notification bell + avatar dropdown on the right
- [ ] Full tables displayed

---

## 15. Error Handling Tests

### 15.1 Network Errors
- [ ] Shows error message on API failure
- [ ] Can retry failed requests
- [ ] Graceful degradation

### 15.2 Form Validation
- [ ] Required fields show errors
- [ ] Email format validated
- [ ] URL format validated
- [ ] Error messages are clear

### 15.3 404 Pages
- [ ] Invalid routes show 404 page
- [ ] 404 has navigation back

---

## 16. Data Integrity Tests

### 16.1 Submission Flow
- [ ] Creating submission updates team's submissions
- [ ] Deleting submission removes from lists
- [ ] Status changes reflect everywhere

### 16.2 Team Management
- [ ] Adding member updates team list
- [ ] Removing member updates counts
- [ ] Team deletion handles submissions

### 16.3 User Role Changes
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
