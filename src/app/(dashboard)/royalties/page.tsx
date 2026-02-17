"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { ipAssetsService, submissionsService } from "@/services";
import { claimAllRevenue } from "@/services/story-protocol/royalties";
import { STORY_EXPLORER_URL } from "@/services/story-protocol/constants";
import { Button } from "@/components/ui/button";
import { Coins, Shield, GitFork, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { IpAsset, RoyaltySnapshot, Submission } from "@/types";
import Link from "next/link";

function truncateAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatWip(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

interface IpAssetWithData extends IpAsset {
  submission?: Submission;
  royaltySnapshot?: RoyaltySnapshot | null;
  licenseLabel?: string;
}

export default function RoyaltiesPage() {
  const { user } = useAuth();
  const { primaryWallet } = useDynamicContext();

  const [ipAssets, setIpAssets] = useState<IpAssetWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingIpId, setClaimingIpId] = useState<string | null>(null);

  // Aggregate stats
  const totalRevenue = ipAssets.reduce(
    (sum, a) => sum + parseFloat(a.royaltySnapshot?.totalRevenueWip || "0"),
    0
  );
  const totalClaimable = ipAssets.reduce(
    (sum, a) => sum + parseFloat(a.royaltySnapshot?.claimableWip || "0"),
    0
  );
  const totalDerivatives = ipAssets.reduce(
    (sum, a) => sum + (a.royaltySnapshot?.derivativeCount || 0),
    0
  );

  const walletAddress = user?.walletAddress;

  // Load IP assets with their snapshots and submission titles
  useEffect(() => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const res = await ipAssetsService.getAllForOwner(walletAddress!);
        if (!res.success || res.data.length === 0) {
          setIpAssets([]);
          return;
        }

        // Fetch snapshots and submissions in parallel for each IP asset
        const enriched = await Promise.all(
          res.data.map(async (asset) => {
            const [snapshotRes, submissionRes, licenseRes] = await Promise.all([
              ipAssetsService.getLatestRoyaltySnapshot(asset.id),
              submissionsService.getById(asset.submissionId),
              ipAssetsService.getLicenseTerms(asset.id),
            ]);

            // Derive a short license label from the first license terms
            let licenseLabel = "No license";
            if (licenseRes.success && licenseRes.data.length > 0) {
              const terms = licenseRes.data[0];
              if (terms.commercialUse && terms.derivativesAllowed) {
                licenseLabel = `Commercial Remix (${terms.commercialRevShare}%)`;
              } else if (terms.commercialUse) {
                licenseLabel = "Commercial Use";
              } else if (terms.derivativesAllowed) {
                licenseLabel = "Non-Commercial Remix";
              } else {
                licenseLabel = "Non-Commercial";
              }
            }

            return {
              ...asset,
              submission: submissionRes.success ? submissionRes.data ?? undefined : undefined,
              royaltySnapshot: snapshotRes.success ? snapshotRes.data : null,
              licenseLabel,
            } as IpAssetWithData;
          })
        );

        setIpAssets(enriched);
      } catch {
        toast.error("Failed to load IP assets");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [walletAddress]);

  const handleClaim = useCallback(
    async (asset: IpAssetWithData) => {
      if (!primaryWallet) {
        toast.error("Please connect your wallet first");
        return;
      }
      if (!isEthereumWallet(primaryWallet)) {
        toast.error("Please connect an Ethereum wallet");
        return;
      }

      setClaimingIpId(asset.ipId);
      try {
        const walletClient = (await primaryWallet.getWalletClient()) as unknown as import("viem").WalletClient;

        // Collect child IP IDs (derivatives of this asset)
        const derivativesRes = await ipAssetsService.getDerivatives(asset.ipId);
        const childIpIds = derivativesRes.success
          ? derivativesRes.data.map((d) => d.ipId)
          : [];

        // royaltyPolicies can be empty array — the SDK fetches them on-chain
        await claimAllRevenue(
          walletClient,
          asset.ipId,
          walletAddress!,
          childIpIds
        );

        toast.success("Revenue claimed successfully!");

        // Refresh snapshot for this asset
        const snapshotRes = await ipAssetsService.getLatestRoyaltySnapshot(asset.id);
        if (snapshotRes.success) {
          setIpAssets((prev) =>
            prev.map((a) =>
              a.id === asset.id
                ? { ...a, royaltySnapshot: snapshotRes.data }
                : a
            )
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to claim revenue";
        toast.error(message);
      } finally {
        setClaimingIpId(null);
      }
    },
    [primaryWallet, walletAddress]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No wallet connected
  if (!walletAddress) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Royalties</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your IP assets and revenue on Story Protocol
          </p>
        </div>
        <div className="rounded-xl border py-12 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="text-sm mt-3">No wallet connected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect a wallet in{" "}
            <Link href="/settings" className="underline hover:text-foreground">
              Settings
            </Link>{" "}
            to view your IP assets and royalties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Royalties</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your IP assets and revenue on Story Protocol
        </p>
      </div>

      {/* Stats Strip — 4 Bento tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <Coins className="h-4 w-4 text-emerald-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-emerald-600">
              {formatWip(totalRevenue.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Revenue (WIP)
            </p>
          </div>
        </div>

        {/* Claimable */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <Coins className="h-4 w-4 text-amber-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-amber-600">
              {formatWip(totalClaimable.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Claimable (WIP)
            </p>
          </div>
        </div>

        {/* Registered IPs */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <Shield className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-blue-600">
              {ipAssets.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered IPs
            </p>
          </div>
        </div>

        {/* Derivatives */}
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <GitFork className="h-4 w-4 text-violet-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-violet-600">
              {totalDerivatives}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Derivatives</p>
          </div>
        </div>
      </div>

      {/* IP Assets List */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Your IP Assets
        </h2>

        {ipAssets.length === 0 ? (
          <div className="rounded-xl border py-12 text-center">
            <Shield className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
            <p className="text-sm mt-3">No IP assets registered</p>
            <p className="text-xs text-muted-foreground mt-1">
              Register IP on your submissions to start earning royalties.
            </p>
            <Button variant="ghost" size="sm" className="mt-4" asChild>
              <Link href="/submissions">Go to Submissions</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {ipAssets.map((asset) => {
              const snapshot = asset.royaltySnapshot;
              const revenue = parseFloat(snapshot?.totalRevenueWip || "0");
              const claimable = parseFloat(snapshot?.claimableWip || "0");
              const derivatives = snapshot?.derivativeCount || 0;
              const isClaiming = claimingIpId === asset.ipId;

              return (
                <div
                  key={asset.id}
                  className="rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Desktop layout */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Left: Title + IP ID + License */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/submissions/${asset.submissionId}`}
                          className="text-sm font-medium hover:underline truncate"
                        >
                          {asset.submission?.title || "Untitled Submission"}
                        </Link>
                        {asset.parentIpId && (
                          <GitFork className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`${STORY_EXPLORER_URL}/address/${asset.ipId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          {truncateAddress(asset.ipId)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {asset.licenseLabel}
                        </span>
                      </div>
                    </div>

                    {/* Right: Stats + Claim button */}
                    <div className="flex items-center gap-4 md:gap-6 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GitFork className="h-3 w-3" />
                        <span className="font-mono tabular-nums">
                          {derivatives}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-semibold tabular-nums text-emerald-600">
                          {formatWip(revenue.toString())} WIP
                        </div>
                        {claimable > 0 && (
                          <div className="text-xs font-mono tabular-nums text-amber-600">
                            {formatWip(claimable.toString())} claimable
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={claimable <= 0 || isClaiming || !primaryWallet}
                        onClick={() => handleClaim(asset)}
                        className="text-xs"
                      >
                        {isClaiming ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Claim
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
