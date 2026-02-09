/**
 * Workshops Service
 * Handles workshop CRUD and RSVP management
 */

import { createClient } from "@/lib/supabase/client";
import type { Workshop, WorkshopRSVP, User } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

// Convert user row to User type
function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User["role"],
    avatar: row.avatar as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

export interface WorkshopsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Workshop | null>>;
  create(data: Omit<Workshop, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Workshop>>;
  update(id: string, data: Partial<Workshop>): Promise<ServiceResponse<Workshop>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  list(options?: QueryOptions & { status?: Workshop["status"]; category?: string; isEvergreen?: boolean }): Promise<PaginatedResponse<Workshop>>;
  getByCohort(cohortId: string): Promise<ServiceResponse<Workshop[]>>;
  getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Workshop[]>>;
  getByDateRange(start: Date, end: Date): Promise<ServiceResponse<Workshop[]>>;

  // RSVPs
  getRSVPs(workshopId: string): Promise<ServiceResponse<WorkshopRSVP[]>>;
  getUserRSVPs(userId: string): Promise<ServiceResponse<WorkshopRSVP[]>>;
  createRSVP(workshopId: string, userId: string): Promise<ServiceResponse<WorkshopRSVP>>;
  cancelRSVP(rsvpId: string): Promise<ServiceResponse<void>>;
}

// Convert database row to Workshop type
function toWorkshop(
  row: Record<string, unknown>,
  cohortIds?: string[]
): Workshop {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    content: row.content as string | undefined,
    videoUrl: row.video_url as string | undefined,
    articleUrl: row.article_url as string | undefined,
    partnerName: row.partner_name as string | undefined,
    partnerLogo: row.partner_logo as string | undefined,
    sponsorOrgId: row.sponsor_org_id as string | undefined,
    createdBy: row.host_id as string | undefined,
    category: row.category as string,
    duration: row.duration != null ? String(row.duration) : undefined,
    status: row.status as Workshop["status"],
    publishedAt: row.published_at ? new Date(row.published_at as string) : undefined,
    isEvergreen: row.is_evergreen as boolean,
    cohortIds: cohortIds || [],
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at as string) : undefined,
    endTime: row.end_time ? new Date(row.end_time as string) : undefined,
    timezone: row.timezone as string | undefined,
    isLive: row.is_live as boolean | undefined,
    maxAttendees: row.max_attendees as number | undefined,
    location: row.location as string | undefined,
    meetingUrl: row.meeting_url as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Convert database row to WorkshopRSVP type
function toWorkshopRSVP(row: Record<string, unknown>, user?: User): WorkshopRSVP {
  return {
    id: row.id as string,
    workshopId: row.workshop_id as string,
    userId: row.user_id as string,
    user,
    status: row.status as WorkshopRSVP["status"],
    registeredAt: new Date(row.registered_at as string),
  };
}

// Helper to fetch workshop with related data
async function fetchWorkshopWithRelations(
  supabase: ReturnType<typeof createClient>,
  workshopId: string
): Promise<Workshop | null> {
  const { data: workshopData, error: workshopError } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (workshopError) return null;

  // Get cohort IDs
  const { data: cohortData } = await supabase
    .from("workshop_cohorts")
    .select("cohort_id")
    .eq("workshop_id", workshopId);

  const cohortIds = (cohortData || []).map((c) => c.cohort_id);

  return toWorkshop(workshopData, cohortIds);
}

// CRUD

async function getById(id: string): Promise<ServiceResponse<Workshop | null>> {
  const supabase = createClient();
  const workshop = await fetchWorkshopWithRelations(supabase, id);
  return success(workshop);
}

async function create(
  data: Omit<Workshop, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResponse<Workshop>> {
  const supabase = createClient();

  // Verify authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Unauthorized");

  const { data: userData } = await supabase.from("users").select("sponsor_org_id, role").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    if (!userData?.sponsor_org_id) return error("Not a sponsor");
    if (data.sponsorOrgId && data.sponsorOrgId !== userData.sponsor_org_id) {
      return error("Cannot create workshops for another sponsor organization");
    }
  }

  const dbData = {
    title: data.title,
    description: data.description,
    content: data.content,
    video_url: data.videoUrl,
    article_url: data.articleUrl,
    partner_name: data.partnerName,
    partner_logo: data.partnerLogo,
    sponsor_org_id: data.sponsorOrgId,
    host_id: data.createdBy,
    category: data.category,
    duration: data.duration ? parseInt(data.duration, 10) || null : null,
    status: data.status || "draft",
    published_at: data.publishedAt?.toISOString(),
    is_evergreen: data.isEvergreen,
    scheduled_at: data.scheduledAt?.toISOString(),
    end_time: data.endTime?.toISOString(),
    timezone: data.timezone,
    is_live: data.isLive,
    max_attendees: data.maxAttendees,
    location: data.location,
    meeting_url: data.meetingUrl,
  };

  const { data: created, error: dbError } = await supabase
    .from("workshops")
    .insert(dbData)
    .select("id")
    .maybeSingle();

  if (dbError) {
    return error(dbError.message);
  }

  if (!created) {
    return error("Failed to retrieve created workshop");
  }

  // Add cohort associations
  if (data.cohortIds && data.cohortIds.length > 0) {
    const cohortInserts = data.cohortIds.map((cohortId) => ({
      workshop_id: created.id,
      cohort_id: cohortId,
    }));
    await supabase.from("workshop_cohorts").insert(cohortInserts);
  }

  const workshop = await fetchWorkshopWithRelations(supabase, created.id);
  return success(workshop!);
}

