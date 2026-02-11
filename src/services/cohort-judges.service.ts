/**
 * Cohort Judges Service
 * Manages judge-to-cohort assignments
 */

import { createClient } from "@/lib/supabase/client";
import type { User, CohortJudge, Cohort } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

export interface CohortJudgeWithUser extends CohortJudge {
  judge: User;
}

export interface CohortJudgeWithCohort extends CohortJudge {
  cohort: Cohort;
}

export interface CohortJudgesService {
  getByCohort(cohortId: string): Promise<ServiceResponse<CohortJudgeWithUser[]>>;
  getByJudge(judgeId: string): Promise<ServiceResponse<CohortJudgeWithCohort[]>>;
  add(cohortId: string, judgeId: string): Promise<ServiceResponse<CohortJudge>>;
  remove(id: string): Promise<ServiceResponse<void>>;
}

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User["role"],
    avatar: row.avatar as string | undefined,
    bio: row.bio as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function toCohort(row: Record<string, unknown>): Cohort {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
    startDate: new Date(row.start_date as string),
    endDate: new Date(row.end_date as string),
    submissionDeadline: new Date(row.submission_deadline as string),
    judgingStart: new Date(row.judging_start as string),
    judgingEnd: new Date(row.judging_end as string),
    status: row.status as Cohort["status"],
    isPublic: row.is_public as boolean,
    maxTeamSize: row.max_team_size as number,
    minReviewsPerSubmission: (row.min_reviews_per_submission as number) ?? 3,
  };
}

async function getByCohort(cohortId: string): Promise<ServiceResponse<CohortJudgeWithUser[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("cohort_judges")
    .select(`
      *,
      users!cohort_judges_judge_id_fkey (*)
    `)
    .eq("cohort_id", cohortId)
    .order("created_at", { ascending: true });

  if (dbError) {
    return error(dbError.message, []);
  }

  const results = (data || []).map((row) => ({
    id: row.id as string,
    cohortId: row.cohort_id as string,
    judgeId: row.judge_id as string,
    createdAt: new Date(row.created_at as string),
    judge: toUser(row.users as unknown as Record<string, unknown>),
  }));

  return success(results);
}

async function getByJudge(judgeId: string): Promise<ServiceResponse<CohortJudgeWithCohort[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("cohort_judges")
    .select(`
      *,
      cohorts (*)
    `)
    .eq("judge_id", judgeId)
    .order("created_at", { ascending: false });

  if (dbError) {
    return error(dbError.message, []);
  }

  const results = (data || []).map((row) => ({
    id: row.id as string,
    cohortId: row.cohort_id as string,
    judgeId: row.judge_id as string,
    createdAt: new Date(row.created_at as string),
    cohort: toCohort(row.cohorts as unknown as Record<string, unknown>),
  }));

  return success(results);
}

async function add(cohortId: string, judgeId: string): Promise<ServiceResponse<CohortJudge>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("cohort_judges")
    .insert({ cohort_id: cohortId, judge_id: judgeId })
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error("Judge is already assigned to this cohort");
    }
    return error(dbError.message);
  }

  return success({
    id: data.id as string,
    cohortId: data.cohort_id as string,
    judgeId: data.judge_id as string,
    createdAt: new Date(data.created_at as string),
  });
}

async function remove(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("cohort_judges")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

export const cohortJudgesService: CohortJudgesService = {
  getByCohort,
  getByJudge,
  add,
  remove,
};
