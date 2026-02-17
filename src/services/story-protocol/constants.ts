export const STORY_CHAIN_ID = "aeneid" as const;
export const STORY_RPC_URL =
  process.env.NEXT_PUBLIC_STORY_RPC_URL || "https://aeneid.storyrpc.io";
export const SPG_NFT_CONTRACT =
  process.env.NEXT_PUBLIC_SPG_NFT_CONTRACT || "";
export const WIP_TOKEN_ADDRESS = "0x1514000000000000000000000000000000000000";
export const STORY_EXPLORER_URL = "https://aeneid.storyscan.io";

export function getIpExplorerUrl(ipId: string) {
  return `${STORY_EXPLORER_URL}/ip/${ipId}`;
}

export function getTxExplorerUrl(txHash: string) {
  return `${STORY_EXPLORER_URL}/tx/${txHash}`;
}
