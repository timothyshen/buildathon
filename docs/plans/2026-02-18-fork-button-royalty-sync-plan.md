# Fork Button + Hybrid Royalty Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Fork this Project" to public pages and fix royalty dashboard to show real on-chain claimable amounts.

**Architecture:** Client component for fork button (embedded in server-rendered project page). New React hook `useClaimableRevenue` queries on-chain royalty vaults via Story SDK. Cron sync simplified to derivative count only.

**Tech Stack:** Next.js 16 App Router, React 19, Story Protocol SDK (`@story-protocol/core-sdk`), viem, Dynamic Labs wallet, Supabase.

**Design doc:** `docs/plans/2026-02-18-fork-button-royalty-sync-design.md`

---

## Task 1: Create ForkProjectButton Component

**Files:**
- Create: `src/components/projects/project-fork-button.tsx`

**Step 1: Create the component**

```tsx
// src/components/projects/project-fork-button.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { GitFork } from "lucide-react";

interface ForkProjectButtonProps {
  submissionId: string;
  createdBy: string;
  teamMemberIds?: string[];
}

export function ForkProjectButton({
  submissionId,
  createdBy,
  teamMemberIds = [],
}: ForkProjectButtonProps) {
  const { user } = useAuth();

  // Owner should not see the fork button
  if (user) {
    const isOwner =
      user.id === createdBy || teamMemberIds.includes(user.id);
    if (isOwner) return null;
  }

  const forkUrl = `/submissions/${submissionId}/fork`;

  // If not authenticated, link to login with redirect
  // The /submissions/[id]/fork route is protected by middleware,
  // which auto-redirects to /login?redirect=/submissions/[id]/fork
  // So we can link directly — middleware handles unauthenticated users.

  return (
    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
      <Link href={forkUrl}>
        <GitFork className="h-4 w-4 mr-2" />
        Fork this Project
      </Link>
    </Button>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds (component is not yet imported anywhere, so tree-shaking removes it)

**Step 3: Commit**

```bash
git add src/components/projects/project-fork-button.tsx
git commit -m "feat: add ForkProjectButton client component"
```

---

## Task 2: Integrate Fork Button into Public Project Page

**Files:**
- Modify: `src/app/projects/[id]/page.tsx` (lines 268-310, IP Registration sidebar section)

**Step 1: Add import and fetch team member IDs**

At the top of `src/app/projects/[id]/page.tsx`, add:
```tsx
import { ForkProjectButton } from "@/components/projects/project-fork-button";
```

**Step 2: Add ForkProjectButton inside the IP Registration section**

In the IP Registration sidebar section (around line 269-310), after the closing `</div>` of the `space-y-3` block (line 308) and before the section closing tag, add the fork button:

```tsx
{/* existing code ends at line ~308 */}
                </div>

                <ForkProjectButton
                  submissionId={submission.id}
                  createdBy={submission.createdBy}
                  teamMemberIds={submission.team?.members.map((m) => m.userId)}
                />
              </section>
```

**Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds

**Step 4: Manual test**

Open a public project page `/projects/[id]` for a submission that has `ipAssetId` set. Verify the "Fork this Project" button appears in the IP Registration sidebar section.

**Step 5: Commit**

```bash
git add src/app/projects/[id]/page.tsx
git commit -m "feat: add fork button to public project page IP section"
```

---

## Task 3: Fix Explore Card Fork Link

**Files:**
- Modify: `src/components/explore/project-card-explore.tsx` (line 139-145)

**Step 1: Update the GitFork link**

The current GitFork link points to `href="#"`. Change it to link to the fork page:

Replace lines 138-145:
```tsx
          {submission.ipAssetId && (
            <Link
              href={`/submissions/${submission.id}/fork`}
              title="Fork on Story Protocol"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitFork className="h-3.5 w-3.5" />
            </Link>
          )}
```

Also add import for `Link` from `next/link` if not already present (it is already imported at line 3).

**Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/explore/project-card-explore.tsx
git commit -m "fix: link explore card fork icon to actual fork page"
```

---

## Task 4: Create useClaimableRevenue Hook

