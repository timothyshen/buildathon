/**
 * IP Assets Service
 * Handles reading IP assets, license terms, and royalty snapshots from Supabase
 */

import { createClient } from "@/lib/supabase/client";
import type { IpAsset, IpLicenseTerms, RoyaltySnapshot } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

export interface IpAssetWithSubmission extends IpAsset {
  submissionTitle: string;
}

export interface IpAssetWithDetails extends IpAsset {
  submissionTitle: string;
  submissionId: string;
  latestSnapshot: RoyaltySnapshot | null;
  licenseTerms: IpLicenseTerms[];
}

export interface IpAssetsService {
  getBySubmissionId(submissionId: string): Promise<ServiceResponse<IpAsset | null>>;
  getByIpId(ipId: string): Promise<ServiceResponse<IpAsset | null>>;
  getLicenseTerms(ipAssetId: string): Promise<ServiceResponse<IpLicenseTerms[]>>;
  getLatestRoyaltySnapshot(ipAssetId: string): Promise<ServiceResponse<RoyaltySnapshot | null>>;
  getDerivatives(parentIpId: string): Promise<ServiceResponse<IpAsset[]>>;
  getAllForOwner(ownerAddress: string): Promise<ServiceResponse<IpAsset[]>>;
  getAll(): Promise<ServiceResponse<IpAsset[]>>;
  getAllWithSubmissions(): Promise<ServiceResponse<IpAssetWithSubmission[]>>;
  getAllForOwnerWithDetails(ownerAddress: string): Promise<ServiceResponse<IpAssetWithDetails[]>>;
}

// --- Mappers ---

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

// --- Service functions ---

async function getBySubmissionId(submissionId: string): Promise<ServiceResponse<IpAsset | null>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null);
  }

  return success(data ? mapIpAsset(data as Record<string, unknown>) : null);
}

async function getByIpId(ipId: string): Promise<ServiceResponse<IpAsset | null>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*")
    .eq("ip_id", ipId)
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null);
  }

  return success(data ? mapIpAsset(data as Record<string, unknown>) : null);
}

async function getLicenseTerms(ipAssetId: string): Promise<ServiceResponse<IpLicenseTerms[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_license_terms")
    .select("*")
    .eq("ip_asset_id", ipAssetId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const terms = (data || []).map((row) => mapLicenseTerms(row as Record<string, unknown>));
  return success(terms);
}

async function getLatestRoyaltySnapshot(ipAssetId: string): Promise<ServiceResponse<RoyaltySnapshot | null>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("royalty_snapshots")
    .select("*")
    .eq("ip_asset_id", ipAssetId)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null);
  }

  return success(data ? mapRoyaltySnapshot(data as Record<string, unknown>) : null);
}

async function getDerivatives(parentIpId: string): Promise<ServiceResponse<IpAsset[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*")
    .eq("parent_ip_id", parentIpId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const assets = (data || []).map((row) => mapIpAsset(row as Record<string, unknown>));
  return success(assets);
}

async function getAllForOwner(ownerAddress: string): Promise<ServiceResponse<IpAsset[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*")
    .ilike("owner_address", ownerAddress)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const assets = (data || []).map((row) => mapIpAsset(row as Record<string, unknown>));
  return success(assets);
}

async function getAll(): Promise<ServiceResponse<IpAsset[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const assets = (data || []).map((row) => mapIpAsset(row as Record<string, unknown>));
  return success(assets);
}

async function getAllWithSubmissions(): Promise<ServiceResponse<IpAssetWithSubmission[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*, submissions(title)")
    .order("registered_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const assets = (data || []).map((row) => ({
    ...mapIpAsset(row as Record<string, unknown>),
    submissionTitle: (row.submissions as Record<string, unknown> | null)?.title as string || "Untitled",
  }));

  return success(assets);
}

async function getAllForOwnerWithDetails(ownerAddress: string): Promise<ServiceResponse<IpAssetWithDetails[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("ip_assets")
    .select("*, submissions(id, title), royalty_snapshots(*), ip_license_terms(*)")
    .ilike("owner_address", ownerAddress)
    .order("registered_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const assets = (data || []).map((row) => {
    const snapshots = ((row.royalty_snapshots || []) as Record<string, unknown>[])
      .map(mapRoyaltySnapshot)
      .sort((a, b) => b.snapshotAt.getTime() - a.snapshotAt.getTime());

    const submission = row.submissions as Record<string, unknown> | null;

    return {
      ...mapIpAsset(row as Record<string, unknown>),
      submissionTitle: (submission?.title as string) || "Untitled",
      submissionId: (submission?.id as string) || (row.submission_id as string),
      latestSnapshot: snapshots[0] || null,
      licenseTerms: ((row.ip_license_terms || []) as Record<string, unknown>[]).map(mapLicenseTerms),
    };
  });

  return success(assets);
}

export const ipAssetsService: IpAssetsService = {
  getBySubmissionId,
  getByIpId,
  getLicenseTerms,
  getLatestRoyaltySnapshot,
  getDerivatives,
  getAllForOwner,
  getAll,
  getAllWithSubmissions,
  getAllForOwnerWithDetails,
};
