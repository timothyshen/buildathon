"use client";

import { StoryClient } from "@story-protocol/core-sdk";
import { http, type WalletClient } from "viem";
import { STORY_CHAIN_ID, STORY_RPC_URL } from "./constants";

export function getStoryClient(walletClient: WalletClient): StoryClient {
  if (!walletClient.account) {
    throw new Error("Wallet client must have an account connected");
  }

  // Use newClientUseWallet so the SDK signs transactions via the browser
  // wallet (Dynamic Labs) instead of sending unsigned txs to the public RPC.
  // The HTTP transport is used for read operations only.
  // Type assertion needed to bridge viem version mismatch between
  // the project (2.45.0) and @story-protocol/core-sdk's peer dep (2.44.4).
  return StoryClient.newClientUseWallet({
    wallet: walletClient,
    transport: http(STORY_RPC_URL),
    chainId: STORY_CHAIN_ID,
  } as unknown as Parameters<typeof StoryClient.newClientUseWallet>[0]);
}
