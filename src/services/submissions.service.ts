/**
 * Submissions Service
 * Handles submission CRUD, drafts, and queries
 */

import { createClient } from "@/lib/supabase/client";
import type { Submission, Track, Team, Cohort, User, Prize } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

const DRAFT_STORAGE_KEY = "swa-submission-draft";

export interface SubmissionsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Submission | null>>;
  create(data: Omit<Submission, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Submission>>;
  update(id: string, data: Partial<Submission>): Promise<ServiceResponse<Submission>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  list(options?: QueryOptions & { status?: Submission["status"] }): Promise<PaginatedResponse<Submission>>;
  getByUser(userId: string): Promise<ServiceResponse<Submission[]>>;
  getByCohort(cohortId: string, options?: QueryOptions & { status?: Submission["status"] }): Promise<PaginatedResponse<Submission>>;
  getByTeam(teamId: string): Promise<ServiceResponse<Submission[]>>;
  getByTrack(trackId: string): Promise<ServiceResponse<Submission[]>>;

  // Status
  submit(id: string): Promise<ServiceResponse<Submission>>;
  updateStatus(id: string, status: Submission["status"]): Promise<ServiceResponse<Submission>>;

  // Draft management (localStorage)
  saveDraft(data: Partial<Submission> & { currentStep?: number }): Promise<ServiceResponse<void>>;
  getDraft(): Promise<ServiceResponse<(Partial<Submission> & { currentStep?: number }) | null>>;
  clearDraft(): Promise<ServiceResponse<void>>;
}