async function update(id: string, data: Partial<Workshop>): Promise<ServiceResponse<Workshop>> {
  const supabase = createClient();

  // Verify authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Unauthorized");

  const { data: userData } = await supabase.from("users").select("sponsor_org_id, role").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    if (!userData?.sponsor_org_id) return error("Not a sponsor");
    const { data: existingWorkshop } = await supabase.from("workshops").select("sponsor_org_id").eq("id", id).single();
    if (existingWorkshop?.sponsor_org_id !== userData.sponsor_org_id) {
      return error("Cannot update workshops for another sponsor organization");
    }
  }

  const dbData: Record<string, unknown> = {};
  if (data.title !== undefined) dbData.title = data.title;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.content !== undefined) dbData.content = data.content;
  if (data.videoUrl !== undefined) dbData.video_url = data.videoUrl;
  if (data.articleUrl !== undefined) dbData.article_url = data.articleUrl;
  if (data.partnerName !== undefined) dbData.partner_name = data.partnerName;
  if (data.partnerLogo !== undefined) dbData.partner_logo = data.partnerLogo;
  if (data.sponsorOrgId !== undefined) dbData.sponsor_org_id = data.sponsorOrgId;
  if (data.createdBy !== undefined) dbData.host_id = data.createdBy;
  if (data.category !== undefined) dbData.category = data.category;
  if (data.duration !== undefined) dbData.duration = data.duration ? parseInt(data.duration, 10) || null : null;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.publishedAt !== undefined) dbData.published_at = data.publishedAt?.toISOString();
  if (data.isEvergreen !== undefined) dbData.is_evergreen = data.isEvergreen;
  if (data.scheduledAt !== undefined) dbData.scheduled_at = data.scheduledAt?.toISOString();
  if (data.endTime !== undefined) dbData.end_time = data.endTime?.toISOString();
  if (data.timezone !== undefined) dbData.timezone = data.timezone;
  if (data.isLive !== undefined) dbData.is_live = data.isLive;
  if (data.maxAttendees !== undefined) dbData.max_attendees = data.maxAttendees;
  if (data.location !== undefined) dbData.location = data.location;
  if (data.meetingUrl !== undefined) dbData.meeting_url = data.meetingUrl;

  const { error: dbError } = await supabase
    .from("workshops")
    .update(dbData)
    .eq("id", id);

  if (dbError) {
    return error(dbError.message);
  }

  // Update cohort associations if provided
  if (data.cohortIds !== undefined) {
    // Remove existing
    await supabase.from("workshop_cohorts").delete().eq("workshop_id", id);

    // Add new
    if (data.cohortIds.length > 0) {
      const cohortInserts = data.cohortIds.map((cohortId) => ({
        workshop_id: id,
        cohort_id: cohortId,
      }));
      await supabase.from("workshop_cohorts").insert(cohortInserts);
    }
  }

  const workshop = await fetchWorkshopWithRelations(supabase, id);
  return success(workshop!);
}

async function deleteWorkshop(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  // Verify authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return error("Unauthorized");

  const { data: userData } = await supabase.from("users").select("sponsor_org_id, role").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    if (!userData?.sponsor_org_id) return error("Not a sponsor");
    const { data: existingWorkshop } = await supabase.from("workshops").select("sponsor_org_id").eq("id", id).single();
    if (existingWorkshop?.sponsor_org_id !== userData.sponsor_org_id) {
      return error("Cannot delete workshops for another sponsor organization");
    }
  }

  const { error: dbError } = await supabase
    .from("workshops")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

// Queries

