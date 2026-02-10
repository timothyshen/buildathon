/**
 * Tracks Service
 * Handles track CRUD and queries
 */

import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type { Track } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

export interface TracksService {
  list(): Promise<ServiceResponse<Track[]>>;
  getById(id: string): Promise<ServiceResponse<Track | null>>;
  getByCohort(cohortId: string): Promise<ServiceResponse<Track[]>>;
  getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Track[]>>;
  create(data: Omit<Track, "id">): Promise<ServiceResponse<Track>>;
  update(id: string, data: Partial<Track>): Promise<ServiceResponse<Track>>;
  delete(id: string): Promise<ServiceResponse<void>>;
}

// Convert database row to Track type
function toTrack(row: Record<string, unknown>, sponsorData?: { name: string; logo: string } | null): Track {
  return {
    id: row.id as string,
    cohortId: row.cohort_id as string,
    sponsorOrgId: row.sponsor_org_id as string | undefined,
    name: row.name as string,
    description: row.description as string,
    prizePool: row.prize_pool as string | undefined,
    requirements: (row.requirements as string[]) || [],
    sponsorName: sponsorData?.name,
    sponsorLogo: sponsorData?.logo,
  };
}

// Convert Track to database format
function toDbTrack(data: Partial<Track>): Record<string, unknown> {
  const dbData: Record<string, unknown> = {};

  if (data.cohortId !== undefined) dbData.cohort_id = data.cohortId;
  if (data.sponsorOrgId !== undefined) dbData.sponsor_org_id = data.sponsorOrgId;
  if (data.name !== undefined) dbData.name = data.name;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.prizePool !== undefined) dbData.prize_pool = data.prizePool;
  if (data.requirements !== undefined) dbData.requirements = data.requirements;

  return dbData;
}

async function list(): Promise<ServiceResponse<Track[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("tracks")
    .select(`
      *,
      sponsor_orgs (
        name,
        logo
      )
    `)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const tracks = (data || []).map((row) => {
    const sponsorData = row.sponsor_orgs as { name: string; logo: string } | null;
    return toTrack(row, sponsorData);
  });

  return success(tracks);
}

async function getById(id: string): Promise<ServiceResponse<Track | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("tracks")
    .select(`
      *,
      sponsor_orgs (
        name,
        logo
      )
    `)
    .eq("id", id)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  const sponsorData = data.sponsor_orgs as { name: string; logo: string } | null;
  return success(toTrack(data, sponsorData));
}

async function getByCohort(cohortId: string): Promise<ServiceResponse<Track[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("tracks")
    .select(`
      *,
      sponsor_orgs (
        name,
        logo
      )
    `)
    .eq("cohort_id", cohortId)
    .order("created_at", { ascending: true });

  if (dbError) {
    return error(dbError.message, []);
  }

  const tracks = (data || []).map((row) => {
    const sponsorData = row.sponsor_orgs as { name: string; logo: string } | null;
    return toTrack(row, sponsorData);
  });

  return success(tracks);
}

async function getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Track[]>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("tracks")
    .select(`
      *,
      sponsor_orgs (
        name,
        logo
      )
    `)
    .eq("sponsor_org_id", sponsorOrgId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const tracks = (data || []).map((row) => {
    const sponsorData = row.sponsor_orgs as { name: string; logo: string } | null;
    return toTrack(row, sponsorData);
  });

  return success(tracks);
}

async function create(data: Omit<Track, "id">): Promise<ServiceResponse<Track>> {
  const supabase = createClient();

  // Verify sponsor ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Unauthorized");

  const { data: userData } = await supabase.from("users").select("sponsor_org_id, role").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    if (!userData?.sponsor_org_id) return error("Not a sponsor");
    if (data.sponsorOrgId && data.sponsorOrgId !== userData.sponsor_org_id) {
      return error("Cannot create tracks for another sponsor organization");
    }
  }

  const dbData = toDbTrack(data) as TablesInsert<"tracks">;

  const { data: created, error: dbError } = await supabase
    .from("tracks")
    .insert(dbData)
    .select("*")
    .maybeSingle();

  if (dbError) {
    return error(dbError.message);
  }

  if (!created) {
    return error("Failed to retrieve created track");
  }

  // Fetch sponsor data separately (join after insert can fail with PostgREST)
  let sponsorData: { name: string; logo: string } | null = null;
  if (created.sponsor_org_id) {
    const { data: org } = await supabase
      .from("sponsor_orgs")
      .select("name, logo")
      .eq("id", created.sponsor_org_id)
      .single();
    sponsorData = org as { name: string; logo: string } | null;
  }

  return success(toTrack(created, sponsorData));
}

async function update(id: string, data: Partial<Track>): Promise<ServiceResponse<Track>> {
  const supabase = createClient();

  // Verify sponsor ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Unauthorized");

  const { data: userData } = await supabase.from("users").select("sponsor_org_id, role").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    if (!userData?.sponsor_org_id) return error("Not a sponsor");
    const { data: existingTrack } = await supabase.from("tracks").select("sponsor_org_id").eq("id", id).single();
    if (existingTrack?.sponsor_org_id !== userData.sponsor_org_id) {
      return error("Cannot update tracks for another sponsor organization");
    }
  }

  const dbData = toDbTrack(data) as TablesUpdate<"tracks">;

  const { data: updated, error: updateError } = await supabase
    .from("tracks")
    .update(dbData)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return error(updateError.message);
  }

  let sponsorData: { name: string; logo: string } | null = null;
  if (updated.sponsor_org_id) {
    const { data: org } = await supabase
      .from("sponsor_orgs")
      .select("name, logo")
      .eq("id", updated.sponsor_org_id)
      .single();
    sponsorData = org as { name: string; logo: string } | null;
  }

  return success(toTrack(updated, sponsorData));
}

async function deleteTrack(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  // Verify sponsor ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Unauthorized");

  const { data: userData } = await supabase.from("users").select("sponsor_org_id, role").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    if (!userData?.sponsor_org_id) return error("Not a sponsor");
    const { data: existingTrack } = await supabase.from("tracks").select("sponsor_org_id").eq("id", id).single();
    if (existingTrack?.sponsor_org_id !== userData.sponsor_org_id) {
      return error("Cannot delete tracks for another sponsor organization");
    }
  }

  const { error: dbError } = await supabase
    .from("tracks")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

export const tracksService: TracksService = {
  list,
  getById,
  getByCohort,
  getBySponsor,
  create,
  update,
  delete: deleteTrack,
};