// Convert database row to Submission type
function toSubmission(
  row: Record<string, unknown>,
  tracks?: Track[],
  team?: Team,
  cohort?: Cohort
): Submission {
  return {
    id: row.id as string,
    cohortId: row.cohort_id as string,
    cohort,
    teamId: (row.team_id as string) || undefined,
    team,
    createdBy: row.created_by as string,
    trackId: tracks?.[0]?.id,
    trackIds: tracks?.map((t) => t.id),
    track: tracks?.[0],
    tracks,
    title: row.title as string,
    tagline: row.tagline as string | undefined,
    description: row.description as string,
    demoUrl: row.demo_url as string | undefined,
    videoUrl: row.video_url as string | undefined,
    repoUrl: row.repo_url as string | undefined,
    presentationUrl: row.presentation_url as string | undefined,
    screenshots: (row.screenshots as string[]) || [],
    techStack: (row.tech_stack as string[]) || [],
    builtWithStory: row.built_with_story as boolean,
    ipAssetId: row.ip_asset_id as string | undefined,
    ipRegisteredAt: row.ip_registered_at ? new Date(row.ip_registered_at as string) : undefined,
    ipLicenseType: row.ip_license_type as Submission["ipLicenseType"],
    status: row.status as Submission["status"],
    submittedAt: row.submitted_at ? new Date(row.submitted_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Helper to fetch team with members (for submission relations)
async function fetchTeamForSubmission(
  supabase: ReturnType<typeof createClient>,
  teamId: string
): Promise<Team | null> {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError) return null;

  const { data: membersData } = await supabase
    .from("team_members")
    .select(`
      role,
      joined_at,
      users (*)
    `)
    .eq("team_id", teamId);

  const members = (membersData || []).map((m) => {
    const u = m.users as Record<string, unknown>;
    return {
      userId: u.id as string,
      user: {
        id: u.id as string,
        email: u.email as string,
        name: u.name as string,
        role: u.role as User["role"],
        avatar: u.avatar as string | undefined,
        walletAddress: u.wallet_address as string | undefined,
        bio: u.bio as string | undefined,
        twitter: u.twitter as string | undefined,
        github: u.github as string | undefined,
        createdAt: new Date(u.created_at as string),
      } as User,
      role: m.role as "lead" | "member",
      joinedAt: new Date(m.joined_at as string),
    };
  });

  return {
    id: teamData.id as string,
    cohortId: teamData.cohort_id as string,
    name: teamData.name as string,
    slug: teamData.slug as string,
    description: teamData.description as string | undefined,
    logoUrl: teamData.logo_url as string | undefined,
    members,
  };
}

// Helper to fetch submission with related data
async function fetchSubmissionWithRelations(
  supabase: ReturnType<typeof createClient>,
  submissionId: string
): Promise<Submission | null> {
  const { data: subData, error: subError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (subError) return null;

  // Get tracks, team, and cohort in parallel
  const [trackResult, team, cohortResult] = await Promise.all([
    supabase
      .from("submission_tracks")
      .select(`
        tracks (
          *,
          sponsor_orgs (name, logo)
        )
      `)
      .eq("submission_id", submissionId),
    subData.team_id
      ? fetchTeamForSubmission(supabase, subData.team_id)
      : Promise.resolve(null),
    supabase
      .from("cohorts")
      .select("*")
      .eq("id", subData.cohort_id)
      .single(),
  ]);

  const tracks = (trackResult.data || []).map((t) => {
    const track = t.tracks as Record<string, unknown>;
    const sponsor = track.sponsor_orgs as { name: string; logo: string } | null;
    return {
      id: track.id as string,
      cohortId: track.cohort_id as string,
      sponsorOrgId: track.sponsor_org_id as string | undefined,
      name: track.name as string,
      description: track.description as string,
      prizePool: track.prize_pool as string | undefined,
      requirements: (track.requirements as string[]) || [],
      sponsorName: sponsor?.name,
      sponsorLogo: sponsor?.logo,
    };
  });

  let cohort: Cohort | undefined;
  if (cohortResult.data) {
    const c = cohortResult.data;
    cohort = {
      id: c.id as string,
      slug: c.slug as string,
      name: c.name as string,
      description: c.description as string,
      tagline: c.tagline as string | undefined,
      bannerImage: c.banner_image as string | undefined,
      startDate: new Date(c.start_date as string),
      endDate: new Date(c.end_date as string),
      submissionDeadline: new Date(c.submission_deadline as string),
      judgingStart: new Date(c.judging_start as string),
      judgingEnd: new Date(c.judging_end as string),
      status: c.status as Cohort["status"],
      isPublic: c.is_public as boolean,
      maxTeamSize: c.max_team_size as number,
      prizes: (c.prizes as unknown as Prize[]) || [],
    };
  }

  return toSubmission(subData, tracks, team || undefined, cohort);
}

// CRUD

async function getById(id: string): Promise<ServiceResponse<Submission | null>> {
  const supabase = createClient();
  const submission = await fetchSubmissionWithRelations(supabase, id);
  return success(submission);
}

async function create(
  data: Omit<Submission, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResponse<Submission>> {
  const supabase = createClient();

  // Validate team belongs to the specified cohort
  if (data.teamId && data.cohortId) {
    const { data: teamRow, error: teamError } = await supabase
      .from("teams")
      .select("cohort_id")
      .eq("id", data.teamId)
      .single();

    if (teamError || !teamRow) {
      return error("Team not found", null as unknown as Submission);
    }

    if (teamRow.cohort_id !== data.cohortId) {
      return error("Team does not belong to the selected cohort", null as unknown as Submission);
    }
  }

  // Validate tracks belong to the cohort
  if (data.trackIds && data.trackIds.length > 0 && data.cohortId) {
    const { data: trackRows } = await supabase
      .from("tracks")
      .select("id, cohort_id")
      .in("id", data.trackIds);

    const invalidTracks = (trackRows || []).filter(
      (t) => t.cohort_id !== data.cohortId
    );
    if (invalidTracks.length > 0) {
      return error("Selected tracks do not belong to the submission's cohort", null as unknown as Submission);
    }
  }

  const dbData = {
    cohort_id: data.cohortId,
    team_id: data.teamId || null,
    created_by: data.createdBy,
    title: data.title,
    tagline: data.tagline,
    description: data.description,
    demo_url: data.demoUrl,
    video_url: data.videoUrl,
    repo_url: data.repoUrl,
    presentation_url: data.presentationUrl,
    screenshots: data.screenshots,
    tech_stack: data.techStack,
    built_with_story: data.builtWithStory,
    status: data.status || "draft",
  };

  const { data: created, error: dbError } = await supabase
    .from("submissions")
    .insert(dbData)
    .select()
    .maybeSingle();

  if (dbError) {
    return error(dbError.message, null as unknown as Submission);
  }

  if (!created) {
    return error("Failed to retrieve created submission", null as unknown as Submission);
  }

  // Add track associations
  if (data.trackIds && data.trackIds.length > 0) {
    const trackInserts = data.trackIds.map((trackId) => ({
      submission_id: created.id,
      track_id: trackId,
    }));
    await supabase.from("submission_tracks").insert(trackInserts);
  }

  const submission = await fetchSubmissionWithRelations(supabase, created.id);
  if (!submission) {
    return error("Failed to fetch created submission", null as unknown as Submission);
  }
  return success(submission);
}

async function update(id: string, data: Partial<Submission>): Promise<ServiceResponse<Submission>> {
  const supabase = createClient();

  // Validate track-cohort consistency if tracks are being updated
  if (data.trackIds && data.trackIds.length > 0) {
    const { data: subRow } = await supabase
      .from("submissions")
      .select("cohort_id")
      .eq("id", id)
      .single();

    const cohortId = data.cohortId || subRow?.cohort_id;
    if (cohortId) {
      const { data: trackRows } = await supabase
        .from("tracks")
        .select("id, cohort_id")
        .in("id", data.trackIds);

      const invalidTracks = (trackRows || []).filter(
        (t) => t.cohort_id !== cohortId
      );
      if (invalidTracks.length > 0) {
        return error("Selected tracks do not belong to the submission's cohort", null as unknown as Submission);
      }
    }
  }

  const dbData: Record<string, unknown> = {};
  if (data.title !== undefined) dbData.title = data.title;
  if (data.tagline !== undefined) dbData.tagline = data.tagline;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.demoUrl !== undefined) dbData.demo_url = data.demoUrl;
  if (data.videoUrl !== undefined) dbData.video_url = data.videoUrl;
  if (data.repoUrl !== undefined) dbData.repo_url = data.repoUrl;
  if (data.presentationUrl !== undefined) dbData.presentation_url = data.presentationUrl;
  if (data.screenshots !== undefined) dbData.screenshots = data.screenshots;
  if (data.techStack !== undefined) dbData.tech_stack = data.techStack;
  if (data.builtWithStory !== undefined) dbData.built_with_story = data.builtWithStory;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.ipAssetId !== undefined) dbData.ip_asset_id = data.ipAssetId;
  if (data.ipRegisteredAt !== undefined) dbData.ip_registered_at = data.ipRegisteredAt?.toISOString();
  if (data.ipLicenseType !== undefined) dbData.ip_license_type = data.ipLicenseType;

  const { error: dbError } = await supabase
    .from("submissions")
    .update(dbData)
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, null as unknown as Submission);
  }

  // Update track associations if provided
  if (data.trackIds !== undefined) {
    // Remove existing
    await supabase.from("submission_tracks").delete().eq("submission_id", id);

    // Add new
    if (data.trackIds.length > 0) {
      const trackInserts = data.trackIds.map((trackId) => ({
        submission_id: id,
        track_id: trackId,
      }));
      await supabase.from("submission_tracks").insert(trackInserts);
    }
  }

  const submission = await fetchSubmissionWithRelations(supabase, id);
  return success(submission!);
}

