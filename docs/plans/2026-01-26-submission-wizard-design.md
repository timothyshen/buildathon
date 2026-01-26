# Submission Wizard Design

## Goal

Convert the single-page submission form into a multi-step wizard with auto-save.

## Step Flow

4 visible steps (IP step built but hidden):

1. **Project Details** - title (required), tagline, description (required, rich text)
2. **Links & Tech** - demo/repo/video/presentation URLs, tech stack tags, Story Protocol checkbox
3. **Cohort & Tracks** - cohort selection, track selection with prizes/sponsors
4. **Review & Submit** - read-only summary with edit buttons, final submit

Hidden: **IP Registration** - license type selection (enable via feature flag later)

## Navigation

- Linear flow with Back/Next buttons
- Progress indicator at top (step number, label, checkmark for completed)
- "Next" validates current step before proceeding
- "Save & Exit" link to save draft and return to submissions list

## State Management

Single state object for all form data:

```ts
interface SubmissionDraft {
  // Step 1
  title: string;
  tagline: string;
  description: string;
  // Step 2
  demoUrl: string;
  repoUrl: string;
  videoUrl: string;
  presentationUrl: string;
  techStack: string[];
  builtWithStory: boolean;
  // Step 3
  cohortId: string;
  trackIds: string[];
  // Step 4 (hidden)
  licenseType: string;
  // Meta
  currentStep: number;
}
```

## File Structure

```
src/app/(dashboard)/submit/
  page.tsx                    # Wizard container, state, navigation
  components/
    step-indicator.tsx        # Progress stepper UI
    step-details.tsx          # Step 1
    step-links-tech.tsx       # Step 2
    step-tracks.tsx           # Step 3
    step-ip.tsx               # Step 4 (hidden)
    step-review.tsx           # Final review
```

## Validation

| Step | Required | Rules |
|------|----------|-------|
| Details | title, description | title min 3 chars, description min 50 chars |
| Links & Tech | none | URL format if provided |
| Tracks | cohortId, trackIds | At least one track if tracks exist |
| IP | none | Optional |

Inline error messages, Next disabled until valid, toast on validation failure.

## Auto-Save

- Storage key: `submission-draft`
- Triggers: step navigation, field blur, every 30s if dirty
- Cleared on successful submission

## Draft Recovery

On page load:
1. Check localStorage for draft
2. If found → "Resume draft?" banner with Continue/Start Fresh
3. Restore to last `currentStep` on Continue

## Edge Cases

- Cohort no longer active → warning, pick new cohort
- Track deleted → remove from selection, show info message
