/**
 * Workshops Service
 * Handles workshop CRUD and RSVP management
 */

import {
  mockWorkshops,
  mockWorkshopRSVPs,
  getWorkshopsBySponsor as mockGetWorkshopsBySponsor,
  getWorkshopsByCohort as mockGetWorkshopsByCohort,
  getWorkshopsByDateRange as mockGetWorkshopsByDateRange,
  getRSVPsByWorkshop as mockGetRSVPsByWorkshop,
  getRSVPsByUser as mockGetRSVPsByUser,
} from "@/data/mock-data";
import type { Workshop, WorkshopRSVP } from "@/types";
import type { ServiceResponse, QueryOptions, PaginatedResponse } from "./types";
import { success, error, paginated, delay, generateId } from "./types";

export interface WorkshopsService {
  // CRUD
  getById(id: string): Promise<ServiceResponse<Workshop | null>>;
  create(data: Omit<Workshop, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Workshop>>;
  update(id: string, data: Partial<Workshop>): Promise<ServiceResponse<Workshop>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Queries
  list(options?: QueryOptions & { status?: Workshop["status"]; category?: string; isEvergreen?: boolean }): Promise<PaginatedResponse<Workshop>>;
  getByCohort(cohortId: string): Promise<ServiceResponse<Workshop[]>>;
  getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Workshop[]>>;
  getByDateRange(start: Date, end: Date): Promise<ServiceResponse<Workshop[]>>;

  // RSVPs
  getRSVPs(workshopId: string): Promise<ServiceResponse<WorkshopRSVP[]>>;
  getUserRSVPs(userId: string): Promise<ServiceResponse<WorkshopRSVP[]>>;
  createRSVP(workshopId: string, userId: string): Promise<ServiceResponse<WorkshopRSVP>>;
  cancelRSVP(rsvpId: string): Promise<ServiceResponse<void>>;
}

// CRUD

async function getById(id: string): Promise<ServiceResponse<Workshop | null>> {
  await delay();
  const workshop = mockWorkshops.find((w) => w.id === id) || null;
  return success(workshop);
}

async function create(
  data: Omit<Workshop, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResponse<Workshop>> {
  await delay(200);

  const newWorkshop: Workshop = {
    ...data,
    id: generateId("workshop"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockWorkshops.push(newWorkshop);
  return success(newWorkshop);
}

async function update(id: string, data: Partial<Workshop>): Promise<ServiceResponse<Workshop>> {
  await delay(150);

  const workshopIndex = mockWorkshops.findIndex((w) => w.id === id);
  if (workshopIndex === -1) {
    return error("Workshop not found", null as unknown as Workshop);
  }

  const updatedWorkshop = {
    ...mockWorkshops[workshopIndex],
    ...data,
    updatedAt: new Date(),
  };

  mockWorkshops[workshopIndex] = updatedWorkshop;
  return success(updatedWorkshop);
}

async function deleteWorkshop(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const workshopIndex = mockWorkshops.findIndex((w) => w.id === id);
  if (workshopIndex === -1) {
    return error("Workshop not found", undefined);
  }

  mockWorkshops.splice(workshopIndex, 1);

  // Also remove RSVPs for this workshop
  const rsvpIndicesToRemove = mockWorkshopRSVPs
    .map((rsvp, index) => (rsvp.workshopId === id ? index : -1))
    .filter((i) => i !== -1)
    .reverse();

  for (const index of rsvpIndicesToRemove) {
    mockWorkshopRSVPs.splice(index, 1);
  }

  return success(undefined);
}

// Queries

async function list(
  options?: QueryOptions & { status?: Workshop["status"]; category?: string; isEvergreen?: boolean }
): Promise<PaginatedResponse<Workshop>> {
  await delay();

  let workshops = [...mockWorkshops];

  // Filter by status
  if (options?.status) {
    workshops = workshops.filter((w) => w.status === options.status);
  }

  // Filter by category
  if (options?.category) {
    workshops = workshops.filter((w) => w.category === options.category);
  }

  // Filter by evergreen
  if (options?.isEvergreen !== undefined) {
    workshops = workshops.filter((w) => w.isEvergreen === options.isEvergreen);
  }

  // Sort
  if (options?.sortBy) {
    workshops.sort((a, b) => {
      const aVal = a[options.sortBy as keyof Workshop];
      const bVal = b[options.sortBy as keyof Workshop];
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
  const paginatedWorkshops = workshops.slice(start, start + pageSize);

  return paginated(paginatedWorkshops, workshops.length, page, pageSize);
}

async function getByCohort(cohortId: string): Promise<ServiceResponse<Workshop[]>> {
  await delay();
  const workshops = mockGetWorkshopsByCohort(cohortId);
  return success(workshops);
}

async function getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Workshop[]>> {
  await delay();
  const workshops = mockGetWorkshopsBySponsor(sponsorOrgId);
  return success(workshops);
}

async function getByDateRange(start: Date, end: Date): Promise<ServiceResponse<Workshop[]>> {
  await delay();
  const workshops = mockGetWorkshopsByDateRange(start, end);
  return success(workshops);
}

// RSVPs

async function getRSVPs(workshopId: string): Promise<ServiceResponse<WorkshopRSVP[]>> {
  await delay();
  const rsvps = mockGetRSVPsByWorkshop(workshopId);
  return success(rsvps);
}

async function getUserRSVPs(userId: string): Promise<ServiceResponse<WorkshopRSVP[]>> {
  await delay();
  const rsvps = mockGetRSVPsByUser(userId);
  return success(rsvps);
}

async function createRSVP(workshopId: string, userId: string): Promise<ServiceResponse<WorkshopRSVP>> {
  await delay(200);

  const workshop = mockWorkshops.find((w) => w.id === workshopId);
  if (!workshop) {
    return error("Workshop not found", null as unknown as WorkshopRSVP);
  }

  // Check if already registered
  const existingRSVP = mockWorkshopRSVPs.find(
    (r) => r.workshopId === workshopId && r.userId === userId
  );
  if (existingRSVP) {
    return error("Already registered for this workshop", existingRSVP);
  }

  const newRSVP: WorkshopRSVP = {
    id: generateId("rsvp"),
    workshopId,
    userId,
    status: "registered",
    registeredAt: new Date(),
  };

  mockWorkshopRSVPs.push(newRSVP);
  return success(newRSVP);
}

async function cancelRSVP(rsvpId: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const rsvpIndex = mockWorkshopRSVPs.findIndex((r) => r.id === rsvpId);
  if (rsvpIndex === -1) {
    return error("RSVP not found", undefined);
  }

  mockWorkshopRSVPs.splice(rsvpIndex, 1);
  return success(undefined);
}

export const workshopsService: WorkshopsService = {
  getById,
  create,
  update,
  delete: deleteWorkshop,
  list,
  getByCohort,
  getBySponsor,
  getByDateRange,
  getRSVPs,
  getUserRSVPs,
  createRSVP,
  cancelRSVP,
};
