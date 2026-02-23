/**
 * Submissions Service
 * Handles submission CRUD, drafts, and queries
 */

import { createClient } from "@/lib/supabase/client";
import type { Submission, Track, Team, Cohort, User, Prize } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

const DRAFT_STORAGE_KEY = "swa-submission-draft";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SubmissionsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Submission | null>>;
  create(data: Omit<Submission, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Submission>>;
  update(id: string, data: Partial<Submission>): Promise<ServiceResponse<Submission>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  list(options?: QueryOptions & { status?: Submission["status"]; cohortId?: string; search?: string }): Promise<PaginatedResponse<Submission>>;
  getByUser(userId: string): Promise<ServiceResponse<Submission[]>>;
  getByCohort(cohortId: string, options?: QueryOptions & { status?: Submission["status"] }): Promise<PaginatedResponse<Submission>>;
  getByTeam(teamId: string): Promise<ServiceResponse<Submission[]>>;
  getByTrack(trackId: string): Promise<ServiceResponse<Submission[]>>;
  getByTracks(trackIds: string[]): Promise<ServiceResponse<Submission[]>>;
  getByTrackSponsor(sponsorOrgId: string): Promise<ServiceResponse<Submission[]>>;

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
  cohort?: Cohort,
  trackDescriptions?: Record<string, string>
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
    trackDescriptions,
    title: row.title as string,
    tagline: row.tagline as string | undefined,
    logoUrl: row.logo_url as string | undefined,
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

// Joined select string for batch queries — collapses N+1 into 1 query
const SUBMISSION_JOINED_SELECT = `
  *,
  submission_tracks(*, tracks(*, sponsor_orgs(name, logo))),
  teams(*, team_members(role, joined_at, users(*))),
  cohorts(*)
`;

// Convert a PostgREST joined row to Submission type
function toSubmissionFromJoinedRow(row: Record<string, unknown>): Submission {
  // Extract tracks and descriptions from submission_tracks junction
  const submissionTracks = (row.submission_tracks as Array<{ description?: string; tracks: Record<string, unknown> }>) || [];
  const trackDescriptions: Record<string, string> = {};
  const tracks: Track[] = submissionTracks
    .filter((st) => st.tracks)
    .map((st) => {
      const t = st.tracks;
      const sponsor = t.sponsor_orgs as { name: string; logo: string } | null;
      const trackId = t.id as string;
      if (st.description) {
        trackDescriptions[trackId] = st.description;
      }
      return {
        id: trackId,
        cohortId: t.cohort_id as string,
        sponsorOrgId: t.sponsor_org_id as string | undefined,
        name: t.name as string,
        description: t.description as string,
        prizePool: t.prize_pool as string | undefined,
        requirements: (t.requirements as string[]) || [],
        sponsorName: sponsor?.name,
        sponsorLogo: sponsor?.logo,
      };
    });

  // Extract team with members (null when team_id is null)
  const teamData = row.teams as Record<string, unknown> | null;
  let team: Team | undefined;
  if (teamData) {
    const membersData = (teamData.team_members as Array<Record<string, unknown>>) || [];
    const members = membersData.map((m) => {
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
    team = {
      id: teamData.id as string,
      cohortId: teamData.cohort_id as string,
      name: teamData.name as string,
      slug: teamData.slug as string,
      description: teamData.description as string | undefined,
      logoUrl: teamData.logo_url as string | undefined,
      members,
    };
  }

  // Extract cohort (null when cohort_id doesn't match)
  const cohortData = row.cohorts as Record<string, unknown> | null;
  let cohort: Cohort | undefined;
  if (cohortData) {
    cohort = {
      id: cohortData.id as string,
      slug: cohortData.slug as string,
      name: cohortData.name as string,
      description: cohortData.description as string,
      tagline: cohortData.tagline as string | undefined,
      bannerImage: cohortData.banner_image as string | undefined,
      startDate: new Date(cohortData.start_date as string),
      endDate: new Date(cohortData.end_date as string),
      submissionDeadline: new Date(cohortData.submission_deadline as string),
      judgingStart: new Date(cohortData.judging_start as string),
      judgingEnd: new Date(cohortData.judging_end as string),
      status: cohortData.status as Cohort["status"],
      isPublic: cohortData.is_public as boolean,
      maxTeamSize: cohortData.max_team_size as number,
      minReviewsPerSubmission: (cohortData.min_reviews_per_submission as number) ?? 3,
      prizes: (cohortData.prizes as unknown as Prize[]) || [],
    };
  }

  return toSubmission(row, tracks, team, cohort, trackDescriptions);
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
        *,
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

  const trackDescriptions: Record<string, string> = {};
  const tracks = (trackResult.data || []).map((t) => {
    const row = t as Record<string, unknown>;
    const track = row.tracks as Record<string, unknown>;
    const sponsor = track.sponsor_orgs as { name: string; logo: string } | null;
    const trackId = track.id as string;
    if (row.description) {
      trackDescriptions[trackId] = row.description as string;
    }
    return {
      id: trackId,
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
      minReviewsPerSubmission: (c.min_reviews_per_submission as number) ?? 3,
      prizes: (c.prizes as unknown as Prize[]) || [],
    };
  }

  return toSubmission(subData, tracks, team || undefined, cohort, trackDescriptions);
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
      return error("Team not found");
    }

    if (teamRow.cohort_id !== data.cohortId) {
      return error("Team does not belong to the selected cohort");
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
      return error("Selected tracks do not belong to the submission's cohort");
    }
  }

  const status = data.status || "draft";
  const dbData = {
    cohort_id: data.cohortId,
    team_id: data.teamId || null,
    created_by: data.createdBy,
    title: data.title,
    tagline: data.tagline,
    logo_url: data.logoUrl,
    description: data.description,
    demo_url: data.demoUrl,
    video_url: data.videoUrl,
    repo_url: data.repoUrl,
    presentation_url: data.presentationUrl,
    screenshots: data.screenshots,
    tech_stack: data.techStack,
    built_with_story: data.builtWithStory,
    status,
    // Set submitted_at when creating with "submitted" status
    ...(status === "submitted" ? { submitted_at: new Date().toISOString() } : {}),
  };

  const { data: created, error: dbError } = await supabase
    .from("submissions")
    .insert(dbData)
    .select()
    .maybeSingle();

  if (dbError) {
    return error(dbError.message);
  }

  if (!created) {
    return error("Failed to retrieve created submission");
  }

  // Add track associations
  if (data.trackIds && data.trackIds.length > 0) {
    const trackInserts = data.trackIds.map((trackId) => ({
      submission_id: created.id,
      track_id: trackId,
      description: data.trackDescriptions?.[trackId] || null,
    }));
    const { error: trackError } = await supabase.from("submission_tracks").insert(trackInserts);
    if (trackError) {
      return error("Submission created but failed to add tracks: " + trackError.message);
    }
  }

  const submission = await fetchSubmissionWithRelations(supabase, created.id);
  if (!submission) {
    return error("Failed to fetch created submission");
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
        return error("Selected tracks do not belong to the submission's cohort");
      }
    }
  }

  const dbData: Record<string, unknown> = {};
  if (data.title !== undefined) dbData.title = data.title;
  if (data.tagline !== undefined) dbData.tagline = data.tagline;
  if (data.logoUrl !== undefined) dbData.logo_url = data.logoUrl;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.demoUrl !== undefined) dbData.demo_url = data.demoUrl;
  if (data.videoUrl !== undefined) dbData.video_url = data.videoUrl;
  if (data.repoUrl !== undefined) dbData.repo_url = data.repoUrl;
  if (data.presentationUrl !== undefined) dbData.presentation_url = data.presentationUrl;
  if (data.screenshots !== undefined) dbData.screenshots = data.screenshots;
  if (data.techStack !== undefined) dbData.tech_stack = data.techStack;
  if (data.builtWithStory !== undefined) dbData.built_with_story = data.builtWithStory;
  if (data.status !== undefined) {
    dbData.status = data.status;
    // Set submitted_at when transitioning to "submitted"
    if (data.status === "submitted") {
      dbData.submitted_at = new Date().toISOString();
    }
  }
  if (data.ipAssetId !== undefined) dbData.ip_asset_id = data.ipAssetId;
  if (data.ipRegisteredAt !== undefined) dbData.ip_registered_at = data.ipRegisteredAt?.toISOString();
  if (data.ipLicenseType !== undefined) dbData.ip_license_type = data.ipLicenseType;

  const { data: updatedRows, error: dbError } = await supabase
    .from("submissions")
    .update(dbData)
    .eq("id", id)
    .select("id");

  if (dbError) {
    return error(dbError.message);
  }

  if (!updatedRows || updatedRows.length === 0) {
    return error("Submission not found or you don't have permission to update it");
  }

  // Update track associations if provided
  if (data.trackIds !== undefined) {
    // Remove existing
    const { error: deleteError } = await supabase.from("submission_tracks").delete().eq("submission_id", id);
    if (deleteError) {
      return error("Failed to update tracks: " + deleteError.message);
    }

    // Add new
    if (data.trackIds.length > 0) {
      const trackInserts = data.trackIds.map((trackId) => ({
        submission_id: id,
        track_id: trackId,
        description: data.trackDescriptions?.[trackId] || null,
      }));
      const { error: insertError } = await supabase.from("submission_tracks").insert(trackInserts);
      if (insertError) {
        return error("Failed to add tracks: " + insertError.message);
      }
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
  options?: QueryOptions & { status?: Submission["status"]; cohortId?: string; search?: string }
): Promise<PaginatedResponse<Submission>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("submissions").select(SUBMISSION_JOINED_SELECT, { count: "exact" });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.cohortId) {
    query = query.eq("cohort_id", options.cohortId);
  }
  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`);
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

  const submissions = (data || []).map((row) => toSubmissionFromJoinedRow(row as Record<string, unknown>));
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

  // Validate userId and teamIds before using in string interpolation
  if (!UUID_REGEX.test(userId)) {
    return error("Invalid user ID", []);
  }
  if (teamIds.some((id) => !UUID_REGEX.test(id))) {
    return error("Invalid team ID", []);
  }

  // Query submissions with all relations in a single joined query
  let query = supabase
    .from("submissions")
    .select(SUBMISSION_JOINED_SELECT)
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

  const submissions = (data || []).map((row) => toSubmissionFromJoinedRow(row as Record<string, unknown>));
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
    .select(SUBMISSION_JOINED_SELECT, { count: "exact" })
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

  const submissions = (data || []).map((row) => toSubmissionFromJoinedRow(row as Record<string, unknown>));
  return paginated(submissions, count || 0, page, pageSize);
}

async function getByTeam(teamId: string): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("submissions")
    .select(SUBMISSION_JOINED_SELECT)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const submissions = (data || []).map((row) => toSubmissionFromJoinedRow(row as Record<string, unknown>));
  return success(submissions);
}

async function getByTrack(trackId: string): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  // Get submission IDs from junction table
  const { data: junctionData, error: junctionError } = await supabase
    .from("submission_tracks")
    .select("submission_id")
    .eq("track_id", trackId);

  if (junctionError) {
    return error(junctionError.message, []);
  }

  const submissionIds = (junctionData || []).map((r) => r.submission_id);
  if (submissionIds.length === 0) {
    return success([]);
  }

  const { data, error: dbError } = await supabase
    .from("submissions")
    .select(SUBMISSION_JOINED_SELECT)
    .in("id", submissionIds)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const submissions = (data || []).map((row) => toSubmissionFromJoinedRow(row as Record<string, unknown>));
  return success(submissions);
}

async function getByTracks(trackIds: string[]): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  if (trackIds.length === 0) {
    return success([]);
  }

  // Get unique submission IDs from junction table for all tracks
  const { data: junctionData, error: junctionError } = await supabase
    .from("submission_tracks")
    .select("submission_id")
    .in("track_id", trackIds);

  if (junctionError) {
    return error(junctionError.message, []);
  }

  const submissionIds = [...new Set((junctionData || []).map((r) => r.submission_id))];
  if (submissionIds.length === 0) {
    return success([]);
  }

  const { data, error: dbError } = await supabase
    .from("submissions")
    .select(SUBMISSION_JOINED_SELECT)
    .in("id", submissionIds)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const submissions = (data || []).map((row) => toSubmissionFromJoinedRow(row as Record<string, unknown>));
  return success(submissions);
}

async function getByTrackSponsor(sponsorOrgId: string): Promise<ServiceResponse<Submission[]>> {
  const supabase = createClient();

  // Get all track IDs for this sponsor
  const { data: trackData, error: trackError } = await supabase
    .from("tracks")
    .select("id")
    .eq("sponsor_org_id", sponsorOrgId);

  if (trackError) {
    return error(trackError.message, []);
  }

  const trackIds = (trackData || []).map((t) => t.id);
  if (trackIds.length === 0) {
    return success([]);
  }

  return getByTracks(trackIds);
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
    return error(dbError.message);
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
  getByTracks,
  getByTrackSponsor,
  submit,
  updateStatus,
  saveDraft,
  getDraft,
  clearDraft,
};
