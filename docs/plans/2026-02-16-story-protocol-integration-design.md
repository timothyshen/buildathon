# Story Protocol Integration Design

**Date:** 2026-02-16
**Branch:** `feature/story-protocol-integration`
**Approach:** Hybrid — client-side registration, server-side royalty sync

## Goals

- Register hackathon submissions as IP Assets on Story Protocol (Aeneid testnet)
- Full IP lifecycle: register, license (custom PIL terms), remix (on-platform fork as derivative)
- Full royalty dashboard with earnings, payment history, and claiming
- Optional during submission, always available post-submission
- Use existing Dynamic Labs wallet connection

## Data Model

### New Tables

#### `ip_assets`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Internal ID |
| `submission_id` | uuid FK → submissions | The submission this IP represents |
| `ip_id` | text | Story Protocol IP Asset ID (on-chain) |
| `nft_contract` | text | SPG NFT collection contract address |
| `token_id` | text | NFT token ID |
| `tx_hash` | text | Registration transaction hash |
| `owner_address` | text | Wallet that registered it |
| `metadata_uri` | text | IPFS metadata URI |
| `metadata_hash` | text | Metadata content hash |
| `parent_ip_id` | text | If derivative, the parent IP Asset ID |
| `registered_at` | timestamptz | On-chain registration timestamp |
| `created_at` | timestamptz | Row creation time |

#### `ip_license_terms`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `ip_asset_id` | uuid FK → ip_assets | |
| `license_terms_id` | text | On-chain license terms ID |
| `commercial_use` | boolean | |
| `commercial_rev_share` | integer | Percentage x 10^6 |
| `default_minting_fee` | text | Wei amount as string |
| `derivatives_allowed` | boolean | |
| `derivatives_attribution` | boolean | |
| `derivatives_reciprocal` | boolean | |
| `derivatives_approval` | boolean | |
| `transferable` | boolean | |
| `currency` | text | ERC20 token address |
| `expiration` | bigint | Duration in seconds, 0 = no expiry |
| `commercial_attribution` | boolean | |
| `uri` | text | Off-chain terms URI |
| `created_at` | timestamptz | |

#### `royalty_snapshots`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `ip_asset_id` | uuid FK → ip_assets | |
| `vault_address` | text | Royalty vault contract address |
| `total_revenue_wip` | text | Total revenue received (wei string) |
| `claimable_wip` | text | Unclaimed revenue |
| `royalty_token_balance` | integer | Tokens held (out of 100) |
| `derivative_count` | integer | Number of derivative IPs |
| `snapshot_at` | timestamptz | When this was synced |

### Modifications to Existing Tables

- **`submissions`**: keep existing `ip_asset_id`, `ip_registered_at`, `ip_license_type`, `built_with_story` as denormalized quick-reference fields
- Add `forked_from_submission_id` (uuid FK → submissions, nullable) for on-platform forks

## Service Layer

### Client-Side: `src/services/story-protocol/`

**`client.ts`** — SDK initialization
- `getStoryClient(walletClient)` factory using Dynamic wallet's viem WalletClient
- Configured for Aeneid testnet (chain ID 1315)

**`ip-registration.ts`** — IP Asset registration
- `registerSubmissionAsIp(walletClient, submission, licenseTerms, metadata)`
- Mints SPG NFT + registers as IP + attaches PIL terms in one tx
- Uploads metadata to IPFS first, returns `{ ipId, tokenId, txHash, licenseTermsId }`

**`licensing.ts`** — License term management
- `buildPilTerms(formValues)` — maps UI form to SDK `licenseTermsData`
- `attachLicenseTerms(walletClient, ipId, terms)` — attach terms post-registration
- `mintLicenseToken(walletClient, ipId, licenseTermsId)` — mint license token

**`derivatives.ts`** — Fork/remix registration
- `registerDerivativeIp(walletClient, parentIpId, licenseTermsId, childMetadata)`
- Mints new NFT, registers as IP, links as derivative
- Returns `{ childIpId, tokenId, txHash }`

**`royalties.ts`** — Client-side royalty operations
- `claimAllRevenue(walletClient, ipId)` — claims revenue to user's wallet
- `getRoyaltyVaultInfo(ipId)` — reads vault state on-chain

### Server-Side: `src/app/api/story-protocol/`

