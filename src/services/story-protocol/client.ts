"use client";

import { StoryClient, type StoryConfig } from "@story-protocol/core-sdk";
import { http, type WalletClient } from "viem";
import { STORY_CHAIN_ID, STORY_RPC_URL } from "./constants";

export function getStoryClient(walletClient: WalletClient): StoryClient {
  if (!walletClient.account) {
    throw new Error("Wallet client must have an account connected");
  }

  // Type assertions needed to bridge viem version mismatch between
  // the project (2.45.0) and @story-protocol/core-sdk's peer dep (2.44.4)
  const config = {
    account: walletClient.account,
    transport: http(STORY_RPC_URL),
    chainId: STORY_CHAIN_ID,
  } as unknown as StoryConfig;

  return StoryClient.newClient(config);
}
