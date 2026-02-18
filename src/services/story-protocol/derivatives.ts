"use client";

import { type WalletClient, parseEther, encodeFunctionData } from "viem";
import { getStoryClient } from "./client";
import { SPG_NFT_CONTRACT, WIP_TOKEN_ADDRESS } from "./constants";

// DerivativeWorkflows contract — needs WIP approval to pay minting fees
const DERIVATIVE_WORKFLOWS_ADDRESS = "0x9e2d496f72C547C2C535B167e06ED8729B374a4f" as const;

// Minimal ERC20 approve ABI
const erc20ApproveAbi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface DerivativeResult {
  childIpId: string;
  tokenId: string;
  txHash: string;
}

/**
 * Approves the DerivativeWorkflows contract to spend WIP tokens on behalf
 * of the caller. Required when the parent IP has a minting fee, because the
 * workflow contract needs to pull WIP from the user's balance to pay it.
 */
async function approveWipForDerivativeWorkflows(
  walletClient: WalletClient,
  amount: bigint
) {
  if (!walletClient.account) {
    throw new Error("Wallet must have an account connected");
  }

  const hash = await walletClient.sendTransaction({
    to: WIP_TOKEN_ADDRESS as `0x${string}`,
    data: encodeFunctionData({
      abi: erc20ApproveAbi,
      functionName: "approve",
      args: [DERIVATIVE_WORKFLOWS_ADDRESS, amount],
    }),
    account: walletClient.account,
    chain: walletClient.chain,
  });

  return hash;
}

/**
 * Mints a new NFT and registers it as a derivative IP asset linked to
 * a parent IP via the specified license terms. Uses the SDK's unified
 * `registerDerivativeIpAsset` entry point which automatically selects
 * the optimal workflow (mintAndRegisterIpAndMakeDerivative).
 *
 * If the parent license has a minting fee, this first approves the
 * DerivativeWorkflows contract to spend WIP tokens (the minting fee
 * currency) on behalf of the caller.
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
  },
  mintingFee?: string
): Promise<DerivativeResult> {
  // Approve WIP spending if there's a minting fee
  const fee = parseEther(mintingFee || "0");
  if (fee > BigInt(0)) {
    await approveWipForDerivativeWorkflows(walletClient, fee);
  }

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