**`POST /api/story-protocol/register`**
- Receives `{ submissionId, ipId, tokenId, txHash, licenseTerms, metadataUri }`
- Verifies tx on-chain, inserts `ip_assets` + `ip_license_terms`, updates submission

**`POST /api/story-protocol/derivative`**
- Receives `{ parentSubmissionId, childSubmissionId, childIpId, txHash }`
- Verifies on-chain, inserts `ip_assets` with `parent_ip_id`, sets `forked_from_submission_id`

**`POST /api/story-protocol/sync-royalties`**
- Cron-triggered (every 15 min), iterates all `ip_assets`
- Read-only RPC calls: vault address, balance, derivative count
- Upserts `royalty_snapshots`

**`GET /api/story-protocol/royalties/[submissionId]`**
- Returns cached royalty data from Supabase

## UI Components

### IP Registration — Submission Wizard (Step IP)

Replaces existing `step-ip.tsx`:

1. Wallet check — prompt to connect if needed
2. License terms builder:
   - **Preset picker** — cards for 4 PIL flavors (Non-Commercial Remix, Commercial Use, Commercial Remix, CC Attribution)
   - **Custom terms** — expandable "Advanced" panel with all PIL parameters
   - Selecting preset pre-fills custom fields; editing switches to "Custom"
3. Review & sign — summary + "Register IP" button → wallet tx
4. Loading state — pending with tx hash link to explorer
5. Success state — IP Asset ID, explorer link, "Continue" button

Step is optional — can skip and register later.

### IP Registration — Post-Submission (Project Detail Page)

- No IP: show "Register as IP Asset" section with same terms builder
- IP registered: show IP status (ID, license summary, date, tx hash)

### Fork/Remix Flow

"Fork this Project" button on IP-registered submissions:

1. Creates new submission pre-filled (title "Fork of ...", `forked_from_submission_id` set)
2. Takes user to submission wizard with IP step pre-configured:
   - Parent IP shown as read-only reference
   - License terms comply with parent terms
   - User signs derivative registration tx
3. Forked submission shows "Forked from [original]" badge

### Royalty Dashboard (`/dashboard/royalties`)

- **Summary strip** — total revenue, claimable, registered IPs, derivative count
- **IP Assets list** — each IP shows: title, IP ID (explorer link), license badge, derivatives, revenue, "Claim" button
- **Derivative tree** — parent → child indented list
- **Sync status** — "Last synced: X min ago", admin manual sync button

### Admin View — IP Registry

- Table of all IP Assets across submissions
- Filter by cohort, license type, has-derivatives
- Bulk "Sync Royalties" button
- Stats: total IPs, derivatives, revenue

## Technical Details

### SDK Initialization

Story SDK uses viem WalletClient from Dynamic Labs. Factory function bridges the two.

### SPG NFT Collection

One shared SPG NFT collection for the platform. Contract address in `NEXT_PUBLIC_SPG_NFT_CONTRACT` env var.

### IPFS Metadata

Pinata for IPFS pinning. Upload via server-side API route (keeps API key secret). Metadata follows Story Protocol IP metadata standard with project details as attributes.

### On-Chain Verification

Server verifies registrations by checking `txHash` against RPC, parsing tx logs for IP registration event, extracting canonical `ipId`.

### Royalty Sync Cron

Vercel cron (every 15 min). Read-only RPC calls per IP asset. No wallet needed.

### Environment Variables

| Variable | Side | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_SPG_NFT_CONTRACT` | Client | SPG NFT collection address |
| `NEXT_PUBLIC_STORY_RPC_URL` | Client | Aeneid RPC |
| `PINATA_API_KEY` | Server | IPFS pinning |
| `PINATA_SECRET_KEY` | Server | IPFS pinning |
| `STORY_RPC_URL` | Server | Verification & royalty sync |

### Dependencies

New:
- `@story-protocol/core-sdk` — Story Protocol SDK
- `pinata-web3` or `@pinata/sdk` — IPFS uploads

Existing (no changes):
- `viem` — transitive dep of Dynamic Labs
- `@dynamic-labs/ethereum` + `@dynamic-labs/sdk-react-core` — wallet connection

## Network

- **Aeneid testnet only** (chain ID 1315)
- RPC: `https://aeneid.storyrpc.io`
- Currency: WIP (testnet token)