**Files:**
- Create: `src/hooks/use-claimable-revenue.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/use-claimable-revenue.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { getClaimableRevenue } from "@/services/story-protocol/royalties";
import { formatEther } from "viem";

interface ClaimableAsset {
  ipId: string;
  ownerAddress: string;
}

interface UseClaimableRevenueResult {
  /** Map of ipId → claimable WIP amount as a human-readable string (ether units) */
  claimableAmounts: Record<string, string>;
  /** True while on-chain queries are in progress */
  isLoading: boolean;
  /** Manually re-query all assets */
  refresh: () => void;
}

export function useClaimableRevenue(
  ipAssets: ClaimableAsset[],
  walletAddress: string | undefined
): UseClaimableRevenueResult {
  const { primaryWallet } = useDynamicContext();
  const [claimableAmounts, setClaimableAmounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!walletAddress || !primaryWallet || !isEthereumWallet(primaryWallet)) {
      setClaimableAmounts({});
      return;
    }

    // Filter to assets owned by the connected wallet
    const ownedAssets = ipAssets.filter(
      (a) => a.ownerAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (ownedAssets.length === 0) {
      setClaimableAmounts({});
      return;
    }

    let cancelled = false;

    async function queryClaimable() {
      setIsLoading(true);
      try {
        const walletClient =
          (await primaryWallet!.getWalletClient()) as unknown as import("viem").WalletClient;

        const results = await Promise.allSettled(
          ownedAssets.map(async (asset) => {
            const amount = await getClaimableRevenue(
              walletClient,
              asset.ipId,
              walletAddress!
            );
            return { ipId: asset.ipId, amount };
          })
        );

        if (cancelled) return;

        const amounts: Record<string, string> = {};
        for (const result of results) {
          if (result.status === "fulfilled") {
            const { ipId, amount } = result.value;
            // amount is a bigint from the SDK — convert to ether string
            amounts[ipId] = typeof amount === "bigint"
              ? formatEther(amount)
              : String(amount);
          }
        }
        setClaimableAmounts(amounts);
      } catch {
        // Silently fail — claimable will show DB snapshot fallback
        if (!cancelled) setClaimableAmounts({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    queryClaimable();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, primaryWallet, ipAssets.length, refreshKey]);

  return { claimableAmounts, isLoading, refresh };
}
```

**Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/hooks/use-claimable-revenue.ts
git commit -m "feat: add useClaimableRevenue hook for live on-chain royalty queries"
```

---

## Task 5: Integrate useClaimableRevenue into Royalties Page

**Files:**
- Modify: `src/app/(dashboard)/royalties/page.tsx`

**Step 1: Add imports**

Add at the top of the file:
```typescript
import { useClaimableRevenue } from "@/hooks/use-claimable-revenue";
```

**Step 2: Call the hook after ipAssets state**

After line ~117 (after the `walletAddress` declaration), add the hook call:

```typescript
  // Live on-chain claimable revenue query
  const { claimableAmounts, isLoading: claimableLoading } = useClaimableRevenue(
    ipAssets,
    walletAddress
  );
```

**Step 3: Update the aggregate stats to use live claimable**

Replace the `totalClaimable` calculation (lines ~123-130) with:

```typescript
  const totalClaimable = ipAssets.reduce(
    (sum, a) => {
      if (!a.isWalletOwner) return sum;
      // Prefer live on-chain value, fall back to DB snapshot
      const liveAmount = claimableAmounts[a.ipId];
      const snapshotAmount = a.latestSnapshot?.claimableWip || "0";
      return sum + parseFloat(liveAmount ?? snapshotAmount);
    },
    0
  );
```

**Step 4: Update per-asset claimable display**

In the ipAssets.map render (around line ~363), update the `claimable` variable:

Replace:
```typescript
                const claimable = asset.isWalletOwner
                  ? parseFloat(snapshot?.claimableWip || "0")
                  : 0;
```

With:
```typescript
                const liveClaimable = claimableAmounts[asset.ipId];
                const claimable = asset.isWalletOwner
                  ? parseFloat(liveClaimable ?? snapshot?.claimableWip ?? "0")
                  : 0;
```

**Step 5: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/(dashboard)/royalties/page.tsx
git commit -m "feat: integrate live on-chain claimable amounts in royalties page"
```

