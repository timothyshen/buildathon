/**
 * Reviews Service
 * Handles review CRUD and queries
 */

import { mockReviews, getReviewsByJudge as mockGetReviewsByJudge } from "@/data/mock-data";
import type { Review } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated, delay, generateId } from "./types";

export interface ReviewScores {
  innovationScore: number;
  executionScore: number;
  designScore: number;
  impactScore: number;
  presentationScore: number;
}

export interface SubmitReviewData extends ReviewScores {
  feedback?: string;
  internalNotes?: string;
}

export interface ReviewsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Review | null>>;
  create(data: { submissionId: string; judgeId: string }): Promise<ServiceResponse<Review>>;
  update(id: string, data: Partial<Review>): Promise<ServiceResponse<Review>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  getByJudge(judgeId: string): Promise<ServiceResponse<Review[]>>;
  getBySubmission(submissionId: string): Promise<ServiceResponse<Review[]>>;
  list(options?: QueryOptions & { status?: Review["status"]; cohortId?: string }): Promise<PaginatedResponse<Review>>;

  // Actions
  submitReview(id: string, data: SubmitReviewData): Promise<ServiceResponse<Review>>;
}

// CRUD

async function getById(id: string): Promise<ServiceResponse<Review | null>> {
  await delay();
  const review = mockReviews.find((r) => r.id === id) || null;
  return success(review);
}

async function create(data: { submissionId: string; judgeId: string }): Promise<ServiceResponse<Review>> {
  await delay(200);

  const newReview: Review = {
    id: generateId("review"),
    submissionId: data.submissionId,
    judgeId: data.judgeId,
    status: "pending",
    createdAt: new Date(),
  };

  mockReviews.push(newReview);
  return success(newReview);
}

async function update(id: string, data: Partial<Review>): Promise<ServiceResponse<Review>> {
  await delay(150);

  const reviewIndex = mockReviews.findIndex((r) => r.id === id);
  if (reviewIndex === -1) {
    return error("Review not found", null as unknown as Review);
  }

  const updatedReview: Review = {
    ...mockReviews[reviewIndex],
    ...data,
  };

  mockReviews[reviewIndex] = updatedReview;
  return success(updatedReview);
}

async function deleteReview(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const reviewIndex = mockReviews.findIndex((r) => r.id === id);
  if (reviewIndex === -1) {
    return error("Review not found", undefined);
  }

  mockReviews.splice(reviewIndex, 1);
  return success(undefined);
}

// Queries

async function getByJudge(judgeId: string): Promise<ServiceResponse<Review[]>> {
  await delay();
  const reviews = mockGetReviewsByJudge(judgeId);
  return success(reviews);
}

async function getBySubmission(submissionId: string): Promise<ServiceResponse<Review[]>> {
  await delay();
  const reviews = mockReviews.filter((r) => r.submissionId === submissionId);
  return success(reviews);
}

async function list(
  options?: QueryOptions & { status?: Review["status"]; cohortId?: string }
): Promise<PaginatedResponse<Review>> {
  await delay();

  let reviews = [...mockReviews];

  // Filter by status
  if (options?.status) {
    reviews = reviews.filter((r) => r.status === options.status);
  }

  // Filter by cohort (through submission)
  if (options?.cohortId) {
    reviews = reviews.filter((r) => r.submission?.cohortId === options.cohortId);
  }

  // Sort
  if (options?.sortBy) {
    reviews.sort((a, b) => {
      const aVal = a[options.sortBy as keyof Review];
      const bVal = b[options.sortBy as keyof Review];
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
  const paginatedReviews = reviews.slice(start, start + pageSize);

  return paginated(paginatedReviews, reviews.length, page, pageSize);
}

// Actions

async function submitReview(id: string, data: SubmitReviewData): Promise<ServiceResponse<Review>> {
  await delay(500);

  const reviewIndex = mockReviews.findIndex((r) => r.id === id);
  if (reviewIndex === -1) {
    return error("Review not found", null as unknown as Review);
  }

  // Calculate overall score
  const overallScore =
    (data.innovationScore +
      data.executionScore +
      data.designScore +
      data.impactScore +
      data.presentationScore) /
    5;

  const updatedReview: Review = {
    ...mockReviews[reviewIndex],
    ...data,
    overallScore,
    status: "completed",
    completedAt: new Date(),
  };

  mockReviews[reviewIndex] = updatedReview;
  return success(updatedReview);
}

export const reviewsService: ReviewsService = {
  getById,
  create,
  update,
  delete: deleteReview,
  getByJudge,
  getBySubmission,
  list,
  submitReview,
};
