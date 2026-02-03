/**
 * Traction Service
 * Handles post-hackathon traction tracking for submissions
 */

import { createClient } from "@/lib/supabase/client";
import type {
  SubmissionTraction,
  TractionSnapshot,
  TractionMilestone,
  MilestoneType,
} from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

export interface TractionService {
  // Traction config
  getTraction(submissionId: string): Promise<ServiceResponse<SubmissionTraction | null>>;
  upsertTraction(
    submissionId: string,
    data: Partial<Omit<SubmissionTraction, "id" | "submissionId" | "createdAt" | "updatedAt">>
  ): Promise<ServiceResponse<SubmissionTraction>>;

  // Snapshots
  getSnapshots(submissionId: string): Promise<ServiceResponse<TractionSnapshot[]>>;
  getLatestSnapshot(submissionId: string): Promise<ServiceResponse<TractionSnapshot | null>>;
  createSnapshot(
    submissionId: string,
    data: Omit<TractionSnapshot, "id" | "submissionId" | "createdAt">
  ): Promise<ServiceResponse<TractionSnapshot>>;

  // Milestones
  getMilestones(submissionId: string): Promise<ServiceResponse<TractionMilestone[]>>;
  createMilestone(
    submissionId: string,
    data: Omit<TractionMilestone, "id" | "submissionId" | "verified" | "verifiedBy" | "verifiedAt" | "createdAt">
  ): Promise<ServiceResponse<TractionMilestone>>;
  updateMilestone(
    id: string,
    data: Partial<Omit<TractionMilestone, "id" | "submissionId" | "createdAt">>
  ): Promise<ServiceResponse<TractionMilestone>>;
  deleteMilestone(id: string): Promise<ServiceResponse<void>>;
  verifyMilestone(id: string, verified: boolean): Promise<ServiceResponse<TractionMilestone>>;
}

// Convert database row to SubmissionTraction type
function toTraction(row: Record<string, unknown>): SubmissionTraction {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    testnetContractAddress: row.testnet_contract_address as string | undefined,
    mainnetContractAddress: row.mainnet_contract_address as string | undefined,
    contractDeployedAt: row.contract_deployed_at
      ? new Date(row.contract_deployed_at as string)
      : undefined,
    twitterHandle: row.twitter_handle as string | undefined,
    twitterUserId: row.twitter_user_id as string | undefined,
    websiteUrl: row.website_url as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Convert database row to TractionSnapshot type
function toSnapshot(row: Record<string, unknown>): TractionSnapshot {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    snapshotDate: new Date(row.snapshot_date as string),
    reportedDau: row.reported_dau as number | undefined,
    reportedMau: row.reported_mau as number | undefined,
    reportedMonthlyVisits: row.reported_monthly_visits as number | undefined,
    onchainTxCount: row.onchain_tx_count as number | undefined,
    onchainUniqueAddresses: row.onchain_unique_addresses as number | undefined,
    onchainTvlUsd: row.onchain_tvl_usd as number | undefined,
    twitterFollowers: row.twitter_followers as number | undefined,
    twitterImpressions7d: row.twitter_impressions_7d as number | undefined,
    twitterEngagement7d: row.twitter_engagement_7d as number | undefined,
    dataSource: row.data_source as "manual" | "api" | "both",
    createdAt: new Date(row.created_at as string),
  };
}

// Convert database row to TractionMilestone type
function toMilestone(row: Record<string, unknown>): TractionMilestone {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    milestoneType: row.milestone_type as MilestoneType,
    title: row.title as string,
    description: row.description as string | undefined,
    achievedAt: new Date(row.achieved_at as string),
    verified: row.verified as boolean,
    verifiedBy: row.verified_by as string | undefined,
    verifiedAt: row.verified_at ? new Date(row.verified_at as string) : undefined,
    proofUrl: row.proof_url as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

async function getTraction(
  submissionId: string
): Promise<ServiceResponse<SubmissionTraction | null>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("submission_traction")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null);
  }

  return success(data ? toTraction(data) : null);
}

async function upsertTraction(
  submissionId: string,
  data: Partial<Omit<SubmissionTraction, "id" | "submissionId" | "createdAt" | "updatedAt">>
): Promise<ServiceResponse<SubmissionTraction>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {
    submission_id: submissionId,
    updated_at: new Date().toISOString(),
  };

  if (data.testnetContractAddress !== undefined)
    dbData.testnet_contract_address = data.testnetContractAddress;
  if (data.mainnetContractAddress !== undefined)
    dbData.mainnet_contract_address = data.mainnetContractAddress;
  if (data.contractDeployedAt !== undefined)
    dbData.contract_deployed_at = data.contractDeployedAt?.toISOString();
  if (data.twitterHandle !== undefined) dbData.twitter_handle = data.twitterHandle;
  if (data.twitterUserId !== undefined) dbData.twitter_user_id = data.twitterUserId;
  if (data.websiteUrl !== undefined) dbData.website_url = data.websiteUrl;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error: dbError } = await (supabase as any)
    .from("submission_traction")
    .upsert(dbData, { onConflict: "submission_id" })
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as SubmissionTraction);
  }

  return success(toTraction(result));
}

