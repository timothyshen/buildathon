# Design: Fork Button on Public Pages + Hybrid Royalty Sync

**Date**: 2026-02-18
**Branch**: feature/story-protocol-integration

## Overview

Two features to support E2E testing of the Story Protocol integration:

1. **Fork button on public project page** — Let anyone (authenticated) fork a registered IP submission from the public `/projects/[id]` page and explore card
2. **Hybrid royalty sync** — Client-side live `getClaimableRevenue()` queries for real-time claimable amounts, server-side cron for derivative count only

---

## Feature 1: Fork Button on Public Pages

### Problem

The "Fork this Project" button currently only appears in the authenticated submission detail sidebar (`/submissions/[id]`). Non-owners browsing the public project page (`/projects/[id]`) or explore grid have no way to fork.

### Solution

#### New Component: `src/components/projects/project-fork-button.tsx`

Client component (`"use client"`) that renders conditionally:

- **Not authenticated**: "Fork this Project" button → redirects to `/login?returnTo=/submissions/{submissionId}/fork`
- **Authenticated, not owner**: "Fork this Project" button → links to `/submissions/{submissionId}/fork`
- **Authenticated, is owner**: Hidden (no button rendered)

Props: `{ submissionId: string }`

Uses `useAuth()` for user identity and ownership check.

#### Integration Points

1. **`/projects/[id]/page.tsx`** — Inside the existing "IP Registration" sidebar `<section>`, add `<ForkProjectButton>` below the registration details
2. **`project-card-explore.tsx`** — Update the GitFork icon (currently links to `#`) to link to `/submissions/{id}/fork` or `/login?returnTo=...`

---

## Feature 2: Hybrid Royalty Sync

### Problem

The royalty sync cron (`POST /api/story-protocol/sync-royalties`) hardcodes `total_revenue_wip` and `claimable_wip` to `"0"`. The UI always shows 0 WIP even when royalties are claimable on-chain.

### Solution

#### 2a. New Hook: `src/hooks/use-claimable-revenue.ts`

```typescript
interface UseClaimableRevenueResult {
  claimableAmounts: Record<string, string>; // ipId → claimable WIP (ether units)
  isLoading: boolean;
  refresh: () => void;
}

function useClaimableRevenue(
  ipAssets: { ipId: string; ownerAddress: string }[],
  walletAddress: string | undefined
): UseClaimableRevenueResult
```

Behavior:
- Requires connected Ethereum wallet via Dynamic Labs
- Filters to assets where `ownerAddress === walletAddress` (only query your own IPs)
- Calls `getClaimableRevenue(walletClient, ipId, walletAddress)` for each
- Uses `Promise.allSettled` for resilience (individual failures don't block others)
- Returns map of `ipId → claimable amount` as string in ether units
- Re-queries when `walletAddress` or asset list changes

#### 2b. Integration in UI

**`/royalties/page.tsx`**:
- Call `useClaimableRevenue(ipAssets, walletAddress)`
- Overlay `claimableAmounts[asset.ipId]` on top of snapshot's `claimableWip`
- Update stats tile "Claimable (WIP)" to use live on-chain sum

**`/submissions/[id]/ip/page.tsx`**:
- Same pattern, but for a single IP asset

#### 2c. Cron Sync Cleanup

In `src/app/api/story-protocol/sync-royalties/route.ts`:
- Remove `total_revenue_wip: "0"` and `claimable_wip: "0"` from insert
- Only upsert `derivative_count` and `snapshot_at`
- Keep existing auth (cron secret or admin session)

### Data Flow

| Data | Source | Freshness |
|------|--------|-----------|
| Derivative count | Cron → `royalty_snapshots` DB | Per sync interval |
| Claimable WIP | Client → `getClaimableRevenue()` on-chain | Real-time per page load |
| Total revenue | Client-side (same query) or omit | Real-time |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/projects/project-fork-button.tsx` | **New** — Client component for fork button |
| `src/app/projects/[id]/page.tsx` | Add `<ForkProjectButton>` in IP sidebar section |
| `src/components/explore/project-card-explore.tsx` | Fix GitFork link from `#` to actual fork URL |
| `src/hooks/use-claimable-revenue.ts` | **New** — Hook for live on-chain claimable queries |
| `src/app/(dashboard)/royalties/page.tsx` | Integrate `useClaimableRevenue` hook |
| `src/app/(dashboard)/submissions/[id]/ip/page.tsx` | Integrate `useClaimableRevenue` hook |
| `src/app/api/story-protocol/sync-royalties/route.ts` | Remove hardcoded revenue/claimable values |

## Testing Plan

Manual E2E test with 2 accounts + 2 wallets on Aeneid testnet:

1. Account A registers IP with "Commercial Remix" (50% rev share, 1 WIP minting fee)
2. Account B navigates to public project page, clicks "Fork this Project"
3. Account B completes fork flow (creates derivative submission + on-chain derivative IP)
4. Account A visits `/royalties` — derivative count shows 1, claimable WIP shows real on-chain value
5. Account A clicks "Claim" — revenue claimed successfully
