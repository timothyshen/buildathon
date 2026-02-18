"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { ipAssetsService } from "@/services";
import type { IpAssetWithDetails } from "@/services/ip-assets.service";
import { claimAllRevenue } from "@/services/story-protocol/royalties";
import { useClaimableRevenue } from "@/hooks/use-claimable-revenue";
import { getIpExplorerUrl, getTxExplorerUrl } from "@/services/story-protocol/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Shield,
  GitFork,
  ExternalLink,
  Loader2,
  Info,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
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

interface IpAssetDisplay extends IpAssetWithDetails {
  licenseLabel: string;
  isWalletOwner: boolean;
}

function deriveLicenseLabel(asset: IpAssetWithDetails): string {
  if (asset.licenseTerms.length === 0) return "No license";
  const terms = asset.licenseTerms[0];
  if (terms.commercialUse && terms.derivativesAllowed) {
    return `Commercial Remix (${terms.commercialRevShare}%)`;
  } else if (terms.commercialUse) {
    return "Commercial Use";
  } else if (terms.derivativesAllowed) {
    return "Non-Commercial Remix";
  }
  return "Non-Commercial";
}

const licenseDescriptions: Record<
  string,
  { summary: string; permissions: string[]; restrictions: string[] }
> = {
  "Non-Commercial Remix": {
    summary: "Free to remix, no commercial use.",
    permissions: [
      "Remix and create derivatives",
      "Attribution required",
      "Derivatives must use same terms",
    ],
    restrictions: ["No commercial use", "No minting fee"],
  },
  "Commercial Use": {
    summary: "Licensed for commercial use, no derivatives.",
    permissions: ["Commercial use allowed", "Transferable license"],
    restrictions: [
      "No derivatives or remixes",
      "Minting fee required (1 WIP)",
    ],
  },
  "Commercial Remix": {
    summary: "Commercial use with remix rights and revenue sharing.",
    permissions: [
      "Commercial use allowed",
      "Remix and create derivatives",
      "Transferable license",
    ],
    restrictions: [
      "Revenue share to original creator",
      "Minting fee required (1 WIP)",
      "Attribution required",
    ],
  },
  "CC Attribution": {
    summary: "Free to use commercially and remix with attribution.",
    permissions: [
      "Commercial use allowed",
      "Free to remix",
      "No minting fee",
      "Transferable license",
    ],
    restrictions: ["Attribution required", "Derivatives must use same terms"],
  },
};

