# E2E Test Plan — Story Protocol Integration

**Date:** 2026-02-17
**Framework:** Playwright (`@playwright/test`)
**Branch:** `feature/story-protocol-integration`

## Overview

End-to-end tests covering the Story Protocol IP registration, licensing, fork/derivative, and royalty flows. These tests interact with the full Next.js app and verify UI behavior, API calls, and database state.

## Prerequisites

- Playwright installed and configured (`playwright.config.ts`)
- Test user seeded in Supabase with a submission in `submitted` status
- Dynamic Labs wallet mock or test wallet with Aeneid testnet funds
- Environment variables set: `NEXT_PUBLIC_SPG_NFT_CONTRACT`, Pinata keys, `STORY_RPC_URL`

## Test Suites

---

### Suite 1: PIL License Terms Picker (Step IP)

**File:** `e2e/step-ip.spec.ts`
**Page:** `/submit` (step 5: IP)

#### 1.1 Preset selection renders correct defaults
- Navigate to submission wizard, advance to IP step
- Click "Non-Commercial Remix" preset card
- Verify: commercialUse toggle is OFF, derivativesAllowed is ON, minting fee is "0"
- Click "Commercial Remix" preset card
- Verify: commercialUse toggle is ON, commercialRevShare is 50, minting fee is "1"

#### 1.2 Selecting a preset then editing switches to custom
- Select "Commercial Use" preset
- Change minting fee from "1" to "5"
- Verify: preset selection indicator clears (no card highlighted)
- Verify: advanced settings reflect the manual change

#### 1.3 All four presets populate correct values
- For each preset (`non-commercial-remix`, `commercial-use`, `commercial-remix`, `cc-attribution`):
  - Click preset card
  - Expand Advanced Settings
  - Verify all fields match `getPresetTerms()` output

#### 1.4 IP step is optional — can skip
- Navigate to IP step
- Do not select any preset or terms
- Click "Next" to advance to Review step
- Verify: Review step loads, IP section shows "No license selected" or similar

---

### Suite 2: IP Registration — Post-Submission

**File:** `e2e/ip-registration.spec.ts`
**Page:** `/submissions/[id]`

#### 2.1 Unregistered submission shows registration section
- Navigate to own submission without IP
- Verify: "Register as IP Asset" button visible
- Verify: No IP status card shown

#### 2.2 Registration modal opens with StepIP
- Click "Register as IP Asset"
- Verify: Dialog opens with preset cards and advanced settings
- Select "Commercial Remix" preset
- Verify: "Register" button enabled

#### 2.3 Registration flow completes (mocked wallet)
- Open registration modal, select preset
- Click "Register"
- Verify: Status changes through signing → recording → done
- Verify: Success message with IP Asset ID displayed
- Close modal
- Verify: IP status card now shows IP ID, license badge, tx hash link

#### 2.4 Registration persists after page reload
- Register IP on submission
- Reload page
- Verify: IP status card still shown with correct IP ID and license info

#### 2.5 Non-owner cannot see registration button
- Navigate to another user's unregistered submission
- Verify: No "Register as IP Asset" button visible

---

### Suite 3: Fork / Derivative Flow

**File:** `e2e/fork-flow.spec.ts`
**Page:** `/submissions/[id]/fork`

#### 3.1 Fork button only appears for IP-registered submissions
- Navigate to submission without IP
- Verify: No "Fork this Project" button
- Navigate to submission with IP
- Verify: "Fork this Project" button visible

#### 3.2 Fork page loads with parent info
- Click "Fork this Project"
- Verify: Redirected to `/submissions/[id]/fork`
- Verify: Parent submission info displayed (title, IP ID, license terms)
- Verify: Fork title pre-filled with "Fork of [original title]"

#### 3.3 Cannot fork own submission
- Navigate to own IP-registered submission
- Verify: "Fork this Project" button not shown (or disabled)

#### 3.4 Fork submission + derivative registration (mocked wallet)
- On fork page, fill title and description
- Optionally select license terms
- Click "Fork & Register"
- Verify: Status progresses through creating → uploading → signing → recording → done
- Verify: Redirected to new submission page
- Verify: New submission shows "Forked from [original]" badge
- Verify: New submission has IP registered with parent reference

#### 3.5 Forked submission appears in parent's derivatives
- After forking, navigate to parent submission
- Verify: Derivative count or fork indicator updated

---

### Suite 4: Royalties Dashboard

**File:** `e2e/royalties.spec.ts`
**Page:** `/royalties`

#### 4.1 Dashboard loads with stats for wallet owner
- Navigate to `/royalties` (user with registered IPs)
- Verify: 4 stat tiles visible (Total Revenue, Claimable, Registered IPs, Derivatives)
- Verify: Stat values are numbers (not NaN or undefined)

#### 4.2 IP assets list shows correct data
- Verify: Each registered IP shows submission title, IP ID link, license label
- Verify: IP ID links point to Story Explorer (`aeneid.storyscan.io`)
- Verify: Derivative count matches actual forks

#### 4.3 Empty state for user with no IPs
- Login as user with no registered IPs
- Navigate to `/royalties`
- Verify: Empty state message displayed
- Verify: No stat tiles or asset list shown (or zero values)

#### 4.4 Wallet not connected shows prompt
- Navigate to `/royalties` without wallet connected
- Verify: "Connect Wallet" prompt displayed
- Verify: No stats or assets shown

#### 4.5 Claim button interaction (mocked wallet)
- Navigate to `/royalties` with claimable revenue
- Click "Claim" on an IP asset
- Verify: Button shows loading/pending state
- Verify: After claim, claimable amount refreshes
- Verify: Toast notification shown

