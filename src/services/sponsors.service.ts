/**
 * Sponsors Service
 * Handles SponsorOrg and CohortSponsor operations
 */

import { createClient } from "@/lib/supabase/client";
import type { SponsorOrg, CohortSponsor, SponsorTier } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

// Type for sponsor with cohort-specific data
export type CohortSponsorWithOrg = SponsorOrg & {
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
};

export interface SponsorsService {
  // SponsorOrg operations
  getOrgById(id: string): Promise<ServiceResponse<SponsorOrg | null>>;
  getOrgByUser(userId: string): Promise<ServiceResponse<SponsorOrg | null>>;
  listOrgs(): Promise<ServiceResponse<SponsorOrg[]>>;
  createOrg(data: Omit<SponsorOrg, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<SponsorOrg>>;
  updateOrg(id: string, data: Partial<SponsorOrg>): Promise<ServiceResponse<SponsorOrg>>;
  deleteOrg(id: string): Promise<ServiceResponse<void>>;

  // CohortSponsor (junction) operations
  listCohortSponsors(): Promise<ServiceResponse<CohortSponsor[]>>;
  getCohortSponsors(cohortId: string): Promise<ServiceResponse<CohortSponsorWithOrg[]>>;
  getSponsorCohorts(sponsorOrgId: string): Promise<ServiceResponse<CohortSponsor[]>>;
  getCohortSponsor(cohortId: string, sponsorOrgId: string): Promise<ServiceResponse<CohortSponsor | null>>;
  createCohortSponsor(data: Omit<CohortSponsor, "id">): Promise<ServiceResponse<CohortSponsor>>;
  updateCohortSponsor(id: string, data: Partial<CohortSponsor>): Promise<ServiceResponse<CohortSponsor>>;
  deleteCohortSponsor(id: string): Promise<ServiceResponse<void>>;
}

// Convert database row to SponsorOrg type
function toSponsorOrg(row: Record<string, unknown>): SponsorOrg {
  return {
    id: row.id as string,
    name: row.name as string,
    logo: row.logo as string,
    website: row.website as string,
    description: row.description as string,
    contactName: row.contact_name as string,
    contactEmail: row.contact_email as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Convert database row to CohortSponsor type
function toCohortSponsor(row: Record<string, unknown>): CohortSponsor {
  return {
    id: row.id as string,
    cohortId: row.cohort_id as string,
    sponsorOrgId: row.sponsor_org_id as string,
    tier: row.tier as SponsorTier,
    prizePoolContribution: row.prize_pool_contribution as number,
    hasDedicatedTrack: row.has_dedicated_track as boolean,
    description: row.description as string | undefined,
  };
}

// SponsorOrg operations

async function getOrgById(id: string): Promise<ServiceResponse<SponsorOrg | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("sponsor_orgs")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toSponsorOrg(data));
}

async function getOrgByUser(userId: string): Promise<ServiceResponse<SponsorOrg | null>> {
  const supabase = createClient();

  // First get the user's sponsor_org_id
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("sponsor_org_id")
    .eq("id", userId)
    .single();

  if (userError || !userData?.sponsor_org_id) {
    return success(null);
  }

  // Then get the sponsor org
  const { data, error: dbError } = await supabase
    .from("sponsor_orgs")
    .select("*")
    .eq("id", userData.sponsor_org_id)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toSponsorOrg(data));
}

async function listOrgs(): Promise<ServiceResponse<SponsorOrg[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("sponsor_orgs")
    .select("*")
    .order("name", { ascending: true });

  if (dbError) {
    return error(dbError.message, []);
  }

  return success((data || []).map(toSponsorOrg));
}

async function createOrg(
  data: Omit<SponsorOrg, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResponse<SponsorOrg>> {
  const supabase = createClient();

  const dbData = {
    name: data.name,
    logo: data.logo,
    website: data.website,
    description: data.description,
    contact_name: data.contactName,
    contact_email: data.contactEmail,
  };

  const { data: created, error: dbError } = await supabase
    .from("sponsor_orgs")
    .insert(dbData)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as SponsorOrg);
  }

  return success(toSponsorOrg(created));
}