async function list(
  options?: QueryOptions & { status?: Workshop["status"]; category?: string; isEvergreen?: boolean }
): Promise<PaginatedResponse<Workshop>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("workshops")
    .select("*", { count: "exact" });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.isEvergreen !== undefined) {
    query = query.eq("is_evergreen", options.isEvergreen);
  }

  if (options?.sortBy) {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      scheduledAt: "scheduled_at",
    };
    const column = columnMap[options.sortBy] || options.sortBy;
    query = query.order(column, { ascending: options.sortOrder === "asc" });
  } else {
    query = query.order("scheduled_at", { ascending: true });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return { data: [], success: false, error: dbError.message, total: 0, page, pageSize, hasMore: false };
  }

  // Fetch cohort IDs for each workshop
  const workshops: Workshop[] = [];
  for (const row of data || []) {
    const { data: cohortData } = await supabase
      .from("workshop_cohorts")
      .select("cohort_id")
      .eq("workshop_id", row.id);

    const cohortIds = (cohortData || []).map((c) => c.cohort_id);
    workshops.push(toWorkshop(row, cohortIds));
  }

  return paginated(workshops, count || 0, page, pageSize);
}

async function getByCohort(cohortId: string): Promise<ServiceResponse<Workshop[]>> {
  const supabase = createClient();

  // Get workshop IDs for this cohort
  const { data: junctionData, error: junctionError } = await supabase
    .from("workshop_cohorts")
    .select("workshop_id")
    .eq("cohort_id", cohortId);

  if (junctionError) {
    return error(junctionError.message, []);
  }

  if (!junctionData || junctionData.length === 0) {
    return success([]);
  }

  const workshopIds = junctionData.map((j) => j.workshop_id);

  const workshops: Workshop[] = [];
  for (const workshopId of workshopIds) {
    const workshop = await fetchWorkshopWithRelations(supabase, workshopId);
    if (workshop) workshops.push(workshop);
  }

  return success(workshops);
}

async function getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Workshop[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("workshops")
    .select("id")
    .eq("sponsor_org_id", sponsorOrgId)
    .order("scheduled_at", { ascending: true });

  if (dbError) {
    return error(dbError.message, []);
  }

  const workshops: Workshop[] = [];
  for (const row of data || []) {
    const workshop = await fetchWorkshopWithRelations(supabase, row.id);
    if (workshop) workshops.push(workshop);
  }

  return success(workshops);
}

async function getByDateRange(start: Date, end: Date): Promise<ServiceResponse<Workshop[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("workshops")
    .select("id")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });

  if (dbError) {
    return error(dbError.message, []);
  }

  const workshops: Workshop[] = [];
  for (const row of data || []) {
    const workshop = await fetchWorkshopWithRelations(supabase, row.id);
    if (workshop) workshops.push(workshop);
  }

  return success(workshops);
}

// RSVPs

async function getRSVPs(workshopId: string): Promise<ServiceResponse<WorkshopRSVP[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("workshop_rsvps")
    .select(`
      *,
      users (*)
    `)
    .eq("workshop_id", workshopId)
    .order("registered_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const rsvps = (data || []).map((row) => {
    const user = row.users ? toUser(row.users as Record<string, unknown>) : undefined;
    return toWorkshopRSVP(row, user);
  });

  return success(rsvps);
}

async function getUserRSVPs(userId: string): Promise<ServiceResponse<WorkshopRSVP[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("workshop_rsvps")
    .select("*")
    .eq("user_id", userId)
    .order("registered_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const rsvps = (data || []).map((row) => toWorkshopRSVP(row));

  return success(rsvps);
}

async function createRSVP(workshopId: string, userId: string): Promise<ServiceResponse<WorkshopRSVP>> {
  const supabase = createClient();

  // Check if already registered
  const { data: existing } = await supabase
    .from("workshop_rsvps")
    .select("*")
    .eq("workshop_id", workshopId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    const user = await supabase.from("users").select("*").eq("id", userId).single();
    return error(
      "Already registered for this workshop",
      toWorkshopRSVP(existing, user.data ? toUser(user.data) : undefined)
    );
  }

  const { data: created, error: dbError } = await supabase
    .from("workshop_rsvps")
    .insert({
      workshop_id: workshopId,
      user_id: userId,
      status: "registered",
    })
    .select(`
      *,
      users (*)
    `)
    .single();

  if (dbError) {
    return error(dbError.message);
  }

  const user = created.users ? toUser(created.users as Record<string, unknown>) : undefined;
  return success(toWorkshopRSVP(created, user));
}

async function cancelRSVP(rsvpId: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("workshop_rsvps")
    .delete()
    .eq("id", rsvpId);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

export const workshopsService: WorkshopsService = {
  getById,
  create,
  update,
  delete: deleteWorkshop,
  list,
  getByCohort,
  getBySponsor,
  getByDateRange,
  getRSVPs,
  getUserRSVPs,
  createRSVP,
  cancelRSVP,
};
