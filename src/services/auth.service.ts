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

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<ServiceResponse<User>>;
  register(data: RegisterData): Promise<ServiceResponse<User>>;
  logout(): Promise<ServiceResponse<void>>;
  getCurrentUser(): Promise<ServiceResponse<User | null>>;
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

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
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
    .maybeSingle();

  if (userError) {
    return error(userError.message, null as unknown as User);
  }

  if (!userData) {
    // User profile doesn't exist - return minimal user from auth
    return success({
      id: authData.user.id,
      email: authData.user.email || email,
      name: authData.user.user_metadata?.name || email.split("@")[0],
      role: (authData.user.user_metadata?.role as User["role"]) || "participant",
      createdAt: new Date(authData.user.created_at),
    });
  }

  return success(toUser(userData));
}

async function register(data: RegisterData): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
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

  // Check if email confirmation is required
  if (signUpData.user.identities?.length === 0) {
    return error("An account with this email already exists", null as unknown as User);
  }

  // Wait a moment for trigger to create user profile
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Fetch the user profile (created by trigger)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", signUpData.user.id)
    .maybeSingle();

  if (userError) {
    return error(userError.message, null as unknown as User);
  }

  if (!userData) {
    // Profile not created yet - create minimal user object from auth data
    return success({
      id: signUpData.user.id,
      email: signUpData.user.email || data.email,
      name: data.name,
      role: "participant",
      createdAt: new Date(),
    });
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
    .maybeSingle();

  if (userError) {
    return error(userError.message, null);
  }

  // If no profile exists but auth user does, check if account is old enough
  // that it should have a profile (indicates deleted account)
  if (!userData) {
    const createdAt = new Date(authUser.created_at);
    const accountAgeMs = Date.now() - createdAt.getTime();
    const isNewAccount = accountAgeMs < 5 * 60 * 1000; // 5 minutes

    if (!isNewAccount) {
      // Account is old but has no profile - likely deleted
      return error("ACCOUNT_DELETED", null);
    }

    // New account - allow synthetic user for onboarding
    return success({
      id: authUser.id,
      email: authUser.email || "",
      name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
      role: (authUser.user_metadata?.role as User["role"]) || "participant",
      hasCompletedOnboarding: false,
      createdAt: new Date(authUser.created_at),
    });
  }

  return success(toUser(userData));
}

async function completeOnboarding(data: OnboardingData): Promise<ServiceResponse<User>> {
  const supabase = createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return error("No user logged in", null as unknown as User);
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("users")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  // Build update data WITHOUT role - role should only be changed via admin/invites
  // This prevents race conditions where onboarding overwrites a role set by concurrent invite
  const updateData: Record<string, unknown> = {
    name: data.name,
    has_completed_onboarding: true,
  };
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.twitter !== undefined) updateData.twitter = data.twitter;
  if (data.github !== undefined) updateData.github = data.github;

  let userData;
  let userError;

  if (existingProfile) {
    // Profile exists - UPDATE without touching role (preserves sponsor/judge/admin roles)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase as any)
      .from("users")
      .update(updateData)
      .eq("id", authUser.id)
      .select()
      .single();
    userData = result.data;
    userError = result.error;
  } else {
    // No profile - INSERT with default role "participant"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (supabase as any)
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email,
        role: "participant",
        ...updateData,
      })
      .select()
      .single();
    userData = result.data;
    userError = result.error;
  }

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
  register,
  logout,
  getCurrentUser,
  completeOnboarding,
  updateProfile,
};