async function deleteSubmission(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("submissions")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

// Queries

async function list(
  options?: QueryOptions & { status?: Submission["status"] }
): Promise<PaginatedResponse<Submission>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("submissions").select("*", { count: "exact" });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.sortBy) {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      submittedAt: "submitted_at",
    };
    const column = columnMap[options.sortBy] || options.sortBy;
    query = query.order(column, { ascending: options.sortOrder === "asc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return { data: [], success: false, error: dbError.message, total: 0, page, pageSize, hasMore: false };
  }

  const submissions: Submission[] = [];
  for (const row of data || []) {
    const sub = await fetchSubmissionWithRelations(supabase, row.id);
    if (sub) submissions.push(sub);
  }

  return paginated(submissions, count || 0, page, pageSize);
}

async function getByUser(userId: string): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  // Get team IDs for the user
  const { data: memberData } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (memberData || []).map((m) => m.team_id);

  // Query submissions: team-based OR solo (created_by with null team_id)
  let query = supabase
    .from("submissions")
    .select("id")
    .order("created_at", { ascending: false });

  if (teamIds.length > 0) {
    query = query.or(
      `team_id.in.(${teamIds.join(",")}),and(created_by.eq.${userId},team_id.is.null)`
    );
  } else {
    query = query.eq("created_by", userId).is("team_id", null);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return error(dbError.message, []);
  }

  const submissions: Submission[] = [];
  for (const row of data || []) {
    const sub = await fetchSubmissionWithRelations(supabase, row.id);
    if (sub) submissions.push(sub);
  }

  return success(submissions);
}

