/**
 * Service Layer Types
 * Common types used across all service modules
 */

/**
 * Standard response wrapper for all service operations
 */
export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

/**
 * Paginated response for list operations
 */
export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Common query options for list operations
 */
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Helper to create a successful response
 */
export function success<T>(data: T): ServiceResponse<T> {
  return { data, success: true };
}

/**
 * Helper to create an error response
 */
export function error<T>(message: string, data: T): ServiceResponse<T> {
  return { data, success: false, error: message };
}

/**
 * Helper to create a paginated response
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    data,
    success: true,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

/**
 * Simulate network delay for mock implementations
 */
export function delay(ms: number = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID for new entities
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
