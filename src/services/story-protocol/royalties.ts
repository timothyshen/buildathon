"use client";

import type { WalletClient } from "viem";
import { getStoryClient } from "./client";
import { WIP_TOKEN_ADDRESS } from "./constants";

/**
 * Claims all revenue from the child IPs of an ancestor IP, then transfers
 * all claimed tokens to the connected wallet if it owns the IP.
 *
 * @param walletClient  - Connected wallet client (must have an account)
 * @param ancestorIpId  - The IP asset from which to claim revenue
 * @param claimer       - Address of the royalty token holder (typically the ancestor IP or wallet)
 * @param childIpIds    - Addresses of child IPs from which royalties are derived
 * @param royaltyPolicies - Royalty policy addresses; royaltyPolicies[i] governs childIpIds[i]
 * @param currencyTokens  - Token addresses to claim (e.g. WIP). Required even if no children.
 */
export async function claimAllRevenue(
  walletClient: WalletClient,
  ancestorIpId: string,
  claimer: string,
  childIpIds: string[] = [],
  royaltyPolicies: string[] = [],
  currencyTokens: string[] = [WIP_TOKEN_ADDRESS]
) {
  const client = getStoryClient(walletClient);

  const response = await client.royalty.claimAllRevenue({
    ancestorIpId: ancestorIpId as `0x${string}`,
    claimer: claimer as `0x${string}`,
    childIpIds: childIpIds as `0x${string}`[],
    royaltyPolicies: royaltyPolicies as `0x${string}`[],
    currencyTokens: currencyTokens as `0x${string}`[],
  });

  return response;
}

/**
 * Returns the total amount of a revenue token that is claimable
 * by a given claimer address from the royalty vault of an IP.
 *
 * @param walletClient - Connected wallet client
 * @param ipId         - The IP ID of the royalty vault to query
 * @param claimer      - Address of the royalty token holder
 * @param token        - Revenue token address to check (defaults to WIP)
 */
export async function getClaimableRevenue(
  walletClient: WalletClient,
  ipId: string,
  claimer: string,
  token: string = WIP_TOKEN_ADDRESS
) {
  const client = getStoryClient(walletClient);

  const amount = await client.royalty.claimableRevenue({
    ipId: ipId as `0x${string}`,
    claimer: claimer as `0x${string}`,
    token: token as `0x${string}`,
  });

  return amount;
}

/**
 * Pays royalties to a receiver IP on behalf of a payer IP.
 *
 * @param walletClient - Connected wallet client
 * @param receiverIpId - The IP that receives the royalty payment
 * @param payerIpId    - The IP that pays the royalties
 * @param token        - Token address used for payment (defaults to WIP)
 * @param amount       - Amount to pay (as a bigint or number)
 */
export async function payRoyaltyOnBehalf(
  walletClient: WalletClient,
  receiverIpId: string,
  payerIpId: string,
  token: string = WIP_TOKEN_ADDRESS,
  amount: bigint | number
) {
  const client = getStoryClient(walletClient);

  const response = await client.royalty.payRoyaltyOnBehalf({
    receiverIpId: receiverIpId as `0x${string}`,
    payerIpId: payerIpId as `0x${string}`,
    token: token as `0x${string}`,
    amount,
  });

  return response;
}
