/**
 * Users Service
 * Handles user lookups and management
 */

import { createClient } from "@/lib/supabase/client";
import type { User, NotificationPreferences } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated } from "./types";

export interface UsersService {
  getById(id: string): Promise<ServiceResponse<User | null>>;
  getByEmail(email: string): Promise<ServiceResponse<User | null>>;
  list(options?: QueryOptions & { role?: User["role"] }): Promise<PaginatedResponse<User>>;
  update(id: string, data: Partial<User>): Promise<ServiceResponse<User>>;
}

// Convert database row to User type
function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User["role"],
    avatar: row.avatar as string | undefined,
    walletAddress: row.wallet_address as string | undefined,
    bio: row.bio as string | undefined,
    twitter: row.twitter as string | undefined,
    github: row.github as string | undefined,
    sponsorOrgId: row.sponsor_org_id as string | undefined,
    hasCompletedOnboarding: row.has_completed_onboarding as boolean | undefined,
    notificationPreferences: row.notification_preferences as NotificationPreferences | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

async function getById(id: string): Promise<ServiceResponse<User | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toUser(data));
}

async function getByEmail(email: string): Promise<ServiceResponse<User | null>> {
  const supabase = createClient();
  const { data, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return success(null);
    }
    return error(dbError.message, null);
  }

  return success(toUser(data));
}

async function list(
  options?: QueryOptions & { role?: User["role"] }
): Promise<PaginatedResponse<User>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("users").select("*", { count: "exact" });

  // Filter by role if provided
  if (options?.role) {
    query = query.eq("role", options.role);
  }

  // Sort
  if (options?.sortBy) {
    const column = options.sortBy === "createdAt" ? "created_at" : options.sortBy;
    query = query.order(column, { ascending: options.sortOrder !== "desc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Paginate
  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return { data: [], success: false, error: dbError.message, total: 0, page, pageSize, hasMore: false };
  }

  const users = (data || []).map(toUser);
  return paginated(users, count || 0, page, pageSize);
}

async function update(id: string, data: Partial<User>): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  // Convert camelCase to snake_case for database
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.twitter !== undefined) updateData.twitter = data.twitter;
  if (data.github !== undefined) updateData.github = data.github;
  if (data.walletAddress !== undefined) updateData.wallet_address = data.walletAddress;
  if (data.hasCompletedOnboarding !== undefined) updateData.has_completed_onboarding = data.hasCompletedOnboarding;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.sponsorOrgId !== undefined) updateData.sponsor_org_id = data.sponsorOrgId;
  if (data.notificationPreferences !== undefined) updateData.notification_preferences = data.notificationPreferences;

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return error(updateError.message, null as unknown as User);
  }

  return success(toUser(updated));
}

export const usersService: UsersService = {
  getById,
  getByEmail,
  list,
  update,
};
