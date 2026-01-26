/**
 * Users Service
 * Handles user lookups and management
 */

import { mockUsers, getUserByEmail as mockGetUserByEmail } from "@/data/mock-data";
import type { User } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated, delay } from "./types";

export interface UsersService {
  getById(id: string): Promise<ServiceResponse<User | null>>;
  getByEmail(email: string): Promise<ServiceResponse<User | null>>;
  list(options?: QueryOptions & { role?: User["role"] }): Promise<PaginatedResponse<User>>;
  update(id: string, data: Partial<User>): Promise<ServiceResponse<User>>;
}

async function getById(id: string): Promise<ServiceResponse<User | null>> {
  await delay();
  const user = mockUsers.find((u) => u.id === id) || null;
  return success(user);
}

async function getByEmail(email: string): Promise<ServiceResponse<User | null>> {
  await delay();
  const user = mockGetUserByEmail(email) || null;
  return success(user);
}

async function list(
  options?: QueryOptions & { role?: User["role"] }
): Promise<PaginatedResponse<User>> {
  await delay();

  let users = [...mockUsers];

  // Filter by role if provided
  if (options?.role) {
    users = users.filter((u) => u.role === options.role);
  }

  // Sort
  if (options?.sortBy) {
    users.sort((a, b) => {
      const aVal = a[options.sortBy as keyof User];
      const bVal = b[options.sortBy as keyof User];
      if (aVal === undefined || bVal === undefined) return 0;
      const comparison = String(aVal).localeCompare(String(bVal));
      return options.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // Paginate
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const start = (page - 1) * pageSize;
  const paginatedUsers = users.slice(start, start + pageSize);

  return paginated(paginatedUsers, users.length, page, pageSize);
}

async function update(id: string, data: Partial<User>): Promise<ServiceResponse<User>> {
  await delay(100);

  const userIndex = mockUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return error("User not found", null as unknown as User);
  }

  const updatedUser = { ...mockUsers[userIndex], ...data, updatedAt: new Date() };
  mockUsers[userIndex] = updatedUser;

  return success(updatedUser);
}

export const usersService: UsersService = {
  getById,
  getByEmail,
  list,
  update,
};
