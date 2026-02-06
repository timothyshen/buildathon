/**
 * Referrals Service
 * Handles referral code generation, tracking, and leaderboard queries
 */

import { createClient } from "@/lib/supabase/client";
import type { ReferralCode, Referral, ReferralLeaderboardEntry } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

export interface ReferralsService {
  getOrCreateCode(userId: string, cohortId: string): Promise<ServiceResponse<ReferralCode>>;
  getCodeByCode(code: string): Promise<ServiceResponse<ReferralCode | null>>;
  getLeaderboard(cohortId: string, limit?: number): Promise<ServiceResponse<ReferralLeaderboardEntry[]>>;
  getUserStats(userId: string, cohortId: string): Promise<ServiceResponse<{ total: number; pending: number; rank: number }>>;
  getReferralsByCohort(cohortId: string): Promise<ServiceResponse<Referral[]>>;
  getReferralsByReferrer(referrerId: string, cohortId: string): Promise<ServiceResponse<Referral[]>>;
}

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function toReferralCode(row: Record<string, unknown>): ReferralCode {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    cohortId: row.cohort_id as string,
    code: row.code as string,
    createdAt: new Date(row.created_at as string),
  };
}

function toReferral(row: Record<string, unknown>): Referral {
  return {
    id: row.id as string,
    referralCodeId: row.referral_code_id as string,
    referrerId: row.referrer_id as string,
    referredId: row.referred_id as string,
    cohortId: row.cohort_id as string,
    status: row.status as Referral["status"],
    creditedAt: row.credited_at ? new Date(row.credited_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    referrer: row.referrer ? toUser(row.referrer as Record<string, unknown>) : undefined,
    referred: row.referred ? toUser(row.referred as Record<string, unknown>) : undefined,
  };
}

function toUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as "admin" | "sponsor" | "judge" | "participant",
    avatar: row.avatar as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

class ReferralsServiceImpl implements ReferralsService {
  private get supabase() {
    return createClient();
  }

  async getOrCreateCode(userId: string, cohortId: string): Promise<ServiceResponse<ReferralCode>> {
    try {
      // Check for existing code
      const { data: existing } = await this.supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("cohort_id", cohortId)
        .single();

      if (existing) {
        return success(toReferralCode(existing as Record<string, unknown>));
      }

      // Generate a new code with collision retry
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = generateShortCode();
        const { data: created, error: insertError } = await this.supabase
          .from("referral_codes")
          .insert({ user_id: userId, cohort_id: cohortId, code })
          .select("*")
          .single();

        if (created) {
          return success(toReferralCode(created as Record<string, unknown>));
        }

        // 23505 = unique violation — could be code collision or race condition on user+cohort
        if (insertError?.code === "23505") {
          // Check if it was a user+cohort duplicate (race condition)
          const { data: raceResult } = await this.supabase
            .from("referral_codes")
            .select("*")
            .eq("user_id", userId)
            .eq("cohort_id", cohortId)
            .single();

          if (raceResult) {
            return success(toReferralCode(raceResult as Record<string, unknown>));
          }
          // Otherwise it was a code collision, retry with new code
          continue;
        }

        return error(insertError?.message || "Failed to create referral code", {} as ReferralCode);
      }

      return error("Failed to generate unique referral code", {} as ReferralCode);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", {} as ReferralCode);
    }
  }

  async getCodeByCode(code: string): Promise<ServiceResponse<ReferralCode | null>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("referral_codes")
        .select("*")
        .eq("code", code)
        .single();

      if (queryError?.code === "PGRST116") {
        return success(null);
      }

      if (queryError) {
        return error(queryError.message, null);
      }

      return success(toReferralCode(data as Record<string, unknown>));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", null);
    }
  }

  async getLeaderboard(cohortId: string, limit = 50): Promise<ServiceResponse<ReferralLeaderboardEntry[]>> {
    try {
      // Fetch all credited referrals for the cohort with referrer info
      const { data: referrals, error: queryError } = await this.supabase
        .from("referrals")
        .select("referrer_id, status, referrer:users!referrals_referrer_id_fkey(id, name, avatar)")
        .eq("cohort_id", cohortId);

      if (queryError) {
        return error(queryError.message, []);
      }

      // Aggregate in JS (matches codebase pattern of client-side aggregation)
      const statsMap = new Map<string, { name: string; avatar?: string; credited: number; pending: number }>();

      for (const row of referrals || []) {
        const referrerId = row.referrer_id as string;
        const referrer = row.referrer as Record<string, unknown> | null;

        if (!statsMap.has(referrerId)) {
          statsMap.set(referrerId, {
            name: (referrer?.name as string) || "Unknown",
            avatar: referrer?.avatar as string | undefined,
            credited: 0,
            pending: 0,
          });
        }

        const stats = statsMap.get(referrerId)!;
        if (row.status === "credited") {
          stats.credited++;
        } else {
          stats.pending++;
        }
      }

      // Sort by credited count descending, then assign ranks
      const entries: ReferralLeaderboardEntry[] = Array.from(statsMap.entries())
        .filter(([, stats]) => stats.credited > 0)
        .sort((a, b) => b[1].credited - a[1].credited)
        .slice(0, limit)
        .map(([userId, stats], index) => ({
          userId,
          userName: stats.name,
          userAvatar: stats.avatar,
          cohortId,
          totalReferrals: stats.credited,
          pendingReferrals: stats.pending,
          rank: index + 1,
        }));

      return success(entries);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", []);
    }
  }

  async getUserStats(userId: string, cohortId: string): Promise<ServiceResponse<{ total: number; pending: number; rank: number }>> {
    try {
      const { data: referrals, error: queryError } = await this.supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", userId)
        .eq("cohort_id", cohortId);

      if (queryError) {
        return error(queryError.message, { total: 0, pending: 0, rank: 0 });
      }

      const total = (referrals || []).filter((r) => r.status === "credited").length;
      const pending = (referrals || []).filter((r) => r.status === "pending").length;

      // Get rank by fetching the leaderboard
      const leaderboardRes = await this.getLeaderboard(cohortId);
      let rank = 0;
      if (leaderboardRes.success) {
        const entry = leaderboardRes.data.find((e) => e.userId === userId);
        rank = entry?.rank || 0;
      }

      return success({ total, pending, rank });
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", { total: 0, pending: 0, rank: 0 });
    }
  }

  async getReferralsByCohort(cohortId: string): Promise<ServiceResponse<Referral[]>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("referrals")
        .select("*, referrer:users!referrals_referrer_id_fkey(id, name, email, avatar, role, created_at), referred:users!referrals_referred_id_fkey(id, name, email, avatar, role, created_at)")
        .eq("cohort_id", cohortId)
        .order("created_at", { ascending: false });

      if (queryError) {
        return error(queryError.message, []);
      }

      return success((data || []).map((row) => toReferral(row as Record<string, unknown>)));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", []);
    }
  }

  async getReferralsByReferrer(referrerId: string, cohortId: string): Promise<ServiceResponse<Referral[]>> {
    try {
      const { data, error: queryError } = await this.supabase
        .from("referrals")
        .select("*, referred:users!referrals_referred_id_fkey(id, name, email, avatar, role, created_at)")
        .eq("referrer_id", referrerId)
        .eq("cohort_id", cohortId)
        .order("created_at", { ascending: false });

      if (queryError) {
        return error(queryError.message, []);
      }

      return success((data || []).map((row) => toReferral(row as Record<string, unknown>)));
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unknown error", []);
    }
  }
}

export const referralsService = new ReferralsServiceImpl();
