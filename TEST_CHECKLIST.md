# Fix Branch Test Checklist

**Branch:** `fix/login-error-message`
**Total fixes:** 28

---

## Authentication & Account

- ++**Login error message**++ — Enter a non-existent email and password → should show "No account found with this email or password is incorrect" instead of "Invalid login credentials"
- ++**Delete account**++ — Go to Settings → click "Delete Account" → confirm in dialog → account should be deleted and redirected to login
- ++**API session stability**++ — API routes (reviews, sponsor save, etc.) should not randomly log the user out mid-session

## Footer & Links

- ++**Footer links**++ — Scroll to footer → verify Twitter links to `https://x.com/StoryEngs` and Discord links to `https://discord.gg/PV5jzhW8sc`

## Cohort Detail Page

- ++**Sponsor avatars**++ — Open a cohort detail page with sponsors → sponsor logos should show (with first-letter fallback if no logo)
- ++**Timeline status**++ — Open a cohort whose end date has passed → status should show "Completed" not "Active"
- ++**Cohort description rendering**++ — Open a cohort detail page → description should render as rich text without garbled "/" characters

## Explore / Project Pages

- ++**Share button**++ — Open a project detail page → click "Share" → URL should be copied to clipboard with toast confirmation
- ++**View Code/Video buttons**++ — On project detail page → "View Code" and "View Video" buttons should be clearly visible (white text, not grey)
- ++**Search filter accuracy**++ — Go to Explore → search for a project by partial words, tech stack, or team name → results should match accurately

## Registration

- ++**Register without invite**++ — Go to `/register?invite=invalid_token` → click "Register without invite" → error state should clear and show normal registration form

## Learning Resources

- ++**Submit Content button**++ — Go to `/resources` → click "Submit Workshop Content" → should navigate to `/sponsor/workshops/new`
- ++**Button styling consistency**++ — On a resource with both "Watch Video" and "Read Guide" → both buttons should have consistent styling (Read Guide always outline)

## Workshops

- ++**Expired workshops**++ — Open workshop month view → past workshops should appear dimmed with line-through text; workshop cards for past events should show "Ended" badge with no RSVP button or calendar dropdown
- ++**Workshop tag colors**++ — Month view → category tags should have vibrant colors (emerald for basics, violet for advanced, blue for business) not washed-out pastels
- **Workshop attendee count** — RSVP'd workshops should display attendee count on cards and in the detail modal

## Sponsor Role

- ++**Save description**++ — Log in as sponsor → go to cohort page → edit description → click Save → should save successfully (no error)
- ++**Review access**++ — Log in as sponsor → go to Track Reviews → click "Review" on a submission → should create review and navigate to review page (no error)
- ++**Submit review scores**++ — As sponsor on review page → fill in all scores and feedback → click "Submit Review" → should save successfully

## Admin Role

- ++**Admin judges filter**++ — Admin → Judges page → list should show both users with "judge" role AND "admin" role
- ++**Admin workshop save/delete**++ — Admin → Workshops → click edit on a workshop → change title/description → click "Save" → changes persist; click "Delete" → workshop is removed
- ++**Admin judge invitation**++ — Admin → Judges → "Add Judge" → enter an existing user's email → user should be assigned judge role (not "invitation sent")
- ++**Admin sponsor invite wording**++ — Admin → Sponsors → invite form should say "Assign the sponsor role" (not "Send invitation email")
- ++**Admin prize pool limit**++ — Admin → Edit Cohort → for each sponsor, set a "Prize Limit" value → save → value persists on reload

## Submission Detail Page

- ++**Rich text description**++ — Open a submission detail page → About section should render formatted text (no stray `</p>` tags)
- ++**Multiple tracks**++ — Edit a submission and select 2 tracks → view submission detail → both tracks should appear in the sidebar
- **Delete draft submission** — Open a submission in "draft" status → click Delete (trash icon) → confirm in dialog → submission should be deleted and redirect to /submissions

## Team Invitations

- ++**Copy invite link**++ — As team lead, invite a member → next to the pending invite, click "Copy Link" → link should be copied to clipboard
- **Join via invite link** — As another user, visit the copied invite link → should join the team successfully

## Traction / Google Analytics

- ++**GA connect button**++ — Go to a submission's Traction → Settings tab → click "Connect Google Analytics" → should either start OAuth flow (if credentials configured) or show clear error message "Google Analytics integration is not configured"

