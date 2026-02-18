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
  claimableAmounts: Record<string, string>;
  isLoading: boolean;
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
            amounts[ipId] = typeof amount === "bigint"
              ? formatEther(amount)
              : String(amount);
          }
        }
        setClaimableAmounts(amounts);
      } catch {
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
