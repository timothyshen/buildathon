"use client";

import type { WalletClient } from "viem";
import { getStoryClient } from "./client";
import { SPG_NFT_CONTRACT } from "./constants";

interface DerivativeResult {
  childIpId: string;
  tokenId: string;
  txHash: string;
}

/**
 * Mints a new NFT and registers it as a derivative IP asset linked to
 * a parent IP via the specified license terms. Uses the SDK's unified
 * `registerDerivativeIpAsset` entry point which automatically selects
 * the optimal workflow (mintAndRegisterIpAndMakeDerivative).
 */
export async function registerDerivativeIp(
  walletClient: WalletClient,
  parentIpId: string,
  licenseTermsId: string,
  metadata: {
    ipMetadataURI: string;
    ipMetadataHash: string;
    nftMetadataURI: string;
    nftMetadataHash: string;
  }
): Promise<DerivativeResult> {
  const client = getStoryClient(walletClient);

  const response = await client.ipAsset.registerDerivativeIpAsset({
    nft: {
      type: "mint",
      spgNftContract: SPG_NFT_CONTRACT as `0x${string}`,
    },
    derivData: {
      parentIpIds: [parentIpId as `0x${string}`],
      licenseTermsIds: [BigInt(licenseTermsId)],
    },
    ipMetadata: {
      ipMetadataURI: metadata.ipMetadataURI,
      ipMetadataHash: metadata.ipMetadataHash as `0x${string}`,
      nftMetadataURI: metadata.nftMetadataURI,
      nftMetadataHash: metadata.nftMetadataHash as `0x${string}`,
    },
  });

  return {
    childIpId: response.ipId || "",
    tokenId: response.tokenId?.toString() || "",
    txHash: response.txHash || "",
  };
}

/**
 * Records a derivative relationship in the database by calling the
 * server-side API route. This persists the on-chain registration data
 * so the app can display fork/derivative lineage.
 */
export async function recordDerivative(params: {
  parentSubmissionId: string;
  childSubmissionId: string;
  childIpId: string;
  tokenId: string;
  txHash: string;
  nftContract: string;
  ownerAddress: string;
  parentIpId: string;
  metadataUri: string;
  metadataHash: string;
  licenseTermsId: string;
  licenseTerms: Record<string, unknown>;
}) {
  const response = await fetch("/api/story-protocol/derivative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to record derivative");
  }

  return response.json();
}
