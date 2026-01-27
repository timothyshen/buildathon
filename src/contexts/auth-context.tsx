"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";
import { authService, type OnboardingData } from "@/services";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: User["role"]) => void;
  completeOnboarding: (data: OnboardingData) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch user profile from database
  const fetchUserProfile = useCallback(async () => {
    const { data } = await authService.getCurrentUser();
    return data;
  }, []);

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    const profile = await fetchUserProfile();
    setUser(profile);
  }, [fetchUserProfile]);

  // Set up Supabase auth listener
  useEffect(() => {
    const supabase = createClient();

    // Initial load
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const profile = await fetchUserProfile();
          setUser(profile);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Optionally refresh user profile on token refresh
          const profile = await fetchUserProfile();
          setUser(profile);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, success, error } = await authService.login(email, password);

    if (success && data) {
      setUser(data);
      return { success: true };
    }

    return { success: false, error: error || "Login failed" };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Dev helper to switch roles for testing
  const switchRole = useCallback(async (role: User["role"]) => {
    if (!user) return;

    const { data, success } = await authService.switchRole(role);
    if (success && data) {
      setUser(data);
    }
  }, [user]);

  // Complete onboarding and update user profile
  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!user) return;

    const { data: updatedUser, success } = await authService.completeOnboarding(data);
    if (success && updatedUser) {
      setUser(updatedUser);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, completeOnboarding, refreshUser }}>
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
