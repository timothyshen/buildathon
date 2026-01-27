/**
 * Auth Service
 * Handles authentication and session management
 */

import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

export interface OnboardingData {
  name: string;
  bio?: string;
  twitter?: string;
  github?: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<ServiceResponse<User>>;
  logout(): Promise<ServiceResponse<void>>;
  getCurrentUser(): Promise<ServiceResponse<User | null>>;
  switchRole(role: User["role"]): Promise<ServiceResponse<User>>;
  completeOnboarding(data: OnboardingData): Promise<ServiceResponse<User>>;
  updateProfile(data: Partial<User>): Promise<ServiceResponse<User>>;
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
    createdAt: new Date(row.created_at as string),
  };
}

async function login(email: string, password: string): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  // Try to sign in with existing account
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // If user not found, try to create account
    if (authError.message.includes("Invalid login credentials")) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split("@")[0],
            role: "participant",
          },
        },
      });

      if (signUpError) {
        return error(signUpError.message, null as unknown as User);
      }

      if (!signUpData.user) {
        return error("Failed to create account", null as unknown as User);
      }

      // Fetch the user profile (created by trigger)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", signUpData.user.id)
        .single();

      if (userError) {
        return error(userError.message, null as unknown as User);
      }

      return success(toUser(userData));
    }

    return error(authError.message, null as unknown as User);
  }

  if (!authData.user) {
    return error("Login failed", null as unknown as User);
  }

  // Fetch user profile
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (userError) {
    return error(userError.message, null as unknown as User);
  }

  return success(toUser(userData));
}

async function logout(): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: authError } = await supabase.auth.signOut();

  if (authError) {
    return error(authError.message, undefined);
  }

  return success(undefined);
}

async function getCurrentUser(): Promise<ServiceResponse<User | null>> {
  const supabase = createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return success(null);
  }

  // Fetch user profile
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (userError) {
    if (userError.code === "PGRST116") {
      return success(null);
    }
    return error(userError.message, null);
  }

  return success(toUser(userData));
}

async function switchRole(role: User["role"]): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return error("No user logged in", null as unknown as User);
  }

  // Update role in users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, error: userError } = await (supabase as any)
    .from("users")
    .update({ role })
    .eq("id", authUser.id)
    .select()
    .single();

  if (userError) {
    return error(userError.message, null as unknown as User);
  }

  return success(toUser(userData));
}

async function completeOnboarding(data: OnboardingData): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return error("No user logged in", null as unknown as User);
  }

  const dbData: Record<string, unknown> = {
    name: data.name,
    has_completed_onboarding: true,
  };
  if (data.bio !== undefined) dbData.bio = data.bio;
  if (data.twitter !== undefined) dbData.twitter = data.twitter;
  if (data.github !== undefined) dbData.github = data.github;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, error: userError } = await (supabase as any)
    .from("users")
    .update(dbData)
    .eq("id", authUser.id)
    .select()
    .single();

  if (userError) {
    return error(userError.message, null as unknown as User);
  }

  return success(toUser(userData));
}

async function updateProfile(data: Partial<User>): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return error("No user logged in", null as unknown as User);
  }

  const dbData: Record<string, unknown> = {};
  if (data.name !== undefined) dbData.name = data.name;
  if (data.avatar !== undefined) dbData.avatar = data.avatar;
  if (data.bio !== undefined) dbData.bio = data.bio;
  if (data.twitter !== undefined) dbData.twitter = data.twitter;
  if (data.github !== undefined) dbData.github = data.github;
  if (data.walletAddress !== undefined) dbData.wallet_address = data.walletAddress;
  if (data.hasCompletedOnboarding !== undefined) dbData.has_completed_onboarding = data.hasCompletedOnboarding;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, error: userError } = await (supabase as any)
    .from("users")
    .update(dbData)
    .eq("id", authUser.id)
    .select()
    .single();

  if (userError) {
    return error(userError.message, null as unknown as User);
  }

  return success(toUser(userData));
}

export const authService: AuthService = {
  login,
  logout,
  getCurrentUser,
  switchRole,
  completeOnboarding,
  updateProfile,
};
