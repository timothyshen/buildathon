/**
 * Auth Service
 * Handles authentication and session management
 */

import { mockUsers, getUserByEmail } from "@/data/mock-data";
import type { User } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error, delay, generateId } from "./types";

const STORAGE_KEY = "swa-user";

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

// Internal state for current user (mirrors what auth-context does)
let currentUser: User | null = null;

async function login(email: string, _password: string): Promise<ServiceResponse<User>> {
  await delay(300);

  const foundUser = getUserByEmail(email);

  if (!foundUser) {
    // Create new participant account for unknown emails
    const newUser: User = {
      id: generateId("user"),
      email: email.toLowerCase(),
      name: email.split("@")[0],
      role: "participant",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      hasCompletedOnboarding: false,
      createdAt: new Date(),
    };

    // Add to mock users for future lookups
    mockUsers.push(newUser);
    currentUser = newUser;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    }

    return success(newUser);
  }

  currentUser = foundUser;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
  }

  return success(foundUser);
}

async function logout(): Promise<ServiceResponse<void>> {
  await delay(100);

  currentUser = null;

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }

  return success(undefined);
}

async function getCurrentUser(): Promise<ServiceResponse<User | null>> {
  await delay();

  if (currentUser) {
    return success(currentUser);
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        // Refresh from mock data to get latest state
        const freshUser = mockUsers.find((u) => u.id === user.id);
        currentUser = freshUser || user;
        return success(currentUser);
      } catch {
        return success(null);
      }
    }
  }

  return success(null);
}

async function switchRole(role: User["role"]): Promise<ServiceResponse<User>> {
  await delay();

  if (!currentUser) {
    return error("No user logged in", null as unknown as User);
  }

  const updatedUser = { ...currentUser, role };
  currentUser = updatedUser;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }

  return success(updatedUser);
}

async function completeOnboarding(data: OnboardingData): Promise<ServiceResponse<User>> {
  await delay(300);

  if (!currentUser) {
    return error("No user logged in", null as unknown as User);
  }

  const updatedUser: User = {
    ...currentUser,
    name: data.name,
    bio: data.bio,
    twitter: data.twitter,
    github: data.github,
    hasCompletedOnboarding: true,
  };

  // Update in mock data
  const userIndex = mockUsers.findIndex((u) => u.id === currentUser!.id);
  if (userIndex !== -1) {
    mockUsers[userIndex] = updatedUser;
  }

  currentUser = updatedUser;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }

  return success(updatedUser);
}

async function updateProfile(data: Partial<User>): Promise<ServiceResponse<User>> {
  await delay(200);

  if (!currentUser) {
    return error("No user logged in", null as unknown as User);
  }

  const updatedUser = { ...currentUser, ...data };

  // Update in mock data
  const userIndex = mockUsers.findIndex((u) => u.id === currentUser!.id);
  if (userIndex !== -1) {
    mockUsers[userIndex] = updatedUser;
  }

  currentUser = updatedUser;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }

  return success(updatedUser);
}

export const authService: AuthService = {
  login,
  logout,
  getCurrentUser,
  switchRole,
  completeOnboarding,
  updateProfile,
};
