"use client";

import type { WalletClient } from "viem";
import type { Submission, PilTermsFormValues } from "@/types";
import { getStoryClient } from "./client";
import { buildLicenseTermsData } from "./licensing";
import { SPG_NFT_CONTRACT } from "./constants";

interface RegistrationResult {
  ipId: string;
  tokenId: string;
  txHash: string;
  licenseTermsIds: string[];
}

async function uploadMetadata(submission: Submission) {
  const attributes = [
    { key: "Tagline", value: submission.tagline || "" },
    { key: "Demo URL", value: submission.demoUrl || "" },
    { key: "Repository", value: submission.repoUrl || "" },
    { key: "Video", value: submission.videoUrl || "" },
    { key: "Tech Stack", value: submission.techStack?.join(", ") || "" },
  ].filter((a) => a.value);

  const response = await fetch("/api/story-protocol/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: submission.title,
      description: submission.description,
      image: submission.logoUrl || "",
      attributes,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to upload metadata to IPFS");
  }

  return response.json() as Promise<{
    ipMetadataURI: string;
    ipMetadataHash: `0x${string}`;
    nftMetadataURI: string;
    nftMetadataHash: `0x${string}`;
  }>;
}

export async function registerSubmissionAsIp(
  walletClient: WalletClient,
  submission: Submission,
  licenseTerms: PilTermsFormValues
): Promise<RegistrationResult> {
  const client = getStoryClient(walletClient);
  const metadata = await uploadMetadata(submission);
  const licenseTermsData = buildLicenseTermsData(licenseTerms);

  const response = await client.ipAsset.registerIpAsset({
    nft: {
      type: "mint",
      spgNftContract: SPG_NFT_CONTRACT as `0x${string}`,
    },
    licenseTermsData: [{ terms: licenseTermsData }],
    ipMetadata: {
      ipMetadataURI: metadata.ipMetadataURI,
      ipMetadataHash: metadata.ipMetadataHash,
      nftMetadataURI: metadata.nftMetadataURI,
      nftMetadataHash: metadata.nftMetadataHash,
    },
  });

  return {
    ipId: response.ipId || "",
    tokenId: response.tokenId?.toString() || "",
    txHash: response.txHash || "",
    licenseTermsIds: response.licenseTermsIds?.map(String) || [],
  };
}

export async function recordRegistration(params: {
  submissionId: string;
  ipId: string;
  tokenId: string;
  txHash: string;
  nftContract: string;
  ownerAddress: string;
  metadataUri: string;
  metadataHash: string;
  licenseTermsId: string;
  licenseTerms: PilTermsFormValues;
  parentIpId?: string;
}) {
  const response = await fetch("/api/story-protocol/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to record registration");
  }

  return response.json();
}
