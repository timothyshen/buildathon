# Story Protocol Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Register hackathon submissions as IP Assets on Story Protocol with custom PIL license terms, on-platform forking as derivative IP, and a royalty dashboard with server-synced data.

**Architecture:** Hybrid approach — client-side Story Protocol SDK (via user's Dynamic wallet) handles registration, licensing, derivatives, and claiming. Server-side API routes verify on-chain state and sync to Supabase. A cron job periodically reads royalty vault state and caches it for the dashboard.

**Tech Stack:** `@story-protocol/core-sdk`, `viem`, `pinata-web3`, Dynamic Labs wallet, Supabase, Next.js API routes, Vercel cron.

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/012_story_protocol.sql`

**Step 1: Write the migration**

```sql
-- Story Protocol IP Asset tracking
CREATE TABLE ip_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  ip_id TEXT NOT NULL UNIQUE,
  nft_contract TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  metadata_uri TEXT,
  metadata_hash TEXT,
  parent_ip_id TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_assets_submission ON ip_assets(submission_id);
CREATE INDEX idx_ip_assets_ip_id ON ip_assets(ip_id);
CREATE INDEX idx_ip_assets_parent ON ip_assets(parent_ip_id);
CREATE INDEX idx_ip_assets_owner ON ip_assets(owner_address);

-- Custom PIL license terms attached to an IP
CREATE TABLE ip_license_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
  license_terms_id TEXT NOT NULL,
  commercial_use BOOLEAN NOT NULL DEFAULT false,
  commercial_attribution BOOLEAN NOT NULL DEFAULT false,
  commercial_rev_share INTEGER NOT NULL DEFAULT 0,
  default_minting_fee TEXT NOT NULL DEFAULT '0',
  derivatives_allowed BOOLEAN NOT NULL DEFAULT false,
  derivatives_attribution BOOLEAN NOT NULL DEFAULT false,
  derivatives_reciprocal BOOLEAN NOT NULL DEFAULT false,
  derivatives_approval BOOLEAN NOT NULL DEFAULT false,
  transferable BOOLEAN NOT NULL DEFAULT true,
  currency TEXT,
  expiration BIGINT NOT NULL DEFAULT 0,
  uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_license_terms_asset ON ip_license_terms(ip_asset_id);

-- Server-synced royalty vault state
CREATE TABLE royalty_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
  vault_address TEXT,
  total_revenue_wip TEXT NOT NULL DEFAULT '0',
  claimable_wip TEXT NOT NULL DEFAULT '0',
  royalty_token_balance INTEGER NOT NULL DEFAULT 100,
  derivative_count INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_royalty_snapshots_asset ON royalty_snapshots(ip_asset_id);
CREATE INDEX idx_royalty_snapshots_time ON royalty_snapshots(snapshot_at DESC);

-- Add fork tracking to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS forked_from_submission_id UUID REFERENCES submissions(id);
CREATE INDEX idx_submissions_forked_from ON submissions(forked_from_submission_id);

-- RLS policies
ALTER TABLE ip_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_license_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_snapshots ENABLE ROW LEVEL SECURITY;

-- ip_assets: owner can read their own, admins can read all, public can read registered IPs
CREATE POLICY "Anyone can read ip_assets" ON ip_assets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert ip_assets" ON ip_assets FOR INSERT
  TO authenticated WITH CHECK (true);

-- ip_license_terms: readable by all, insertable by authenticated
CREATE POLICY "Anyone can read ip_license_terms" ON ip_license_terms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert ip_license_terms" ON ip_license_terms FOR INSERT
  TO authenticated WITH CHECK (true);

-- royalty_snapshots: readable by all, only service role can insert/update (cron)
CREATE POLICY "Anyone can read royalty_snapshots" ON royalty_snapshots FOR SELECT USING (true);
CREATE POLICY "Service role can manage royalty_snapshots" ON royalty_snapshots FOR ALL
  TO service_role USING (true) WITH CHECK (true);
```

**Step 2: Apply the migration**

Run: `pnpm supabase db push` (or apply via Supabase dashboard if using hosted)

**Step 3: Commit**

```bash
git add supabase/migrations/012_story_protocol.sql
git commit -m "feat: add Story Protocol tables (ip_assets, ip_license_terms, royalty_snapshots)"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add IP Asset, license terms, and royalty snapshot types**

Add after the existing Submission interface (around line 130):

```typescript
// Story Protocol IP Assets
export interface IpAsset {
  id: string;
  submissionId: string;
  submission?: Submission;
  ipId: string;
  nftContract: string;
  tokenId: string;
  txHash: string;
  ownerAddress: string;
  metadataUri?: string;
  metadataHash?: string;
  parentIpId?: string;
  registeredAt: Date;
  createdAt: Date;
}

export interface IpLicenseTerms {
  id: string;
  ipAssetId: string;
  licenseTermsId: string;
  commercialUse: boolean;
  commercialAttribution: boolean;
  commercialRevShare: number;
  defaultMintingFee: string;
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  derivativesReciprocal: boolean;
  derivativesApproval: boolean;
  transferable: boolean;
  currency?: string;
  expiration: number;
  uri?: string;
  createdAt: Date;
}

export interface RoyaltySnapshot {
  id: string;
  ipAssetId: string;
  vaultAddress?: string;
  totalRevenueWip: string;
  claimableWip: string;
  royaltyTokenBalance: number;
  derivativeCount: number;
  snapshotAt: Date;
}

// PIL terms form values (used by the custom terms builder UI)
export interface PilTermsFormValues {
  commercialUse: boolean;
  commercialAttribution: boolean;
  commercialRevShare: number; // 0-100 percentage
  defaultMintingFee: string; // human-readable amount (e.g. "1.5")
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  derivativesReciprocal: boolean;
  derivativesApproval: boolean;
  transferable: boolean;
  currency: string; // ERC20 address
  expiration: number; // seconds, 0 = no expiry
}

export type PilPreset = "non-commercial-remix" | "commercial-use" | "commercial-remix" | "cc-attribution";
```

**Step 2: Add `forkedFromSubmissionId` to Submission interface**

In the existing Submission interface, add:

```typescript
  forkedFromSubmissionId?: string;
  forkedFromSubmission?: Submission;
```

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Story Protocol TypeScript types"
```

---

## Task 3: Install Dependencies

**Step 1: Install packages**

Run: `pnpm add @story-protocol/core-sdk pinata-web3`

**Step 2: Add environment variables to `.env.local`**

```
NEXT_PUBLIC_SPG_NFT_CONTRACT=
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
PINATA_API_KEY=
PINATA_SECRET_KEY=
STORY_RPC_URL=https://aeneid.storyrpc.io
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add Story Protocol SDK and Pinata dependencies"
```

---

## Task 4: Story Protocol Client Factory

**Files:**
- Create: `src/services/story-protocol/client.ts`
- Create: `src/services/story-protocol/constants.ts`

**Step 1: Create constants file**

```typescript
// src/services/story-protocol/constants.ts
export const STORY_CHAIN_ID = "aeneid" as const;
export const STORY_RPC_URL =
  process.env.NEXT_PUBLIC_STORY_RPC_URL || "https://aeneid.storyrpc.io";
export const SPG_NFT_CONTRACT =
  process.env.NEXT_PUBLIC_SPG_NFT_CONTRACT || "";
export const WIP_TOKEN_ADDRESS = "0x1514000000000000000000000000000000000000"; // Story Aeneid WIP token
export const STORY_EXPLORER_URL = "https://aeneid.storyscan.io";
```

**Step 2: Create client factory**

```typescript
// src/services/story-protocol/client.ts
"use client";

import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { http, type WalletClient } from "viem";
import { STORY_CHAIN_ID, STORY_RPC_URL } from "./constants";

export function getStoryClient(walletClient: WalletClient): StoryClient {
  if (!walletClient.account) {
    throw new Error("Wallet client must have an account connected");
  }

  const config: StoryConfig = {
    account: walletClient.account,
    transport: http(STORY_RPC_URL),
    chainId: STORY_CHAIN_ID,
  };

  return StoryClient.newClient(config);
}
```

**Step 3: Commit**

```bash
git add src/services/story-protocol/
git commit -m "feat: add Story Protocol client factory and constants"
```

---

## Task 5: PIL Terms Builder Utility

**Files:**
- Create: `src/services/story-protocol/licensing.ts`

**Step 1: Create the PIL terms builder and preset mappings**

```typescript
// src/services/story-protocol/licensing.ts
"use client";

import { PILFlavor } from "@story-protocol/core-sdk";
import { parseEther, type WalletClient } from "viem";
import type { PilTermsFormValues, PilPreset } from "@/types";
import { getStoryClient } from "./client";
import { WIP_TOKEN_ADDRESS } from "./constants";

// Map preset names to SDK PILFlavor configurations
export function getPresetTerms(
  preset: PilPreset
): PilTermsFormValues {
  switch (preset) {
    case "non-commercial-remix":
      return {
        commercialUse: false,
        commercialAttribution: false,
        commercialRevShare: 0,
        defaultMintingFee: "0",
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesReciprocal: true,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
    case "commercial-use":
      return {
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 0,
        defaultMintingFee: "1",
        derivativesAllowed: false,
        derivativesAttribution: false,
        derivativesReciprocal: false,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
    case "commercial-remix":
      return {
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 50,
        defaultMintingFee: "1",
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesReciprocal: true,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
    case "cc-attribution":
      return {
        commercialUse: true,
        commercialAttribution: true,
        commercialRevShare: 0,
        defaultMintingFee: "0",
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesReciprocal: true,
        derivativesApproval: false,
        transferable: true,
        currency: WIP_TOKEN_ADDRESS,
        expiration: 0,
      };
  }
}

// Build SDK-compatible license terms data from form values
export function buildLicenseTermsData(values: PilTermsFormValues) {
  // Determine which PILFlavor method to use based on values
  if (!values.commercialUse && values.derivativesAllowed) {
    return {
      terms: PILFlavor.nonCommercialSocialRemixing(),
    };
  }

  if (values.commercialUse && !values.derivativesAllowed) {
    return {
      terms: PILFlavor.commercialUse({
        defaultMintingFee: parseEther(values.defaultMintingFee || "0"),
        currency: values.currency as `0x${string}`,
      }),
    };
  }

  if (values.commercialUse && values.derivativesAllowed) {
    return {
      terms: PILFlavor.commercialRemix({
        commercialRevShare: values.commercialRevShare,
        defaultMintingFee: parseEther(values.defaultMintingFee || "0"),
        currency: values.currency as `0x${string}`,
      }),
    };
  }

  // Fallback to non-commercial
  return {
    terms: PILFlavor.nonCommercialSocialRemixing(),
  };
}

// Attach additional license terms to an existing IP
export async function attachLicenseTerms(
  walletClient: WalletClient,
  ipId: string,
  terms: PilTermsFormValues
) {
  const client = getStoryClient(walletClient);
  const licenseTermsData = buildLicenseTermsData(terms);

  const response = await client.license.attachLicenseTerms({
    ipId: ipId as `0x${string}`,
    licenseTermsId: licenseTermsData.terms,
  });

  return response;
}

// Mint a license token for a specific IP
export async function mintLicenseToken(
  walletClient: WalletClient,
  ipId: string,
  licenseTermsId: string,
  receiver: string
) {
  const client = getStoryClient(walletClient);

  const response = await client.license.mintLicenseTokens({
    licensorIpId: ipId as `0x${string}`,
    licenseTermsId: BigInt(licenseTermsId),
    receiver: receiver as `0x${string}`,
    amount: 1,
  });

  return response;
}
```

**Step 2: Commit**

```bash
git add src/services/story-protocol/licensing.ts
git commit -m "feat: add PIL terms builder and licensing utilities"
```

---

## Task 6: IPFS Metadata Upload

**Files:**
- Create: `src/app/api/story-protocol/metadata/route.ts`

**Step 1: Create the metadata upload API route**

```typescript
// src/app/api/story-protocol/metadata/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY!,
  pinataGateway: "gateway.pinata.cloud",
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, image, attributes } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Build IP metadata following Story Protocol standard
    const ipMetadata = {
      name,
      description,
      image: image || "",
      attributes: attributes || [],
    };

    // Build NFT metadata
    const nftMetadata = {
      name,
      description,
      image: image || "",
    };

    // Pin both to IPFS
    const ipUpload = await pinata.upload.json(ipMetadata);
    const nftUpload = await pinata.upload.json(nftMetadata);

    // Compute hashes (keccak256 of the JSON)
    const encoder = new TextEncoder();
    const ipBytes = encoder.encode(JSON.stringify(ipMetadata));
    const nftBytes = encoder.encode(JSON.stringify(nftMetadata));

    // Use Web Crypto API for hashing
    const ipHashBuffer = await crypto.subtle.digest("SHA-256", ipBytes);
    const nftHashBuffer = await crypto.subtle.digest("SHA-256", nftBytes);
    const ipHash = Buffer.from(ipHashBuffer).toString("hex");
    const nftHash = Buffer.from(nftHashBuffer).toString("hex");

    return NextResponse.json({
      ipMetadataURI: `https://gateway.pinata.cloud/ipfs/${ipUpload.IpfsHash}`,
      ipMetadataHash: `0x${ipHash}`,
      nftMetadataURI: `https://gateway.pinata.cloud/ipfs/${nftUpload.IpfsHash}`,
      nftMetadataHash: `0x${nftHash}`,
    });
  } catch (error) {
    console.error("Metadata upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload metadata" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/story-protocol/metadata/route.ts
git commit -m "feat: add IPFS metadata upload API route via Pinata"
```

---

## Task 7: IP Registration Client Service

**Files:**
- Create: `src/services/story-protocol/ip-registration.ts`

**Step 1: Create the registration service**

```typescript
// src/services/story-protocol/ip-registration.ts
"use client";

import type { WalletClient } from "viem";
import type { Submission, PilTermsFormValues } from "@/types";
import { getStoryClient } from "./client";
import { buildLicenseTermsData } from "./licensing";
import { SPG_NFT_CONTRACT } from "./constants";

interface IpMetadata {
  ipMetadataURI: string;
  ipMetadataHash: `0x${string}`;
  nftMetadataURI: string;
  nftMetadataHash: `0x${string}`;
}

interface RegistrationResult {
  ipId: string;
  tokenId: string;
  txHash: string;
  licenseTermsIds: string[];
}

// Upload submission metadata to IPFS via our API route
async function uploadMetadata(submission: Submission): Promise<IpMetadata> {
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

  return response.json();
}

// Register a submission as an IP Asset with license terms
export async function registerSubmissionAsIp(
  walletClient: WalletClient,
  submission: Submission,
  licenseTerms: PilTermsFormValues
): Promise<RegistrationResult> {
  const client = getStoryClient(walletClient);

  // 1. Upload metadata to IPFS
  const metadata = await uploadMetadata(submission);

  // 2. Build license terms
  const licenseTermsData = buildLicenseTermsData(licenseTerms);

  // 3. Mint NFT + register IP + attach license in one transaction
  const response = await client.ipAsset.registerIpAsset({
    nft: {
      type: "mint",
      spgNftContract: SPG_NFT_CONTRACT as `0x${string}`,
    },
    licenseTermsData: [licenseTermsData],
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

// Verify and record registration on the server
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
```

**Step 2: Commit**

```bash
git add src/services/story-protocol/ip-registration.ts
git commit -m "feat: add IP registration client service"
```

---

## Task 8: Server-Side Register API Route

**Files:**
- Create: `src/app/api/story-protocol/register/route.ts`

**Step 1: Create the registration verification and storage route**

```typescript
// src/app/api/story-protocol/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      submissionId,
      ipId,
      tokenId,
      txHash,
      nftContract,
      ownerAddress,
      metadataUri,
      metadataHash,
      licenseTermsId,
      licenseTerms,
      parentIpId,
    } = body;

    if (!submissionId || !ipId || !txHash || !ownerAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify submission exists and user has access
    const { data: submission, error: subError } = await admin
      .from("submissions")
      .select("id, created_by, team_id")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Insert ip_asset record
    const { data: ipAsset, error: ipError } = await admin
      .from("ip_assets")
      .insert({
        submission_id: submissionId,
        ip_id: ipId,
        nft_contract: nftContract,
        token_id: tokenId,
        tx_hash: txHash,
        owner_address: ownerAddress,
        metadata_uri: metadataUri,
        metadata_hash: metadataHash,
        parent_ip_id: parentIpId || null,
      })
      .select()
      .single();

    if (ipError) {
      console.error("IP asset insert error:", ipError);
      return NextResponse.json(
        { error: "Failed to save IP asset" },
        { status: 500 }
      );
    }

    // Insert license terms
    if (licenseTerms && licenseTermsId) {
      const { error: ltError } = await admin
        .from("ip_license_terms")
        .insert({
          ip_asset_id: ipAsset.id,
          license_terms_id: licenseTermsId,
          commercial_use: licenseTerms.commercialUse || false,
          commercial_attribution: licenseTerms.commercialAttribution || false,
          commercial_rev_share: licenseTerms.commercialRevShare || 0,
          default_minting_fee: licenseTerms.defaultMintingFee || "0",
          derivatives_allowed: licenseTerms.derivativesAllowed || false,
          derivatives_attribution: licenseTerms.derivativesAttribution || false,
          derivatives_reciprocal: licenseTerms.derivativesReciprocal || false,
          derivatives_approval: licenseTerms.derivativesApproval || false,
          transferable: licenseTerms.transferable ?? true,
          currency: licenseTerms.currency || null,
          expiration: licenseTerms.expiration || 0,
        });

      if (ltError) {
        console.error("License terms insert error:", ltError);
      }
    }

    // Update denormalized fields on submission
    const { error: updateError } = await admin
      .from("submissions")
      .update({
        ip_asset_id: ipId,
        ip_registered_at: new Date().toISOString(),
        built_with_story: true,
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Submission update error:", updateError);
    }

    return NextResponse.json({ success: true, ipAssetId: ipAsset.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/story-protocol/register/route.ts
git commit -m "feat: add server-side IP registration verification route"
```

---

## Task 9: IP Assets Supabase Service

**Files:**
- Create: `src/services/ip-assets.service.ts`
- Modify: `src/services/index.ts`

**Step 1: Create the IP assets service**

Follow the pattern from `submissions.service.ts` — use `createClient()`, return `ServiceResponse<T>`, map snake_case to camelCase.

```typescript
// src/services/ip-assets.service.ts
import { createClient } from "@/lib/supabase/client";
import type { IpAsset, IpLicenseTerms, RoyaltySnapshot } from "@/types";
import { success, error, type ServiceResponse } from "./types";

function mapIpAsset(row: Record<string, unknown>): IpAsset {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    ipId: row.ip_id as string,
    nftContract: row.nft_contract as string,
    tokenId: row.token_id as string,
    txHash: row.tx_hash as string,
    ownerAddress: row.owner_address as string,
    metadataUri: row.metadata_uri as string | undefined,
    metadataHash: row.metadata_hash as string | undefined,
    parentIpId: row.parent_ip_id as string | undefined,
    registeredAt: new Date(row.registered_at as string),
    createdAt: new Date(row.created_at as string),
  };
}

function mapLicenseTerms(row: Record<string, unknown>): IpLicenseTerms {
  return {
    id: row.id as string,
    ipAssetId: row.ip_asset_id as string,
    licenseTermsId: row.license_terms_id as string,
    commercialUse: row.commercial_use as boolean,
    commercialAttribution: row.commercial_attribution as boolean,
    commercialRevShare: row.commercial_rev_share as number,
    defaultMintingFee: row.default_minting_fee as string,
    derivativesAllowed: row.derivatives_allowed as boolean,
    derivativesAttribution: row.derivatives_attribution as boolean,
    derivativesReciprocal: row.derivatives_reciprocal as boolean,
    derivativesApproval: row.derivatives_approval as boolean,
    transferable: row.transferable as boolean,
    currency: row.currency as string | undefined,
    expiration: row.expiration as number,
    uri: row.uri as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRoyaltySnapshot(row: Record<string, unknown>): RoyaltySnapshot {
  return {
    id: row.id as string,
    ipAssetId: row.ip_asset_id as string,
    vaultAddress: row.vault_address as string | undefined,
    totalRevenueWip: row.total_revenue_wip as string,
    claimableWip: row.claimable_wip as string,
    royaltyTokenBalance: row.royalty_token_balance as number,
    derivativeCount: row.derivative_count as number,
    snapshotAt: new Date(row.snapshot_at as string),
  };
}

export const ipAssetsService = {
  async getBySubmissionId(
    submissionId: string
  ): Promise<ServiceResponse<IpAsset | null>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("ip_assets")
      .select("*")
      .eq("submission_id", submissionId)
      .maybeSingle();

    if (dbError) return error(dbError.message);
    return success(data ? mapIpAsset(data) : null);
  },

  async getByIpId(
    ipId: string
  ): Promise<ServiceResponse<IpAsset | null>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("ip_assets")
      .select("*")
      .eq("ip_id", ipId)
      .maybeSingle();

    if (dbError) return error(dbError.message);
    return success(data ? mapIpAsset(data) : null);
  },

  async getLicenseTerms(
    ipAssetId: string
  ): Promise<ServiceResponse<IpLicenseTerms[]>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("ip_license_terms")
      .select("*")
      .eq("ip_asset_id", ipAssetId);

    if (dbError) return error(dbError.message);
    return success((data || []).map(mapLicenseTerms));
  },

  async getLatestRoyaltySnapshot(
    ipAssetId: string
  ): Promise<ServiceResponse<RoyaltySnapshot | null>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("royalty_snapshots")
      .select("*")
      .eq("ip_asset_id", ipAssetId)
      .order("snapshot_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) return error(dbError.message);
    return success(data ? mapRoyaltySnapshot(data) : null);
  },

  async getDerivatives(
    parentIpId: string
  ): Promise<ServiceResponse<IpAsset[]>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("ip_assets")
      .select("*")
      .eq("parent_ip_id", parentIpId);

    if (dbError) return error(dbError.message);
    return success((data || []).map(mapIpAsset));
  },

  async getAllForOwner(
    ownerAddress: string
  ): Promise<ServiceResponse<IpAsset[]>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("ip_assets")
      .select("*")
      .ilike("owner_address", ownerAddress)
      .order("registered_at", { ascending: false });

    if (dbError) return error(dbError.message);
    return success((data || []).map(mapIpAsset));
  },

  async getAll(): Promise<ServiceResponse<IpAsset[]>> {
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("ip_assets")
      .select("*")
      .order("registered_at", { ascending: false });

    if (dbError) return error(dbError.message);
    return success((data || []).map(mapIpAsset));
  },
};
```

**Step 2: Export from services barrel**

Add to `src/services/index.ts`:

```typescript
export { ipAssetsService } from "./ip-assets.service";
```

**Step 3: Commit**

```bash
git add src/services/ip-assets.service.ts src/services/index.ts
git commit -m "feat: add IP assets Supabase service layer"
```

---

## Task 10: Step IP Component — License Terms Builder

**Files:**
- Modify: `src/app/(dashboard)/submit/components/step-ip.tsx`

**Step 1: Rewrite step-ip.tsx with preset picker + custom terms builder**

Replace the existing file entirely. Follow the Bento design system (no Card wrappers, `rounded-xl border` sections, proper typography classes). The component receives `data.licenseType` and an `onChange` callback from the wizard.

The component should have:
- A wallet connection check (using `useDynamicContext` from Dynamic Labs)
- 4 preset cards in a grid: Non-Commercial Remix, Commercial Use, Commercial Remix, CC Attribution
- Each card shows key terms as bullet points with status dots
- Clicking a preset selects it and pre-fills the custom fields
- An "Advanced Settings" collapsible section with all PIL parameter toggles/inputs
- Form fields: commercialUse (toggle), commercialRevShare (slider 0-100%), mintingFee (number input), derivativesAllowed (toggle), derivativesAttribution (toggle), derivativesReciprocal (toggle), derivativesApproval (toggle), transferable (toggle), expiration (number input)
- Selected preset highlighted with `ring-2 ring-foreground`
- If any custom field is edited, show "Custom" badge instead of preset name

Key implementation notes:
- Use `onChange("pilTerms", values)` to pass the full `PilTermsFormValues` to the wizard
- Use `onChange("pilPreset", presetName)` to track which preset is active
- Import `getPresetTerms` from `@/services/story-protocol/licensing`
- This step does NOT trigger on-chain registration — that happens at submit time or post-submission

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submit/components/step-ip.tsx
git commit -m "feat: replace step-ip with PIL terms builder (presets + custom)"
```

---

## Task 11: Submission Wizard Integration

**Files:**
- Modify: `src/app/(dashboard)/submit/page.tsx`

**Step 1: Add IP step to the wizard flow**

- Add step to `STEPS` array: `{ id: 5, label: "IP" }` (renumber Review to 6)
- Add `pilTerms: PilTermsFormValues | null` and `pilPreset: PilPreset | null` to `SubmissionDraft`
- Render `StepIp` when `currentStep === 5`, passing `data.pilTerms` and `onChange`
- Make this step optional — the "Skip" button advances without setting terms
- On final submit: if `pilTerms` is set, trigger IP registration after submission is saved

**Step 2: Add registration hook**

Create a `useIpRegistration` hook that:
- Takes `submission`, `pilTerms`, and wallet client
- Calls `registerSubmissionAsIp()` → `recordRegistration()`
- Returns `{ register, isRegistering, error, result }`
- Show a registration modal/overlay after submission with progress states

**Step 3: Commit**

```bash
git add src/app/(dashboard)/submit/page.tsx
git commit -m "feat: integrate IP registration step into submission wizard"
```

---

## Task 12: IP Registration Hook

**Files:**
- Create: `src/hooks/use-ip-registration.ts`

**Step 1: Create the registration hook**

```typescript
// src/hooks/use-ip-registration.ts
"use client";

import { useState, useCallback } from "react";
import type { Submission, PilTermsFormValues } from "@/types";
import { registerSubmissionAsIp, recordRegistration } from "@/services/story-protocol/ip-registration";
import { SPG_NFT_CONTRACT } from "@/services/story-protocol/constants";
import type { WalletClient } from "viem";

type RegistrationStatus = "idle" | "uploading" | "signing" | "confirming" | "recording" | "done" | "error";

export function useIpRegistration() {
  const [status, setStatus] = useState<RegistrationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ipId: string; txHash: string } | null>(null);

  const register = useCallback(
    async (
      walletClient: WalletClient,
      submission: Submission,
      licenseTerms: PilTermsFormValues
    ) => {
      try {
        setStatus("uploading");
        setError(null);

        // Step 1: Register on-chain (uploads metadata + mints + registers)
        setStatus("signing");
        const regResult = await registerSubmissionAsIp(
          walletClient,
          submission,
          licenseTerms
        );

        // Step 2: Record in database
        setStatus("recording");
        await recordRegistration({
          submissionId: submission.id,
          ipId: regResult.ipId,
          tokenId: regResult.tokenId,
          txHash: regResult.txHash,
          nftContract: SPG_NFT_CONTRACT,
          ownerAddress: walletClient.account?.address || "",
          metadataUri: "",
          metadataHash: "",
          licenseTermsId: regResult.licenseTermsIds[0] || "",
          licenseTerms,
        });

        setStatus("done");
        setResult({ ipId: regResult.ipId, txHash: regResult.txHash });
        return regResult;
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Registration failed");
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return { register, status, error, result, reset };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-ip-registration.ts
git commit -m "feat: add useIpRegistration hook with status tracking"
```

---

## Task 13: Submission Detail — IP Section

**Files:**
- Modify: `src/app/(dashboard)/submissions/[id]/page.tsx`

**Step 1: Add IP status / registration section**

Add a new section to the submission detail page. Two states:

**If IP is not registered:**
- Section with "Intellectual Property" header
- "Register this submission as an IP Asset on Story Protocol" description
- "Register IP" button that opens a modal with the license terms builder (reuse StepIp component)
- Wallet connection check before showing the form

**If IP is registered:**
- Section showing: IP Asset ID (linked to Story explorer), license type summary, registration date, tx hash (linked to explorer)
- License terms detail: commercial use, rev share %, derivatives allowed, etc. as a clean list
- Derivative count with link to view derivatives
- "Fork this Project" button visible to other users

Use the `ipAssetsService.getBySubmissionId()` to fetch IP data on page load.

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submissions/[id]/page.tsx
git commit -m "feat: add IP registration section to submission detail page"
```

---

## Task 14: Derivative Registration Service

**Files:**
- Create: `src/services/story-protocol/derivatives.ts`

**Step 1: Create derivative registration service**

```typescript
// src/services/story-protocol/derivatives.ts
"use client";

import type { WalletClient } from "viem";
import { getStoryClient } from "./client";
import { SPG_NFT_CONTRACT } from "./constants";

interface DerivativeResult {
  childIpId: string;
  tokenId: string;
  txHash: string;
}

// Register a derivative IP (fork of an existing registered IP)
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

  const response = await client.ipAsset.registerDerivativeIp({
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

// Record derivative in the database
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
```

**Step 2: Commit**

```bash
git add src/services/story-protocol/derivatives.ts
git commit -m "feat: add derivative IP registration service"
```

---

## Task 15: Server-Side Derivative API Route

**Files:**
- Create: `src/app/api/story-protocol/derivative/route.ts`

**Step 1: Create the derivative verification and storage route**

Same pattern as the register route (Task 8), but also:
- Sets `forked_from_submission_id` on the child submission
- Sets `parent_ip_id` on the child `ip_assets` row
- Inserts license terms for the derivative

**Step 2: Commit**

```bash
git add src/app/api/story-protocol/derivative/route.ts
git commit -m "feat: add server-side derivative registration route"
```

---

## Task 16: Fork Flow UI

**Files:**
- Create: `src/app/(dashboard)/submissions/[id]/fork/page.tsx`

**Step 1: Create fork page**

When user clicks "Fork this Project":
1. Route to `/submissions/[id]/fork`
2. Page loads the parent submission data
3. Creates a new draft submission pre-filled with:
   - Title: "Fork of {original title}"
   - Description referencing the original
   - `forkedFromSubmissionId` set
4. Shows a simplified wizard: just project details edit + IP registration (derivative)
5. On submit:
   - Save the new submission via existing submission service
   - Upload metadata to IPFS
   - Register as derivative IP on-chain
   - Record in database via derivative API route
6. Redirect to the new submission detail page

Show "Forked from [Original Title]" badge on the submission detail page when `forkedFromSubmissionId` is set.

**Step 2: Commit**

```bash
git add src/app/(dashboard)/submissions/[id]/fork/page.tsx
git commit -m "feat: add fork submission flow with derivative IP registration"
```

---

## Task 17: Royalty Client Service

**Files:**
- Create: `src/services/story-protocol/royalties.ts`

**Step 1: Create royalty client service**

```typescript
// src/services/story-protocol/royalties.ts
"use client";

import type { WalletClient } from "viem";
import { getStoryClient } from "./client";

// Claim all accumulated revenue for an IP
export async function claimAllRevenue(
  walletClient: WalletClient,
  ipId: string
) {
  const client = getStoryClient(walletClient);

  const response = await client.royalty.claimAllRevenue({
    ancestorIpId: ipId as `0x${string}`,
  });

  return response;
}
```

**Step 2: Commit**

```bash
git add src/services/story-protocol/royalties.ts
git commit -m "feat: add client-side royalty claiming service"
```

---

## Task 18: Royalty Sync Cron API Route

**Files:**
- Create: `src/app/api/story-protocol/sync-royalties/route.ts`
- Modify: `vercel.json` (or create if doesn't exist)

**Step 1: Create the royalty sync route**

```typescript
// src/app/api/story-protocol/sync-royalties/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient, http } from "viem";

const STORY_RPC_URL = process.env.STORY_RPC_URL || "https://aeneid.storyrpc.io";

export async function POST(request: Request) {
  try {
    // Verify cron secret or admin auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const publicClient = createPublicClient({
      transport: http(STORY_RPC_URL),
    });

    // Fetch all IP assets
    const { data: ipAssets, error: fetchError } = await admin
      .from("ip_assets")
      .select("id, ip_id");

    if (fetchError || !ipAssets) {
      return NextResponse.json(
        { error: "Failed to fetch IP assets" },
        { status: 500 }
      );
    }

    let synced = 0;

    for (const asset of ipAssets) {
      try {
        // Count derivatives
        const { count } = await admin
          .from("ip_assets")
          .select("id", { count: "exact", head: true })
          .eq("parent_ip_id", asset.ip_id);

        // Upsert royalty snapshot
        await admin.from("royalty_snapshots").upsert(
          {
            ip_asset_id: asset.id,
            total_revenue_wip: "0", // TODO: read from on-chain royalty vault
            claimable_wip: "0",
            royalty_token_balance: 100,
            derivative_count: count || 0,
            snapshot_at: new Date().toISOString(),
          },
          { onConflict: "ip_asset_id" }
        );

        synced++;
      } catch (err) {
        console.error(`Failed to sync royalties for ${asset.ip_id}:`, err);
      }
    }

    return NextResponse.json({ success: true, synced, total: ipAssets.length });
  } catch (error) {
    console.error("Royalty sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Add Vercel cron config**

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/story-protocol/sync-royalties",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Step 3: Commit**

```bash
git add src/app/api/story-protocol/sync-royalties/route.ts vercel.json
git commit -m "feat: add royalty sync cron route (every 15 min)"
```

---

## Task 19: Royalty Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/royalties/page.tsx`

**Step 1: Create the royalty dashboard**

Page at `/royalties` (within dashboard layout, participant-accessible).

**Layout:**
1. **Page header**: "Royalties" title + "Last synced: X min ago" subtitle
2. **Summary stats strip** (Bento tiles, `grid grid-cols-2 md:grid-cols-4 gap-3`):
   - Total Revenue (emerald, `font-mono tabular-nums`)
   - Claimable (amber)
   - Registered IPs (blue)
   - Derivatives (violet)
3. **IP Assets list** (`space-y-2`):
   - Each item: `rounded-xl border py-3 px-4 hover:bg-muted/50`
   - Left: submission title + IP ID (truncated, monospace, linked to explorer)
   - Center: license badge + derivative count
   - Right: revenue / claimable amounts + "Claim" button (ghost variant)
4. **Empty state** if no IPs: centered icon + "No IP Assets registered yet" + link to submissions

Data fetching:
- Use `ipAssetsService.getAllForOwner(walletAddress)` to get user's IPs
- For each IP, fetch latest royalty snapshot
- "Claim" button triggers `claimAllRevenue()` with wallet client

Follow Bento design: no Card wrappers, proper typography, status dots for IP status.

**Step 2: Commit**

```bash
git add src/app/(dashboard)/royalties/page.tsx
git commit -m "feat: add royalty dashboard page"
```

---

## Task 20: Admin IP Registry

**Files:**
- Create: `src/app/(dashboard)/admin/ip-registry/page.tsx`

**Step 1: Create admin IP registry page**

Page at `/admin/ip-registry` with:

1. **Page header**: "IP Registry" title + stats (total IPs, derivatives, revenue)
2. **Filters**: cohort dropdown, license type filter, "has derivatives" toggle
3. **Table** of all IP Assets:
   - Columns: Submission Title, IP ID, Owner, License Type, Derivatives, Revenue, Registered Date
   - IP ID and Owner as truncated monospace with copy button
   - License type as badge
   - Link to submission detail
   - Mobile: hide Owner, Revenue, Date columns with `hidden md:table-cell`
4. **Bulk "Sync Royalties"** button in header — calls `POST /api/story-protocol/sync-royalties`

Data: `ipAssetsService.getAll()` joined with submission data.

**Step 2: Add nav link to admin sidebar**

Add "IP Registry" link to the admin navigation in the sidebar component.

**Step 3: Commit**

```bash
git add src/app/(dashboard)/admin/ip-registry/page.tsx
git commit -m "feat: add admin IP registry page"
```

---

## Task 21: Barrel Export & Cleanup

**Files:**
- Create: `src/services/story-protocol/index.ts`

**Step 1: Create barrel export for story-protocol services**

```typescript
// src/services/story-protocol/index.ts
export { getStoryClient } from "./client";
export { STORY_CHAIN_ID, STORY_RPC_URL, SPG_NFT_CONTRACT, WIP_TOKEN_ADDRESS, STORY_EXPLORER_URL } from "./constants";
export { getPresetTerms, buildLicenseTermsData, attachLicenseTerms, mintLicenseToken } from "./licensing";
export { registerSubmissionAsIp, recordRegistration } from "./ip-registration";
export { registerDerivativeIp, recordDerivative } from "./derivatives";
export { claimAllRevenue } from "./royalties";
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: No TypeScript errors, clean build.

**Step 3: Commit**

```bash
git add src/services/story-protocol/index.ts
git commit -m "feat: add Story Protocol services barrel export"
```

---

## Summary of Files

### New files (16):
```
supabase/migrations/012_story_protocol.sql
src/services/story-protocol/client.ts
src/services/story-protocol/constants.ts
src/services/story-protocol/licensing.ts
src/services/story-protocol/ip-registration.ts
src/services/story-protocol/derivatives.ts
src/services/story-protocol/royalties.ts
src/services/story-protocol/index.ts
src/services/ip-assets.service.ts
src/hooks/use-ip-registration.ts
src/app/api/story-protocol/metadata/route.ts
src/app/api/story-protocol/register/route.ts
src/app/api/story-protocol/derivative/route.ts
src/app/api/story-protocol/sync-royalties/route.ts
src/app/(dashboard)/royalties/page.tsx
src/app/(dashboard)/admin/ip-registry/page.tsx
src/app/(dashboard)/submissions/[id]/fork/page.tsx
```

### Modified files (4):
```
src/types/index.ts
src/services/index.ts
src/app/(dashboard)/submit/page.tsx
src/app/(dashboard)/submit/components/step-ip.tsx
src/app/(dashboard)/submissions/[id]/page.tsx
```

### New dependencies:
```
@story-protocol/core-sdk
pinata-web3
```
