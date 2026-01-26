"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "@/types";
import { authService, type OnboardingData } from "@/services";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: User["role"]) => void;
  completeOnboarding: (data: OnboardingData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    async function loadUser() {
      const { data } = await authService.getCurrentUser();
      if (data) {
        setUser(data);
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

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
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, completeOnboarding }}>
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
