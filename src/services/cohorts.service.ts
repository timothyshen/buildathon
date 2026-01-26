/**
 * Cohorts Service
 * Handles cohort CRUD and queries
 */

import {
  mockCohorts,
  getCohortBySlug as mockGetCohortBySlug,
  getCohortById as mockGetCohortById,
} from "@/data/mock-data";
import type { Cohort } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated, delay, generateId } from "./types";

export interface CohortsService {
  getById(id: string): Promise<ServiceResponse<Cohort | null>>;
  getBySlug(slug: string): Promise<ServiceResponse<Cohort | null>>;
  list(options?: QueryOptions & { status?: Cohort["status"]; isPublic?: boolean }): Promise<PaginatedResponse<Cohort>>;
  create(data: Omit<Cohort, "id">): Promise<ServiceResponse<Cohort>>;
  update(id: string, data: Partial<Cohort>): Promise<ServiceResponse<Cohort>>;
  delete(id: string): Promise<ServiceResponse<void>>;
  updateStatus(id: string, status: Cohort["status"]): Promise<ServiceResponse<Cohort>>;
}

async function getById(id: string): Promise<ServiceResponse<Cohort | null>> {
  await delay();
  const cohort = mockGetCohortById(id) || null;
  return success(cohort);
}

async function getBySlug(slug: string): Promise<ServiceResponse<Cohort | null>> {
  await delay();
  const cohort = mockGetCohortBySlug(slug) || null;
  return success(cohort);
}

async function list(
  options?: QueryOptions & { status?: Cohort["status"]; isPublic?: boolean }
): Promise<PaginatedResponse<Cohort>> {
  await delay();

  let cohorts = [...mockCohorts];

  // Filter by status
  if (options?.status) {
    cohorts = cohorts.filter((c) => c.status === options.status);
  }

  // Filter by public/private
  if (options?.isPublic !== undefined) {
    cohorts = cohorts.filter((c) => c.isPublic === options.isPublic);
  }

  // Sort by start date by default (newest first)
  cohorts.sort((a, b) => {
    if (options?.sortBy) {
      const aVal = a[options.sortBy as keyof Cohort];
      const bVal = b[options.sortBy as keyof Cohort];
      if (aVal instanceof Date && bVal instanceof Date) {
        return options.sortOrder === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return options.sortOrder === "desc" ? -comparison : comparison;
    }
    return b.startDate.getTime() - a.startDate.getTime();
  });

  // Paginate
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const start = (page - 1) * pageSize;
  const paginatedCohorts = cohorts.slice(start, start + pageSize);

  return paginated(paginatedCohorts, cohorts.length, page, pageSize);
}

async function create(data: Omit<Cohort, "id">): Promise<ServiceResponse<Cohort>> {
  await delay(200);

  const newCohort: Cohort = {
    ...data,
    id: generateId("cohort"),
  };

  mockCohorts.push(newCohort);
  return success(newCohort);
}

async function update(id: string, data: Partial<Cohort>): Promise<ServiceResponse<Cohort>> {
  await delay(150);

  const cohortIndex = mockCohorts.findIndex((c) => c.id === id);
  if (cohortIndex === -1) {
    return error("Cohort not found", null as unknown as Cohort);
  }

  const updatedCohort = { ...mockCohorts[cohortIndex], ...data };
  mockCohorts[cohortIndex] = updatedCohort;

  return success(updatedCohort);
}

async function deleteCohort(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const cohortIndex = mockCohorts.findIndex((c) => c.id === id);
  if (cohortIndex === -1) {
    return error("Cohort not found", undefined);
  }

  mockCohorts.splice(cohortIndex, 1);
  return success(undefined);
}

async function updateStatus(id: string, status: Cohort["status"]): Promise<ServiceResponse<Cohort>> {
  await delay(150);

  const cohortIndex = mockCohorts.findIndex((c) => c.id === id);
  if (cohortIndex === -1) {
    return error("Cohort not found", null as unknown as Cohort);
  }

  mockCohorts[cohortIndex].status = status;
  return success(mockCohorts[cohortIndex]);
}

export const cohortsService: CohortsService = {
  getById,
  getBySlug,
  list,
  create,
  update,
  delete: deleteCohort,
  updateStatus,
};
