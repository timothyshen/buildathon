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
  completeOnboarding: (data: OnboardingData) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const initRef = useRef(false);

  // Helper to create user from session data (fallback when profile fetch fails)
  // hasCompletedOnboarding defaults to true to prevent incorrect onboarding redirects
  // when the profile DB fetch fails temporarily - the real value comes from the profile
  const createUserFromSession = useCallback((sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; created_at: string }) => ({
    id: sessionUser.id,
    email: sessionUser.email || "",
    name: (sessionUser.user_metadata?.name as string) || sessionUser.email?.split("@")[0] || "User",
    role: (sessionUser.user_metadata?.role as User["role"]) || "participant",
    hasCompletedOnboarding: true,
    createdAt: new Date(sessionUser.created_at),
  }), []);

  // Function to fetch user profile from database with timeout
  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
      );
      const fetchPromise = authService.getCurrentUser().then(res => res.data);
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.warn("fetchUserProfile failed:", err);
      return null;
    }
  }, []);

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    const profile = await fetchUserProfile();
    if (isMountedRef.current) setUser(profile);
  }, [fetchUserProfile]);

  // Set up Supabase auth listener
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initRef.current) return;
    initRef.current = true;
    isMountedRef.current = true;

    const supabase = createClient();

    // Initial load with guaranteed timeout
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
          // Try to fetch profile, fall back to session data
          const profile = await fetchUserProfile();
          if (isMountedRef.current) {
            setUser(profile || createUserFromSession(session.user));
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    }

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;

        try {
          if (event === "SIGNED_IN" && session?.user) {
            const profile = await fetchUserProfile();
            if (isMountedRef.current) {
              setUser(profile || createUserFromSession(session.user));
            }
          } else if (event === "SIGNED_OUT") {
            if (isMountedRef.current) setUser(null);
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            const profile = await fetchUserProfile();
            if (isMountedRef.current) {
              setUser(profile || createUserFromSession(session.user));
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
      setUser(data);
      return { success: true };
    }

    return { success: false, error: error || "Login failed" };
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const { data: userData, success, error } = await authService.register(data);

    if (success && userData) {
      setUser(userData);
      return { success: true };
    }

    return { success: false, error: error || "Registration failed" };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Complete onboarding and update user profile
  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!user) return;

    const { data: updatedUser, success } = await authService.completeOnboarding(data);
    if (success && updatedUser) {
      setUser(updatedUser);
    }
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
