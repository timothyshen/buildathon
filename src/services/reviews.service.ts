/**
 * Reviews Service
 * Handles review CRUD and queries
 */

import { createClient } from "@/lib/supabase/client";
import type { Review, User, Submission, Team, Cohort } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

export interface ReviewScores {
  innovationScore: number;
  executionScore: number;
  designScore: number;
  impactScore: number;
  presentationScore: number;
}

export interface SubmitReviewData extends ReviewScores {
  feedback?: string;
  internalNotes?: string;
}

export interface ReviewsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Review | null>>;
  create(data: { submissionId: string; judgeId: string }): Promise<ServiceResponse<Review>>;
  update(id: string, data: Partial<Review>): Promise<ServiceResponse<Review>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  getByJudge(judgeId: string): Promise<ServiceResponse<Review[]>>;
  getBySubmission(submissionId: string): Promise<ServiceResponse<Review[]>>;
  list(options?: QueryOptions & { status?: Review["status"]; cohortId?: string }): Promise<PaginatedResponse<Review>>;

  // Actions
  submitReview(id: string, data: SubmitReviewData): Promise<ServiceResponse<Review>>;
}

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

// Convert joined submission row to Submission type (basic fields + team)
function toSubmissionFromJoin(row: Record<string, unknown>): Submission {
  const teamRow = row.teams as Record<string, unknown> | null;
  const cohortRow = row.cohorts as Record<string, unknown> | null;

  const team: Team | undefined = teamRow
    ? {
        id: teamRow.id as string,
        cohortId: teamRow.cohort_id as string,
        name: teamRow.name as string,
        slug: teamRow.slug as string,
        description: teamRow.description as string | undefined,
        logoUrl: teamRow.logo_url as string | undefined,
        members: [],
      }
    : undefined;

  const cohort: Cohort | undefined = cohortRow
    ? {
        id: cohortRow.id as string,
        slug: cohortRow.slug as string,
        name: cohortRow.name as string,
        description: cohortRow.description as string,
        startDate: new Date(cohortRow.start_date as string),
        endDate: new Date(cohortRow.end_date as string),
        submissionDeadline: new Date(cohortRow.submission_deadline as string),
        judgingStart: new Date(cohortRow.judging_start as string),
        judgingEnd: new Date(cohortRow.judging_end as string),
        status: cohortRow.status as Cohort["status"],
        isPublic: cohortRow.is_public as boolean,
        maxTeamSize: cohortRow.max_team_size as number,
      }
    : undefined;

  return {
    id: row.id as string,
    cohortId: row.cohort_id as string,
    cohort,
    teamId: (row.team_id as string) || undefined,
    team,
    createdBy: row.created_by as string,
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
    status: row.status as Submission["status"],
    submittedAt: row.submitted_at ? new Date(row.submitted_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

// Convert database row to Review type
function toReview(row: Record<string, unknown>, judge?: User, submission?: Submission): Review {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    submission,
    judgeId: row.judge_id as string,
    judge,
    innovationScore: row.innovation_score as number | undefined,
    executionScore: row.execution_score as number | undefined,
    designScore: row.design_score as number | undefined,
    impactScore: row.impact_score as number | undefined,
    presentationScore: row.presentation_score as number | undefined,
    overallScore: row.overall_score as number | undefined,
    feedback: row.feedback as string | undefined,
    internalNotes: row.internal_notes as string | undefined,
    status: row.status as Review["status"],
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
  };
}

// CRUD

async function getById(id: string): Promise<ServiceResponse<Review | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("reviews")
    .select(`
      *,
      users!reviews_judge_id_fkey (*),
      submissions (
        *,
        teams (*),
        cohorts (*)
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

  const judge = data.users ? toUser(data.users as Record<string, unknown>) : undefined;
  const submission = data.submissions
    ? toSubmissionFromJoin(data.submissions as Record<string, unknown>)
    : undefined;
  return success(toReview(data, judge, submission));
}

async function create(data: { submissionId: string; judgeId: string }): Promise<ServiceResponse<Review>> {
  const supabase = createClient();

  const { data: created, error: dbError } = await supabase
    .from("reviews")
    .insert({
      submission_id: data.submissionId,
      judge_id: data.judgeId,
      status: "pending",
    })
    .select(`
      *,
      users!reviews_judge_id_fkey (*)
    `)
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as Review);
  }

  const judge = created.users ? toUser(created.users as Record<string, unknown>) : undefined;
  return success(toReview(created, judge));
}

async function update(id: string, data: Partial<Review>): Promise<ServiceResponse<Review>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {};
  if (data.innovationScore !== undefined) dbData.innovation_score = data.innovationScore;
  if (data.executionScore !== undefined) dbData.execution_score = data.executionScore;
  if (data.designScore !== undefined) dbData.design_score = data.designScore;
  if (data.impactScore !== undefined) dbData.impact_score = data.impactScore;
  if (data.presentationScore !== undefined) dbData.presentation_score = data.presentationScore;
  if (data.overallScore !== undefined) dbData.overall_score = data.overallScore;
  if (data.feedback !== undefined) dbData.feedback = data.feedback;
  if (data.internalNotes !== undefined) dbData.internal_notes = data.internalNotes;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.completedAt !== undefined) dbData.completed_at = data.completedAt?.toISOString();

  const { data: updated, error: dbError } = await supabase
    .from("reviews")
    .update(dbData)
    .eq("id", id)
    .select(`
      *,
      users!reviews_judge_id_fkey (*)
    `)
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as Review);
  }

  const judge = updated.users ? toUser(updated.users as Record<string, unknown>) : undefined;
  return success(toReview(updated, judge));
}

async function deleteReview(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

// Queries

async function getByJudge(judgeId: string): Promise<ServiceResponse<Review[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("reviews")
    .select(`
      *,
      users!reviews_judge_id_fkey (*),
      submissions (
        *,
        teams (*),
        cohorts (*)
      )
    `)
    .eq("judge_id", judgeId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const reviews = (data || []).map((row) => {
    const judge = row.users ? toUser(row.users as Record<string, unknown>) : undefined;
    const submission = row.submissions
      ? toSubmissionFromJoin(row.submissions as Record<string, unknown>)
      : undefined;
    return toReview(row, judge, submission);
  });

  return success(reviews);
}

async function getBySubmission(submissionId: string): Promise<ServiceResponse<Review[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("reviews")
    .select(`
      *,
      users!reviews_judge_id_fkey (*)
    `)
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const reviews = (data || []).map((row) => {
    const judge = row.users ? toUser(row.users as Record<string, unknown>) : undefined;
    return toReview(row, judge);
  });

  return success(reviews);
}

async function list(
  options?: QueryOptions & { status?: Review["status"]; cohortId?: string }
): Promise<PaginatedResponse<Review>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("reviews")
    .select(`
      *,
      users!reviews_judge_id_fkey (*),
      submissions!inner (
        *,
        teams (*),
        cohorts (*)
      )
    `, { count: "exact" });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.cohortId) {
    query = query.eq("submissions.cohort_id", options.cohortId);
  }

  if (options?.sortBy) {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      completedAt: "completed_at",
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

  const reviews = (data || []).map((row) => {
    const judge = row.users ? toUser(row.users as Record<string, unknown>) : undefined;
    const submission = row.submissions
      ? toSubmissionFromJoin(row.submissions as Record<string, unknown>)
      : undefined;
    return toReview(row, judge, submission);
  });

  return paginated(reviews, count || 0, page, pageSize);
}

// Actions

async function submitReview(id: string, data: SubmitReviewData): Promise<ServiceResponse<Review>> {
  const supabase = createClient();

  // Calculate overall score (the database trigger should also do this)
  const overallScore =
    (data.innovationScore +
      data.executionScore +
      data.designScore +
      data.impactScore +
      data.presentationScore) /
    5;

  const { data: updated, error: dbError } = await supabase
    .from("reviews")
    .update({
      innovation_score: data.innovationScore,
      execution_score: data.executionScore,
      design_score: data.designScore,
      impact_score: data.impactScore,
      presentation_score: data.presentationScore,
      overall_score: overallScore,
      feedback: data.feedback,
      internal_notes: data.internalNotes,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      users!reviews_judge_id_fkey (*)
    `)
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as Review);
  }

  const judge = updated.users ? toUser(updated.users as Record<string, unknown>) : undefined;
  return success(toReview(updated, judge));
}

export const reviewsService: ReviewsService = {
  getById,
  create,
  update,
  delete: deleteReview,
  getByJudge,
  getBySubmission,
  list,
  submitReview,
};