export default function RoyaltiesPage() {
  const { user } = useAuth();
  const { primaryWallet } = useDynamicContext();

  const [ipAssets, setIpAssets] = useState<IpAssetDisplay[]>([]);
  const [forkedAssets, setForkedAssets] = useState<IpAssetDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingIpId, setClaimingIpId] = useState<string | null>(null);

  const walletAddress = user?.walletAddress;

  const { claimableAmounts, isLoading: claimableLoading } = useClaimableRevenue(
    ipAssets,
    walletAddress
  );

  // Aggregate stats
  const totalRevenue = ipAssets.reduce(
    (sum, a) => sum + parseFloat(a.latestSnapshot?.totalRevenueWip || "0"),
    0
  );
  const totalClaimable = ipAssets.reduce(
    (sum, a) => {
      if (!a.isWalletOwner) return sum;
      const liveAmount = claimableAmounts[a.ipId];
      const snapshotAmount = a.latestSnapshot?.claimableWip || "0";
      return sum + parseFloat(liveAmount ?? snapshotAmount);
    },
    0
  );
  const totalDerivatives = ipAssets.reduce(
    (sum, a) => sum + (a.latestSnapshot?.derivativeCount || 0),
    0
  );

  // Load IP assets for the user's submissions
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const [ownedRes, forkedRes] = await Promise.all([
          ipAssetsService.getAllForUserSubmissions(user!.id),
          ipAssetsService.getForkedByUser(user!.id),
        ]);

        if (ownedRes.success) {
          // Filter out forked assets from owned list (they appear in purchased section)
          const forkedIds = new Set(
            (forkedRes.success ? forkedRes.data : []).map((a) => a.id)
          );
          setIpAssets(
            ownedRes.data
              .filter((a) => !forkedIds.has(a.id))
              .map((asset) => ({
                ...asset,
                licenseLabel: deriveLicenseLabel(asset),
                isWalletOwner: walletAddress
                  ? asset.ownerAddress.toLowerCase() ===
                    walletAddress.toLowerCase()
                  : false,
              }))
          );
        }

        if (forkedRes.success) {
          setForkedAssets(
            forkedRes.data.map((asset) => ({
              ...asset,
              licenseLabel: deriveLicenseLabel(asset),
              isWalletOwner: walletAddress
                ? asset.ownerAddress.toLowerCase() ===
                  walletAddress.toLowerCase()
                : false,
            }))
          );
        }
      } catch {
        toast.error("Failed to load IP assets");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user?.id, walletAddress]);

  const handleClaim = useCallback(
    async (asset: IpAssetDisplay) => {
      if (!primaryWallet) {
        toast.error("Please connect your wallet first");
        return;
      }
      if (!isEthereumWallet(primaryWallet)) {
        toast.error("Please connect an Ethereum wallet");
        return;
      }
      if (!walletAddress) return;

      setClaimingIpId(asset.ipId);
      try {
        const walletClient =
          (await primaryWallet.getWalletClient()) as unknown as import("viem").WalletClient;

        // Collect child IP IDs (derivatives of this asset)
        const derivativesRes = await ipAssetsService.getDerivatives(
          asset.ipId
        );
        const childIpIds = derivativesRes.success
          ? derivativesRes.data.map((d) => d.ipId)
          : [];

        await claimAllRevenue(
          walletClient,
          asset.ipId,
          walletAddress,
          childIpIds
        );

        toast.success("Revenue claimed successfully!");

        // Refresh snapshot for this asset
        const snapshotRes = await ipAssetsService.getLatestRoyaltySnapshot(
          asset.id
        );
        if (snapshotRes.success) {
          setIpAssets((prev) =>
            prev.map((a) =>
              a.id === asset.id
                ? { ...a, latestSnapshot: snapshotRes.data }
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

  return (
    <div className="space-y-10">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">IP &amp; Royalties</h1>

      {ipAssets.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border py-12 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="text-sm mt-3">No IP assets registered yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Register IP on your submissions to protect your work and earn
            royalties.
          </p>
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link href="/submissions">Go to Submissions</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Stats Strip — 4 Bento tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <p className="text-xs text-muted-foreground mt-1">
                  Derivatives
                </p>
              </div>
            </div>

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
          </div>

          {/* Wallet info banner */}
          {!walletAddress && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              <Wallet className="h-4 w-4 shrink-0" />
              <p className="text-sm flex-1">
                Connect a wallet in{" "}
                <Link
                  href="/settings"
                  className="underline hover:text-foreground"
                >
                  Settings
                </Link>{" "}
                to claim revenue from your IP assets.
              </p>
            </div>
          )}

          {/* IP Assets List */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
              Your IP Assets
            </h2>

            <div className="space-y-2">
              {ipAssets.map((asset) => {
                const snapshot = asset.latestSnapshot;
                const revenue = parseFloat(
                  snapshot?.totalRevenueWip || "0"
                );
                const liveClaimable = claimableAmounts[asset.ipId];
                const claimable = asset.isWalletOwner
                  ? parseFloat(liveClaimable ?? snapshot?.claimableWip ?? "0")
                  : 0;
                const derivatives = snapshot?.derivativeCount || 0;
                const isClaiming = claimingIpId === asset.ipId;
                const terms = asset.licenseTerms[0];
                const licenseInfo =
                  licenseDescriptions[asset.licenseLabel.replace(/ \(\d+%\)$/, "")];

                return (
                  <div
                    key={asset.id}
                    className="rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      {/* Left: Title + IP ID + License */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/submissions/${asset.submissionId}`}
                            className="text-sm font-medium hover:underline truncate"
                          >
                            {asset.submissionTitle}
                          </Link>
                          {asset.parentIpId && (
                            <GitFork className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <a
                            href={getIpExplorerUrl(asset.ipId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            {truncateAddress(asset.ipId)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground inline-flex items-center gap-1 cursor-help">
                                  {asset.licenseLabel}
                                  <Info className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              {licenseInfo ? (
                                <TooltipContent
                                  side="bottom"
                                  className="max-w-[260px] p-3 space-y-2"
                                >
                                  <p className="font-medium text-xs">
                                    {licenseInfo.summary}
                                  </p>
                                  <div>
                                    <p className="text-[10px] text-emerald-300 font-medium mb-0.5">
                                      Allowed
                                    </p>
                                    <ul className="text-[10px] space-y-0.5">
                                      {licenseInfo.permissions.map((p) => (
                                        <li key={p}>+ {p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-amber-300 font-medium mb-0.5">
                                      Conditions
                                    </p>
                                    <ul className="text-[10px] space-y-0.5">
                                      {licenseInfo.restrictions.map((r) => (
                                        <li key={r}>- {r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </TooltipContent>
                              ) : (
                                <TooltipContent side="bottom">
                                  <p className="text-xs">
                                    Custom license terms
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {terms && (
                            <a
                              href={getTxExplorerUrl(asset.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
                            >
                              tx {asset.txHash.slice(0, 8)}...
                            </a>
                          )}
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
                        {asset.isWalletOwner ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={
                              claimable <= 0 ||
                              isClaiming ||
                              !primaryWallet
                            }
                            onClick={() => handleClaim(asset)}
                            className="text-xs"
                          >
                            {isClaiming ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Claim
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 cursor-help">
                                  <Wallet className="h-3 w-3" />
                                  Other
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">
                                  Claimed by {truncateAddress(asset.ownerAddress)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* License terms detail row */}
                    {terms && (
                      <div className="mt-2 pt-2 border-t flex flex-wrap gap-x-4 gap-y-1">
                        <span className="text-[11px] text-muted-foreground">
                          Commercial:{" "}
                          <span className="text-foreground">
                            {terms.commercialUse ? "Yes" : "No"}
                          </span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Derivatives:{" "}
                          <span className="text-foreground">
                            {terms.derivativesAllowed ? "Yes" : "No"}
                          </span>
                        </span>
                        {terms.commercialRevShare > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            Rev Share:{" "}
                            <span className="text-foreground font-mono">
                              {terms.commercialRevShare}%
                            </span>
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          Minting Fee:{" "}
                          <span className="text-foreground font-mono">
                            {terms.defaultMintingFee} WIP
                          </span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Transferable:{" "}
                          <span className="text-foreground">
                            {terms.transferable ? "Yes" : "No"}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Purchased Licenses — projects the user forked from others */}
      {forkedAssets.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            Purchased Licenses
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Projects you forked and registered as derivative IP.
          </p>
          <div className="space-y-2">
            {forkedAssets.map((asset) => {
              const terms = asset.licenseTerms[0];
              const licenseInfo =
                licenseDescriptions[
                  asset.licenseLabel.replace(/ \(\d+%\)$/, "")
                ];

              return (
                <div
                  key={asset.id}
                  className="rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Left: Title + parent IP + License */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <GitFork className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Link
                          href={`/submissions/${asset.submissionId}`}
                          className="text-sm font-medium hover:underline truncate"
                        >
                          {asset.submissionTitle}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <a
                          href={getIpExplorerUrl(asset.ipId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          {truncateAddress(asset.ipId)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {asset.parentIpId && (
                          <span className="text-[11px] text-muted-foreground">
                            forked from{" "}
                            <a
                              href={getIpExplorerUrl(asset.parentIpId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono hover:text-foreground"
                            >
                              {truncateAddress(asset.parentIpId)}
                            </a>
                          </span>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 cursor-help">
                                {asset.licenseLabel}
                                <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            {licenseInfo ? (
                              <TooltipContent
                                side="bottom"
                                className="max-w-[260px] p-3 space-y-2"
                              >
                                <p className="font-medium text-xs">
                                  {licenseInfo.summary}
                                </p>
                                <div>
                                  <p className="text-[10px] text-emerald-300 font-medium mb-0.5">
                                    Allowed
                                  </p>
                                  <ul className="text-[10px] space-y-0.5">
                                    {licenseInfo.permissions.map((p) => (
                                      <li key={p}>+ {p}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-[10px] text-amber-300 font-medium mb-0.5">
                                    Conditions
                                  </p>
                                  <ul className="text-[10px] space-y-0.5">
                                    {licenseInfo.restrictions.map((r) => (
                                      <li key={r}>- {r}</li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            ) : (
                              <TooltipContent side="bottom">
                                <p className="text-xs">
                                  Custom license terms
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Right: manage link */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {asset.registeredAt.toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/submissions/${asset.submissionId}/ip`}>
                          Manage
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* License terms detail row */}
                  {terms && (
                    <div className="mt-2 pt-2 border-t flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-[11px] text-muted-foreground">
                        Commercial:{" "}
                        <span className="text-foreground">
                          {terms.commercialUse ? "Yes" : "No"}
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Derivatives:{" "}
                        <span className="text-foreground">
                          {terms.derivativesAllowed ? "Yes" : "No"}
                        </span>
                      </span>
                      {terms.commercialRevShare > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          Rev Share:{" "}
                          <span className="text-foreground font-mono">
                            {terms.commercialRevShare}%
                          </span>
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        Minting Fee:{" "}
                        <span className="text-foreground font-mono">
                          {terms.defaultMintingFee} WIP
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