async function getByCohort(
  cohortId: string,
  options?: QueryOptions & { status?: Submission["status"] }
): Promise<PaginatedResponse<Submission>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("submissions")
    .select("*", { count: "exact" })
    .eq("cohort_id", cohortId);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.sortBy) {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      submittedAt: "submitted_at",
    };
    const column = columnMap[options.sortBy] || options.sortBy;
    query = query.order(column, { ascending: options.sortOrder === "asc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return { data: [], success: false, error: dbError.message, total: 0, page, pageSize, hasMore: false };
  }

  const submissions: Submission[] = [];
  for (const row of data || []) {
    const sub = await fetchSubmissionWithRelations(supabase, row.id);
    if (sub) submissions.push(sub);
  }

  return paginated(submissions, count || 0, page, pageSize);
}

async function getByTeam(teamId: string): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("submissions")
    .select("id")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const submissions: Submission[] = [];
  for (const row of data || []) {
    const sub = await fetchSubmissionWithRelations(supabase, row.id);
    if (sub) submissions.push(sub);
  }

  return success(submissions);
}

async function getByTrack(trackId: string): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("submission_tracks")
    .select("submission_id")
    .eq("track_id", trackId);

  if (dbError) {
    return error(dbError.message, []);
  }

  const submissions: Submission[] = [];
  for (const row of data || []) {
    const sub = await fetchSubmissionWithRelations(supabase, row.submission_id);
    if (sub) submissions.push(sub);
  }

  return success(submissions);
}

// Status

async function submit(id: string): Promise<ServiceResponse<Submission>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("submissions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, null as unknown as Submission);
  }

  const submission = await fetchSubmissionWithRelations(supabase, id);
  return success(submission!);
}

async function updateStatus(
  id: string,
  status: Submission["status"]
): Promise<ServiceResponse<Submission>> {
  return update(id, { status });
}

// Draft management (localStorage)

async function saveDraft(
  data: Partial<Submission> & { currentStep?: number }
): Promise<ServiceResponse<void>> {
  if (typeof window !== "undefined") {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  }
  return success(undefined);
}

async function getDraft(): Promise<ServiceResponse<(Partial<Submission> & { currentStep?: number }) | null>> {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      try {
        return success(JSON.parse(stored));
      } catch {
        return success(null);
      }
    }
  }
  return success(null);
}

async function clearDraft(): Promise<ServiceResponse<void>> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
  return success(undefined);
}

export const submissionsService: SubmissionsService = {
  getById,
  create,
  update,
  delete: deleteSubmission,
  list,
  getByUser,
  getByCohort,
  getByTeam,
  getByTrack,
  submit,
  updateStatus,
  saveDraft,
  getDraft,
  clearDraft,
};
