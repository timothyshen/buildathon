/**
 * Cohorts Service
 * Handles cohort CRUD and queries
 */

import { createClient } from "@/lib/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type { Cohort, Prize } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

export interface CohortsService {
  getById(id: string): Promise<ServiceResponse<Cohort | null>>;
  getBySlug(slug: string): Promise<ServiceResponse<Cohort | null>>;
  list(options?: QueryOptions & { status?: Cohort["status"]; isPublic?: boolean }): Promise<PaginatedResponse<Cohort>>;
  create(data: Omit<Cohort, "id">): Promise<ServiceResponse<Cohort>>;
  update(id: string, data: Partial<Cohort>): Promise<ServiceResponse<Cohort>>;
  delete(id: string): Promise<ServiceResponse<void>>;
  updateStatus(id: string, status: Cohort["status"]): Promise<ServiceResponse<Cohort>>;
}

// Convert database row to Cohort type
function toCohort(row: Record<string, unknown>): Cohort {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
    tagline: row.tagline as string | undefined,
    bannerImage: row.banner_image as string | undefined,
    startDate: new Date(row.start_date as string),
    endDate: new Date(row.end_date as string),
    submissionDeadline: new Date(row.submission_deadline as string),
    judgingStart: new Date(row.judging_start as string),
    judgingEnd: new Date(row.judging_end as string),
    status: row.status as Cohort["status"],
    isPublic: row.is_public as boolean,
    maxTeamSize: row.max_team_size as number,
    prizes: (row.prizes as Prize[]) || [],
  };
}

// Convert Cohort to database format
function toDbCohort(data: Partial<Cohort>): Record<string, unknown> {
  const dbData: Record<string, unknown> = {};

  if (data.slug !== undefined) dbData.slug = data.slug;
  if (data.name !== undefined) dbData.name = data.name;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.tagline !== undefined) dbData.tagline = data.tagline;
  if (data.bannerImage !== undefined) dbData.banner_image = data.bannerImage;
  if (data.startDate !== undefined) dbData.start_date = data.startDate.toISOString();
  if (data.endDate !== undefined) dbData.end_date = data.endDate.toISOString();
  if (data.submissionDeadline !== undefined) dbData.submission_deadline = data.submissionDeadline.toISOString();
  if (data.judgingStart !== undefined) dbData.judging_start = data.judgingStart.toISOString();
  if (data.judgingEnd !== undefined) dbData.judging_end = data.judgingEnd.toISOString();
  if (data.status !== undefined) dbData.status = data.status;
  if (data.isPublic !== undefined) dbData.is_public = data.isPublic;
  if (data.maxTeamSize !== undefined) dbData.max_team_size = data.maxTeamSize;
  if (data.prizes !== undefined) dbData.prizes = data.prizes;

  return dbData;
}

async function getById(id: string): Promise<ServiceResponse<Cohort | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("cohorts")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toCohort(data));
}

async function getBySlug(slug: string): Promise<ServiceResponse<Cohort | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("cohorts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toCohort(data));
}

async function list(
  options?: QueryOptions & { status?: Cohort["status"]; isPublic?: boolean }
): Promise<PaginatedResponse<Cohort>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("cohorts").select("*", { count: "exact" });

  // Filter by status
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  // Filter by public/private
  if (options?.isPublic !== undefined) {
    query = query.eq("is_public", options.isPublic);
  }

  // Sort by start date by default (newest first)
  if (options?.sortBy) {
    const columnMap: Record<string, string> = {
      startDate: "start_date",
      endDate: "end_date",
      createdAt: "created_at",
    };
    const column = columnMap[options.sortBy] || options.sortBy;
    query = query.order(column, { ascending: options.sortOrder === "asc" });
  } else {
    query = query.order("start_date", { ascending: false });
  }

  // Paginate
  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return { data: [], success: false, error: dbError.message, total: 0, page, pageSize, hasMore: false };
  }

  const cohorts = (data || []).map(toCohort);
  return paginated(cohorts, count || 0, page, pageSize);
}

async function create(data: Omit<Cohort, "id">): Promise<ServiceResponse<Cohort>> {
  const supabase = createClient();

  const dbData = toDbCohort(data) as TablesInsert<"cohorts">;

  const { data: created, error: dbError } = await supabase
    .from("cohorts")
    .insert(dbData)
    .select()
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null as unknown as Cohort);
  }

  if (!created) {
    return error("Failed to retrieve created cohort", null as unknown as Cohort);
  }

  return success(toCohort(created));
}

async function update(id: string, data: Partial<Cohort>): Promise<ServiceResponse<Cohort>> {
  const supabase = createClient();

  const dbData = toDbCohort(data) as TablesUpdate<"cohorts">;

  const { data: updated, error: updateError } = await supabase
    .from("cohorts")
    .update(dbData)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return error(updateError.message, null as unknown as Cohort);
  }

  return success(toCohort(updated));
}

async function deleteCohort(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("cohorts")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

async function updateStatus(id: string, status: Cohort["status"]): Promise<ServiceResponse<Cohort>> {
  return update(id, { status });
}

export const cohortsService: CohortsService = {
  getById,
  getBySlug,
  list,
  create,
  update,
  delete: deleteCohort,
  updateStatus,
};
