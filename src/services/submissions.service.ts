/**
 * Submissions Service
 * Handles submission CRUD, drafts, and queries
 */

import {
  mockSubmissions,
  getSubmissionById as mockGetSubmissionById,
  getSubmissionsByUser as mockGetSubmissionsByUser,
  getSubmissionsByCohort as mockGetSubmissionsByCohort,
} from "@/data/mock-data";
import type { Submission } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated, delay, generateId } from "./types";

const DRAFT_STORAGE_KEY = "swa-submission-draft";

export interface SubmissionsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Submission | null>>;
  create(data: Omit<Submission, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Submission>>;
  update(id: string, data: Partial<Submission>): Promise<ServiceResponse<Submission>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  list(options?: QueryOptions & { status?: Submission["status"] }): Promise<PaginatedResponse<Submission>>;
  getByUser(userId: string): Promise<ServiceResponse<Submission[]>>;
  getByCohort(cohortId: string, options?: QueryOptions & { status?: Submission["status"] }): Promise<PaginatedResponse<Submission>>;
  getByTeam(teamId: string): Promise<ServiceResponse<Submission[]>>;
  getByTrack(trackId: string): Promise<ServiceResponse<Submission[]>>;

  // Status
  submit(id: string): Promise<ServiceResponse<Submission>>;
  updateStatus(id: string, status: Submission["status"]): Promise<ServiceResponse<Submission>>;

  // Draft management (localStorage)
  saveDraft(data: Partial<Submission> & { currentStep?: number }): Promise<ServiceResponse<void>>;
  getDraft(): Promise<ServiceResponse<(Partial<Submission> & { currentStep?: number }) | null>>;
  clearDraft(): Promise<ServiceResponse<void>>;
}

// CRUD

async function getById(id: string): Promise<ServiceResponse<Submission | null>> {
  await delay();
  const submission = mockGetSubmissionById(id) || null;
  return success(submission);
}

async function create(
  data: Omit<Submission, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResponse<Submission>> {
  await delay(300);

  const newSubmission: Submission = {
    ...data,
    id: generateId("sub"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockSubmissions.push(newSubmission);
  return success(newSubmission);
}

async function update(id: string, data: Partial<Submission>): Promise<ServiceResponse<Submission>> {
  await delay(200);

  const submissionIndex = mockSubmissions.findIndex((s) => s.id === id);
  if (submissionIndex === -1) {
    return error("Submission not found", null as unknown as Submission);
  }

  const updatedSubmission = {
    ...mockSubmissions[submissionIndex],
    ...data,
    updatedAt: new Date(),
  };

  mockSubmissions[submissionIndex] = updatedSubmission;
  return success(updatedSubmission);
}

async function deleteSubmission(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const submissionIndex = mockSubmissions.findIndex((s) => s.id === id);
  if (submissionIndex === -1) {
    return error("Submission not found", undefined);
  }

  mockSubmissions.splice(submissionIndex, 1);
  return success(undefined);
}

// Queries

async function list(
  options?: QueryOptions & { status?: Submission["status"] }
): Promise<PaginatedResponse<Submission>> {
  await delay();

  let submissions = [...mockSubmissions];

  // Filter by status
  if (options?.status) {
    submissions = submissions.filter((s) => s.status === options.status);
  }

  // Sort
  if (options?.sortBy) {
    submissions.sort((a, b) => {
      const aVal = a[options.sortBy as keyof Submission];
      const bVal = b[options.sortBy as keyof Submission];
      if (aVal instanceof Date && bVal instanceof Date) {
        return options.sortOrder === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      const comparison = String(aVal || "").localeCompare(String(bVal || ""));
      return options.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // Paginate
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const start = (page - 1) * pageSize;
  const paginatedSubmissions = submissions.slice(start, start + pageSize);

  return paginated(paginatedSubmissions, submissions.length, page, pageSize);
}

async function getByUser(userId: string): Promise<ServiceResponse<Submission[]>> {
  await delay();
  const submissions = mockGetSubmissionsByUser(userId);
  return success(submissions);
}

async function getByCohort(
  cohortId: string,
  options?: QueryOptions & { status?: Submission["status"] }
): Promise<PaginatedResponse<Submission>> {
  await delay();

  let submissions = mockGetSubmissionsByCohort(cohortId);

  // Filter by status
  if (options?.status) {
    submissions = submissions.filter((s) => s.status === options.status);
  }

  // Sort
  if (options?.sortBy) {
    submissions.sort((a, b) => {
      const aVal = a[options.sortBy as keyof Submission];
      const bVal = b[options.sortBy as keyof Submission];
      if (aVal instanceof Date && bVal instanceof Date) {
        return options.sortOrder === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      const comparison = String(aVal || "").localeCompare(String(bVal || ""));
      return options.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // Paginate
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const start = (page - 1) * pageSize;
  const paginatedSubmissions = submissions.slice(start, start + pageSize);

  return paginated(paginatedSubmissions, submissions.length, page, pageSize);
}

async function getByTeam(teamId: string): Promise<ServiceResponse<Submission[]>> {
  await delay();
  const submissions = mockSubmissions.filter((s) => s.teamId === teamId);
  return success(submissions);
}

async function getByTrack(trackId: string): Promise<ServiceResponse<Submission[]>> {
  await delay();
  const submissions = mockSubmissions.filter((s) => s.trackId === trackId);
  return success(submissions);
}

// Status

async function submit(id: string): Promise<ServiceResponse<Submission>> {
  await delay(500);

  const submissionIndex = mockSubmissions.findIndex((s) => s.id === id);
  if (submissionIndex === -1) {
    return error("Submission not found", null as unknown as Submission);
  }

  mockSubmissions[submissionIndex] = {
    ...mockSubmissions[submissionIndex],
    status: "submitted",
    submittedAt: new Date(),
    updatedAt: new Date(),
  };

  return success(mockSubmissions[submissionIndex]);
}

async function updateStatus(
  id: string,
  status: Submission["status"]
): Promise<ServiceResponse<Submission>> {
  await delay(200);

  const submissionIndex = mockSubmissions.findIndex((s) => s.id === id);
  if (submissionIndex === -1) {
    return error("Submission not found", null as unknown as Submission);
  }

  mockSubmissions[submissionIndex] = {
    ...mockSubmissions[submissionIndex],
    status,
    updatedAt: new Date(),
  };

  return success(mockSubmissions[submissionIndex]);
}

// Draft management

async function saveDraft(
  data: Partial<Submission> & { currentStep?: number }
): Promise<ServiceResponse<void>> {
  await delay();

  if (typeof window !== "undefined") {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  }

  return success(undefined);
}

async function getDraft(): Promise<ServiceResponse<(Partial<Submission> & { currentStep?: number }) | null>> {
  await delay();

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      try {
        return success(JSON.parse(stored));
      } catch {
        return success(null);
      }
    }
  }

  return success(null);
}

async function clearDraft(): Promise<ServiceResponse<void>> {
  await delay();

  if (typeof window !== "undefined") {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }

  return success(undefined);
}

export const submissionsService: SubmissionsService = {
  getById,
  create,
  update,
  delete: deleteSubmission,
  list,
  getByUser,
  getByCohort,
  getByTeam,
  getByTrack,
  submit,
  updateStatus,
  saveDraft,
  getDraft,
  clearDraft,
};