---

### Suite 5: Admin IP Registry

**File:** `e2e/admin-ip-registry.spec.ts`
**Page:** `/admin/ip-registry`

#### 5.1 Admin can view all registered IPs
- Login as admin
- Navigate to `/admin/ip-registry`
- Verify: Table shows all IP assets with columns: Submission, IP ID, Owner, Type, Date

#### 5.2 IP ID links to Story Explorer
- Verify: IP ID cells contain links to `aeneid.storyscan.io/ip/[ipId]`

#### 5.3 Derivative vs Root labeling
- Verify: IPs without `parent_ip_id` show "Root"
- Verify: IPs with `parent_ip_id` show "Derivative"

#### 5.4 Sync Royalties button triggers sync
- Click "Sync Royalties" button
- Verify: Button shows loading state
- Verify: Success toast with sync count
- Verify: Button returns to idle state

#### 5.5 Non-admin cannot access
- Login as participant
- Navigate to `/admin/ip-registry`
- Verify: Redirected to dashboard (no access)

---

### Suite 6: API Route Validation

**File:** `e2e/story-protocol-api.spec.ts`

These tests hit the API routes directly (via `request` fixture) rather than through the UI.

#### 6.1 POST /api/story-protocol/metadata — success
- Post valid metadata payload (name, description, image, attributes)
- Verify: 200 response with `ipMetadataURI`, `ipMetadataHash`, `nftMetadataURI`, `nftMetadataHash`
- Verify: URIs start with `https://`
- Verify: Hashes start with `0x`

#### 6.2 POST /api/story-protocol/metadata — unauthenticated
- Post without auth header
- Verify: 401 response

#### 6.3 POST /api/story-protocol/register — ownership check
- Post registration for a submission the user doesn't own
- Verify: 403 response with ownership error

#### 6.4 POST /api/story-protocol/register — success
- Post valid registration payload for owned submission
- Verify: 200 response with `ipAssetId`
- Verify: `ip_assets` row created in DB
- Verify: `ip_license_terms` row created
- Verify: submission `ip_asset_id` updated

#### 6.5 POST /api/story-protocol/derivative — ownership check
- Post derivative for child submission user doesn't own
- Verify: 403 response

#### 6.6 POST /api/story-protocol/sync-royalties — cron auth
- Post without `CRON_SECRET` or admin session
- Verify: 401 response

#### 6.7 POST /api/story-protocol/sync-royalties — admin auth
- Post with admin session cookie
- Verify: 200 response with `{ success: true, synced, total }`

---

### Suite 7: Submission Wizard Integration

**File:** `e2e/submission-wizard-ip.spec.ts`
**Page:** `/submit`

#### 7.1 Full wizard flow with IP step
- Fill Steps 1-4 (Details, Media, Links, Tracks)
- Step 5 (IP): Select "Commercial Remix" preset
- Step 6 (Review): Verify IP section shows "Commercial Remix" summary
- Submit
- Verify: Submission created with `pilTerms` and `pilPreset` stored

#### 7.2 Wizard saves IP draft to localStorage
- Navigate to wizard, advance to IP step
- Select a preset
- Close browser / navigate away
- Return to `/submit`
- Verify: IP step still has the preset selected (loaded from localStorage)

#### 7.3 Wizard without IP step
- Complete Steps 1-4, skip Step 5 (no preset selected)
- Submit at Review step
- Verify: Submission created without IP fields

---

## Test Infrastructure

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5567",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5567",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Utilities

```typescript
// e2e/fixtures/auth.ts
// - loginAsParticipant(page) — seed test participant, set Supabase session cookie
// - loginAsAdmin(page) — seed test admin, set session cookie
// - connectWallet(page) — mock Dynamic Labs wallet connection

// e2e/fixtures/seed.ts
// - seedSubmission(status) — create test submission in DB
// - seedIpAsset(submissionId) — create IP asset record
// - seedRoyaltySnapshot(ipAssetId) — create royalty data
// - cleanup() — remove test data after suite
```

### Wallet Mocking Strategy

Story Protocol on-chain calls require a wallet. For E2E tests:

1. **Mock at service layer** — Intercept `registerSubmissionAsIp()` and `registerDerivativeIp()` to return fake responses without hitting chain
2. **Mock at network layer** — Use Playwright route interception to mock RPC calls
3. **Use test wallet** — Pre-funded Aeneid testnet wallet for real on-chain tests (slow, flaky, use sparingly)

Recommended: Option 1 for most tests, Option 3 for a single smoke test per suite.

### Environment

| Variable | Test Value |
|----------|-----------|
| `NEXT_PUBLIC_SPG_NFT_CONTRACT` | Aeneid test contract |
| `PINATA_JWT` | Test Pinata API key |
| `STORY_RPC_URL` | `https://aeneid.storyrpc.io` |
| `CRON_SECRET` | `test-cron-secret` |

### npm Scripts

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:story": "playwright test e2e/ip-registration.spec.ts e2e/fork-flow.spec.ts e2e/royalties.spec.ts"
}
```

## Priority Order

1. **Suite 2** (IP Registration) — Core flow, most value
2. **Suite 6** (API Routes) — Fast, no wallet mocking needed for auth tests
3. **Suite 3** (Fork/Derivative) — Second most complex flow
4. **Suite 4** (Royalties Dashboard) — Read-heavy, straightforward
5. **Suite 1** (Step IP) — Form interactions
6. **Suite 7** (Wizard Integration) — Full flow
7. **Suite 5** (Admin) — Lower priority, admin-only
