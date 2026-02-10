"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";
import { authService, type OnboardingData, type RegisterData } from "@/services";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: (data: OnboardingData) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const initRef = useRef(false);
  // Tracks whether loadUser() has finished — prevents the auth listener's
  // SIGNED_IN handler from racing with loadUser and causing duplicate getUser() calls.
  const initialLoadDoneRef = useRef(false);
  // Track when we've just completed login/register to skip redundant SIGNED_IN handler.
  // Uses a counter instead of a boolean so concurrent login attempts don't interfere.
  const authRequestIdRef = useRef<number>(0);

  // Helper to create user from session data (fallback when profile fetch fails)
  // For existing users (created > 5 min ago), default hasCompletedOnboarding to true
  // to prevent incorrect redirects. For new users, default to false so they complete onboarding.
  const createUserFromSession = useCallback((sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; created_at: string }) => {
    const createdAt = new Date(sessionUser.created_at);
    const isNewUser = Date.now() - createdAt.getTime() < 5 * 60 * 1000; // 5 minutes
    return {
      id: sessionUser.id,
      email: sessionUser.email || "",
      name: (sessionUser.user_metadata?.name as string) || sessionUser.email?.split("@")[0] || "User",
      role: (sessionUser.user_metadata?.role as User["role"]) || "participant",
      hasCompletedOnboarding: !isNewUser, // New users should complete onboarding
      createdAt,
    };
  }, []);

  // Function to fetch user profile from database with timeout
  // Returns { user, accountDeleted } to handle deleted account case
  const fetchUserProfile = useCallback(async (): Promise<{ user: User | null; accountDeleted: boolean }> => {
    try {
      const timeoutPromise = new Promise<{ user: User | null; accountDeleted: boolean }>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
      );
      const fetchPromise = authService.getCurrentUser().then(res => {
        // Check if account was deleted (auth exists but no DB profile for old account)
        if (res.error === "ACCOUNT_DELETED") {
          return { user: null, accountDeleted: true };
        }
        return { user: res.data, accountDeleted: false };
      });
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.warn("fetchUserProfile failed:", err);
      return { user: null, accountDeleted: false };
    }
  }, []);

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    const { user: profile, accountDeleted } = await fetchUserProfile();
    if (!isMountedRef.current) return;

    if (accountDeleted) {
      // Account was deleted - sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/login?error=account_deleted";
      return;
    }

    // Only update if we got a valid profile - don't clear existing user on fetch failure
    if (profile) {
      setUser(profile);
    }
  }, [fetchUserProfile]);

  // Set up Supabase auth listener
  useEffect(() => {
    // Always mark as mounted — even on React Strict Mode remount.
    // This is critical: the first mount's async loadUser() checks this ref
    // AFTER the remount has occurred, so it must be true for state updates to land.
    isMountedRef.current = true;

    const supabase = createClient();

    // Initial load with guaranteed timeout — only run once across strict mode cycles.
    // loadUser from the first mount will still complete because isMountedRef is true.
    if (!initRef.current) {
      initRef.current = true;

      async function loadUser() {
        try {
          // Race between session fetch and timeout
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error("Session timeout")), 5000)
            )
          ]);

          const { data: { session }, error: sessionError } = sessionResult;

          if (sessionError) {
            console.error("Session error:", sessionError);
            if (isMountedRef.current) setIsLoading(false);
            return;
          }

          if (session?.user && isMountedRef.current) {
            // Try to fetch profile from database
            const { user: profile, accountDeleted } = await fetchUserProfile();
            if (!isMountedRef.current) return;

            if (accountDeleted) {
              // Account was deleted - sign out and redirect
              await supabase.auth.signOut();
              setUser(null);
              window.location.href = "/login?error=account_deleted";
              return;
            }

            if (profile) {
              setUser(profile);
            } else {
              // Only fall back to session data for NEW users (< 5 minutes old)
              // This allows onboarding to work while preventing role downgrade for existing users
              const createdAt = new Date(session.user.created_at);
              const isNewUser = Date.now() - createdAt.getTime() < 5 * 60 * 1000;
              if (isNewUser) {
                setUser(createUserFromSession(session.user));
              } else {
                // Existing user but couldn't fetch profile — retry once before giving up
                await new Promise(r => setTimeout(r, 500));
                if (!isMountedRef.current) return;
                const retry = await fetchUserProfile();
                if (!isMountedRef.current) return;

                if (retry.user) {
                  setUser(retry.user);
                } else if (retry.accountDeleted) {
                  await supabase.auth.signOut();
                  setUser(null);
                  window.location.href = "/login?error=account_deleted";
                  return;
                } else {
                  // Still can't fetch — use session data as safe fallback rather than signing out.
                  // The middleware already verified the user's role, so this is acceptable.
                  console.warn("Could not fetch profile for existing user - using session fallback");
                  setUser(createUserFromSession(session.user));
                }
              }
            }
          }
        } catch (error) {
          console.error("Error loading user:", error);
        } finally {
          initialLoadDoneRef.current = true;
          if (isMountedRef.current) setIsLoading(false);
        }
      }

      loadUser();
    }

    // Auth listener must be set up on every mount since cleanup unsubscribes it
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;

        try {
          if (event === "SIGNED_IN" && session?.user) {
            // Skip if initial load is still in progress — loadUser handles the first profile fetch.
            // Running concurrent fetchUserProfile() calls causes token refresh races.
            if (!initialLoadDoneRef.current) return;

            // Skip if we just completed login/register - user is already set correctly.
            // This prevents race conditions where timeout fallback overwrites correct role.
            if (authRequestIdRef.current > 0) {
              authRequestIdRef.current = 0;
              return;
            }

            const { user: profile, accountDeleted } = await fetchUserProfile();
            if (!isMountedRef.current) return;

            if (accountDeleted) {
              await supabase.auth.signOut();
              setUser(null);
              window.location.href = "/login?error=account_deleted";
              return;
            }

            // Only update user if we got a valid profile from DB
            // Don't fall back to session data as it may have stale/wrong role
            if (profile) {
              setUser(profile);
            }
          } else if (event === "SIGNED_OUT") {
            if (isMountedRef.current) setUser(null);
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            const { user: profile, accountDeleted } = await fetchUserProfile();
            if (!isMountedRef.current) return;

            if (accountDeleted) {
              await supabase.auth.signOut();
              setUser(null);
              window.location.href = "/login?error=account_deleted";
              return;
            }

            // Only update user if we got a valid profile from DB
            // If fetch failed/timed out, preserve current user to avoid role downgrade
            if (profile) {
              setUser(profile);
            }
          }
        } catch (error) {
          console.error("Auth state change error:", error);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, createUserFromSession]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, success, error } = await authService.login(email, password);

    if (success && data) {
      // Mark that we just authenticated to prevent SIGNED_IN handler from overwriting
      authRequestIdRef.current++;
      setUser(data);
      // Reset the counter after a delay to allow normal behavior for subsequent events
      const currentId = authRequestIdRef.current;
      setTimeout(() => {
        if (authRequestIdRef.current === currentId) {
          authRequestIdRef.current = 0;
        }
      }, 5000);
      return { success: true };
    }

    return { success: false, error: error || "Login failed" };
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const { data: userData, success, error } = await authService.register(data);

    if (success && userData) {
      // Mark that we just authenticated to prevent SIGNED_IN handler from overwriting
      authRequestIdRef.current++;
      setUser(userData);
      // Reset the counter after a delay to allow normal behavior for subsequent events
      const currentId = authRequestIdRef.current;
      setTimeout(() => {
        if (authRequestIdRef.current === currentId) {
          authRequestIdRef.current = 0;
        }
      }, 5000);
      return { success: true };
    }

    return { success: false, error: error || "Registration failed" };
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    authRequestIdRef.current = 0;
    await authService.logout();
  }, []);

  // Complete onboarding and update user profile
  const completeOnboarding = useCallback(async (data: OnboardingData): Promise<boolean> => {
    if (!user) return false;

    const { data: updatedUser, success } = await authService.completeOnboarding(data);
    if (success && updatedUser) {
      setUser(updatedUser);
      return true;
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, completeOnboarding, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