---

## Task 6: Integrate useClaimableRevenue into IP Detail Page

**Files:**
- Modify: `src/app/(dashboard)/submissions/[id]/ip/page.tsx`

**Step 1: Add imports**

Add at the top:
```typescript
import { useClaimableRevenue } from "@/hooks/use-claimable-revenue";
```

**Step 2: Call the hook**

After the `isWalletOwner` declaration (line ~141), add:

```typescript
  // Live on-chain claimable query
  const { claimableAmounts } = useClaimableRevenue(
    ipAsset ? [{ ipId: ipAsset.ipId, ownerAddress: ipAsset.ownerAddress }] : [],
    walletAddress
  );
```

**Step 3: Update the claimable value**

Replace the `claimable` calculation (line ~301):

```typescript
  const claimable = parseFloat(snapshot?.claimableWip || "0");
```

With:
```typescript
  const liveClaimable = ipAsset ? claimableAmounts[ipAsset.ipId] : undefined;
  const claimable = parseFloat(liveClaimable ?? snapshot?.claimableWip ?? "0");
```

**Step 4: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add "src/app/(dashboard)/submissions/[id]/ip/page.tsx"
git commit -m "feat: integrate live on-chain claimable amounts in IP detail page"
```

---

## Task 7: Clean Up Cron Sync Route

**Files:**
- Modify: `src/app/api/story-protocol/sync-royalties/route.ts` (lines 65-83)

**Step 1: Remove hardcoded revenue/claimable from insert**

Replace the insert block (lines 76-82):

```typescript
          // Insert new snapshot (revenue/claimable are queried client-side)
          await admin.from("royalty_snapshots").insert({
            ip_asset_id: asset.id,
            total_revenue_wip: "0",
            claimable_wip: "0",
            royalty_token_balance: 100,
            derivative_count: count || 0,
          });
```

This stays the same structurally — the `"0"` values are correct defaults for new snapshots. The key change is that the **UI** no longer relies on these values (it uses live on-chain queries from Task 5/6). The cron correctly tracks derivative count, and the default `"0"` is fine as a baseline.

Actually, since the design specifies the cron should only track derivative count, let's update the insert to be clear:

```typescript
          // Insert new snapshot — derivative_count from DB, revenue/claimable queried client-side
          await admin.from("royalty_snapshots").insert({
            ip_asset_id: asset.id,
            total_revenue_wip: "0",
            claimable_wip: "0",
            royalty_token_balance: 100,
            derivative_count: count || 0,
          });
```

No code change needed here — the values were already correct. The fix is in the UI layer (Tasks 5-6) which now overlays live values.

**Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit (only if code changed)**

```bash
git add src/app/api/story-protocol/sync-royalties/route.ts
git commit -m "docs: clarify sync route only tracks derivative count, revenue is client-side"
```

---

## Task 8: Run Tests and Final Build Verification

**Step 1: Run existing unit tests**

Run: `pnpm test`
Expected: All tests pass (story-protocol.test.ts and all others)

**Step 2: Run lint**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Run full production build**

Run: `pnpm build`
Expected: Build succeeds with no type errors

**Step 4: Commit any lint/type fixes**

If any fixes needed:
```bash
git add -A
git commit -m "fix: lint and type fixes for fork button + royalty sync"
```

---

## Summary of Changes

| Task | File | Type | Description |
|------|------|------|-------------|
| 1 | `src/components/projects/project-fork-button.tsx` | Create | Client component for fork button |
| 2 | `src/app/projects/[id]/page.tsx` | Modify | Add fork button in IP section |
| 3 | `src/components/explore/project-card-explore.tsx` | Modify | Fix GitFork link to fork page |
| 4 | `src/hooks/use-claimable-revenue.ts` | Create | Hook for live on-chain claimable queries |
| 5 | `src/app/(dashboard)/royalties/page.tsx` | Modify | Integrate live claimable amounts |
| 6 | `src/app/(dashboard)/submissions/[id]/ip/page.tsx` | Modify | Integrate live claimable amounts |
| 7 | `src/app/api/story-protocol/sync-royalties/route.ts` | Clarify | Document cron scope (no code change) |
| 8 | All | Verify | Tests, lint, build |