async function getSnapshots(
  submissionId: string
): Promise<ServiceResponse<TractionSnapshot[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("traction_snapshots")
    .select("*")
    .eq("submission_id", submissionId)
    .order("snapshot_date", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  return success((data || []).map(toSnapshot));
}

async function getLatestSnapshot(
  submissionId: string
): Promise<ServiceResponse<TractionSnapshot | null>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("traction_snapshots")
    .select("*")
    .eq("submission_id", submissionId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null);
  }

  return success(data ? toSnapshot(data) : null);
}

async function createSnapshot(
  submissionId: string,
  data: Omit<TractionSnapshot, "id" | "submissionId" | "createdAt">
): Promise<ServiceResponse<TractionSnapshot>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {
    submission_id: submissionId,
    snapshot_date: data.snapshotDate instanceof Date
      ? data.snapshotDate.toISOString().split("T")[0]
      : data.snapshotDate,
    data_source: data.dataSource || "manual",
  };

  if (data.reportedDau !== undefined) dbData.reported_dau = data.reportedDau;
  if (data.reportedMau !== undefined) dbData.reported_mau = data.reportedMau;
  if (data.reportedMonthlyVisits !== undefined)
    dbData.reported_monthly_visits = data.reportedMonthlyVisits;
  if (data.onchainTxCount !== undefined) dbData.onchain_tx_count = data.onchainTxCount;
  if (data.onchainUniqueAddresses !== undefined)
    dbData.onchain_unique_addresses = data.onchainUniqueAddresses;
  if (data.onchainTvlUsd !== undefined) dbData.onchain_tvl_usd = data.onchainTvlUsd;
  if (data.twitterFollowers !== undefined) dbData.twitter_followers = data.twitterFollowers;
  if (data.twitterImpressions7d !== undefined)
    dbData.twitter_impressions_7d = data.twitterImpressions7d;
  if (data.twitterEngagement7d !== undefined)
    dbData.twitter_engagement_7d = data.twitterEngagement7d;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error: dbError } = await (supabase as any)
    .from("traction_snapshots")
    .insert(dbData)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as TractionSnapshot);
  }

  return success(toSnapshot(result));
}

async function getMilestones(
  submissionId: string
): Promise<ServiceResponse<TractionMilestone[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("traction_milestones")
    .select("*")
    .eq("submission_id", submissionId)
    .order("achieved_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  return success((data || []).map(toMilestone));
}

async function createMilestone(
  submissionId: string,
  data: Omit<TractionMilestone, "id" | "submissionId" | "verified" | "verifiedBy" | "verifiedAt" | "createdAt">
): Promise<ServiceResponse<TractionMilestone>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {
    submission_id: submissionId,
    milestone_type: data.milestoneType,
    title: data.title,
    achieved_at: data.achievedAt instanceof Date
      ? data.achievedAt.toISOString().split("T")[0]
      : data.achievedAt,
  };

  if (data.description !== undefined) dbData.description = data.description;
  if (data.proofUrl !== undefined) dbData.proof_url = data.proofUrl;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error: dbError } = await (supabase as any)
    .from("traction_milestones")
    .insert(dbData)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as TractionMilestone);
  }

  return success(toMilestone(result));
}

async function updateMilestone(
  id: string,
  data: Partial<Omit<TractionMilestone, "id" | "submissionId" | "createdAt">>
): Promise<ServiceResponse<TractionMilestone>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {};

  if (data.milestoneType !== undefined) dbData.milestone_type = data.milestoneType;
  if (data.title !== undefined) dbData.title = data.title;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.achievedAt !== undefined)
    dbData.achieved_at = data.achievedAt instanceof Date
      ? data.achievedAt.toISOString().split("T")[0]
      : data.achievedAt;
  if (data.proofUrl !== undefined) dbData.proof_url = data.proofUrl;
  if (data.verified !== undefined) dbData.verified = data.verified;
  if (data.verifiedBy !== undefined) dbData.verified_by = data.verifiedBy;
  if (data.verifiedAt !== undefined)
    dbData.verified_at = data.verifiedAt?.toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error: dbError } = await (supabase as any)
    .from("traction_milestones")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as TractionMilestone);
  }

  return success(toMilestone(result));
}

async function deleteMilestone(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("traction_milestones")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

async function verifyMilestone(
  id: string,
  verified: boolean
): Promise<ServiceResponse<TractionMilestone>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbData: Record<string, unknown> = {
    verified,
    verified_by: verified ? user?.id : null,
    verified_at: verified ? new Date().toISOString() : null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error: dbError } = await (supabase as any)
    .from("traction_milestones")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as TractionMilestone);
  }

  return success(toMilestone(result));
}

export const tractionService: TractionService = {
  getTraction,
  upsertTraction,
  getSnapshots,
  getLatestSnapshot,
  createSnapshot,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  verifyMilestone,
};