async function updateOrg(id: string, data: Partial<SponsorOrg>): Promise<ServiceResponse<SponsorOrg>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {};
  if (data.name !== undefined) dbData.name = data.name;
  if (data.logo !== undefined) dbData.logo = data.logo;
  if (data.website !== undefined) dbData.website = data.website;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.contactName !== undefined) dbData.contact_name = data.contactName;
  if (data.contactEmail !== undefined) dbData.contact_email = data.contactEmail;

  const { data: updated, error: dbError } = await supabase
    .from("sponsor_orgs")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as SponsorOrg);
  }

  return success(toSponsorOrg(updated));
}

async function deleteOrg(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("sponsor_orgs")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

// CohortSponsor operations

async function listCohortSponsors(): Promise<ServiceResponse<CohortSponsor[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("cohort_sponsors")
    .select("*");

  if (dbError) {
    return error(dbError.message, []);
  }

  return success((data || []).map(toCohortSponsor));
}

async function getCohortSponsors(cohortId: string): Promise<ServiceResponse<CohortSponsorWithOrg[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("cohort_sponsors")
    .select(`
      *,
      sponsor_orgs (*)
    `)
    .eq("cohort_id", cohortId);

  if (dbError) {
    return error(dbError.message, []);
  }

  const sponsors = (data || []).map((row) => {
    const org = row.sponsor_orgs as Record<string, unknown>;
    return {
      ...toSponsorOrg(org),
      tier: row.tier as SponsorTier,
      prizePoolContribution: row.prize_pool_contribution as number,
      hasDedicatedTrack: row.has_dedicated_track as boolean,
    };
  });

  return success(sponsors);
}

async function getSponsorCohorts(sponsorOrgId: string): Promise<ServiceResponse<CohortSponsor[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("cohort_sponsors")
    .select("*")
    .eq("sponsor_org_id", sponsorOrgId);

  if (dbError) {
    return error(dbError.message, []);
  }

  return success((data || []).map(toCohortSponsor));
}

async function getCohortSponsor(
  cohortId: string,
  sponsorOrgId: string
): Promise<ServiceResponse<CohortSponsor | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("cohort_sponsors")
    .select("*")
    .eq("cohort_id", cohortId)
    .eq("sponsor_org_id", sponsorOrgId)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toCohortSponsor(data));
}

async function createCohortSponsor(data: Omit<CohortSponsor, "id">): Promise<ServiceResponse<CohortSponsor>> {
  const supabase = createClient();

  const dbData = {
    cohort_id: data.cohortId,
    sponsor_org_id: data.sponsorOrgId,
    tier: data.tier,
    prize_pool_contribution: data.prizePoolContribution,
    has_dedicated_track: data.hasDedicatedTrack,
    description: data.description,
  };

  const { data: created, error: dbError } = await supabase
    .from("cohort_sponsors")
    .insert(dbData)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error("Sponsorship already exists for this cohort", null as unknown as CohortSponsor);
    }
    return error(dbError.message, null as unknown as CohortSponsor);
  }

  return success(toCohortSponsor(created));
}

async function updateCohortSponsor(
  id: string,
  data: Partial<CohortSponsor>
): Promise<ServiceResponse<CohortSponsor>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {};
  if (data.tier !== undefined) dbData.tier = data.tier;
  if (data.prizePoolContribution !== undefined) dbData.prize_pool_contribution = data.prizePoolContribution;
  if (data.hasDedicatedTrack !== undefined) dbData.has_dedicated_track = data.hasDedicatedTrack;
  if (data.description !== undefined) dbData.description = data.description;

  const { data: updated, error: dbError } = await supabase
    .from("cohort_sponsors")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as CohortSponsor);
  }

  return success(toCohortSponsor(updated));
}

async function deleteCohortSponsor(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("cohort_sponsors")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

export const sponsorsService: SponsorsService = {
  getOrgById,
  getOrgByUser,
  listOrgs,
  createOrg,
  updateOrg,
  deleteOrg,
  listCohortSponsors,
  getCohortSponsors,
  getSponsorCohorts,
  getCohortSponsor,
  createCohortSponsor,
  updateCohortSponsor,
  deleteCohortSponsor,
};
