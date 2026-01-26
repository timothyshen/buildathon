/**
 * Sponsors Service
 * Handles SponsorOrg and CohortSponsor operations
 */

import {
  mockSponsorOrgs,
  mockCohortSponsors,
  getSponsorByUser as mockGetSponsorByUser,
  getSponsorOrgById as mockGetSponsorOrgById,
  getSponsorsByCohort as mockGetSponsorsByCohort,
  getCohortSponsor as mockGetCohortSponsor,
} from "@/data/mock-data";
import type { SponsorOrg, CohortSponsor, SponsorTier } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error, delay, generateId } from "./types";

// Type for sponsor with cohort-specific data
export type CohortSponsorWithOrg = SponsorOrg & {
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
};

export interface SponsorsService {
  // SponsorOrg operations
  getOrgById(id: string): Promise<ServiceResponse<SponsorOrg | null>>;
  getOrgByUser(userId: string): Promise<ServiceResponse<SponsorOrg | null>>;
  listOrgs(): Promise<ServiceResponse<SponsorOrg[]>>;
  createOrg(data: Omit<SponsorOrg, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<SponsorOrg>>;
  updateOrg(id: string, data: Partial<SponsorOrg>): Promise<ServiceResponse<SponsorOrg>>;
  deleteOrg(id: string): Promise<ServiceResponse<void>>;

  // CohortSponsor (junction) operations
  listCohortSponsors(): Promise<ServiceResponse<CohortSponsor[]>>;
  getCohortSponsors(cohortId: string): Promise<ServiceResponse<CohortSponsorWithOrg[]>>;
  getSponsorCohorts(sponsorOrgId: string): Promise<ServiceResponse<CohortSponsor[]>>;
  getCohortSponsor(cohortId: string, sponsorOrgId: string): Promise<ServiceResponse<CohortSponsor | null>>;
  createCohortSponsor(data: Omit<CohortSponsor, "id">): Promise<ServiceResponse<CohortSponsor>>;
  updateCohortSponsor(id: string, data: Partial<CohortSponsor>): Promise<ServiceResponse<CohortSponsor>>;
  deleteCohortSponsor(id: string): Promise<ServiceResponse<void>>;
}

// SponsorOrg operations

async function getOrgById(id: string): Promise<ServiceResponse<SponsorOrg | null>> {
  await delay();
  const org = mockGetSponsorOrgById(id) || null;
  return success(org);
}

async function getOrgByUser(userId: string): Promise<ServiceResponse<SponsorOrg | null>> {
  await delay();
  const org = mockGetSponsorByUser(userId) || null;
  return success(org);
}

async function listOrgs(): Promise<ServiceResponse<SponsorOrg[]>> {
  await delay();
  return success([...mockSponsorOrgs]);
}

async function createOrg(
  data: Omit<SponsorOrg, "id" | "createdAt" | "updatedAt">
): Promise<ServiceResponse<SponsorOrg>> {
  await delay(200);

  const newOrg: SponsorOrg = {
    ...data,
    id: generateId("sponsor"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockSponsorOrgs.push(newOrg);
  return success(newOrg);
}

async function updateOrg(id: string, data: Partial<SponsorOrg>): Promise<ServiceResponse<SponsorOrg>> {
  await delay(150);

  const orgIndex = mockSponsorOrgs.findIndex((o) => o.id === id);
  if (orgIndex === -1) {
    return error("Sponsor organization not found", null as unknown as SponsorOrg);
  }

  const updatedOrg = {
    ...mockSponsorOrgs[orgIndex],
    ...data,
    updatedAt: new Date(),
  };

  mockSponsorOrgs[orgIndex] = updatedOrg;
  return success(updatedOrg);
}

async function deleteOrg(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const orgIndex = mockSponsorOrgs.findIndex((o) => o.id === id);
  if (orgIndex === -1) {
    return error("Sponsor organization not found", undefined);
  }

  mockSponsorOrgs.splice(orgIndex, 1);

  // Also remove cohort sponsorships
  const sponsorshipIndicesToRemove = mockCohortSponsors
    .map((cs, index) => (cs.sponsorOrgId === id ? index : -1))
    .filter((i) => i !== -1)
    .reverse();

  for (const index of sponsorshipIndicesToRemove) {
    mockCohortSponsors.splice(index, 1);
  }

  return success(undefined);
}

// CohortSponsor operations

async function listCohortSponsors(): Promise<ServiceResponse<CohortSponsor[]>> {
  await delay();
  return success([...mockCohortSponsors]);
}

async function getCohortSponsors(cohortId: string): Promise<ServiceResponse<CohortSponsorWithOrg[]>> {
  await delay();
  const sponsors = mockGetSponsorsByCohort(cohortId);
  return success(sponsors);
}

async function getSponsorCohorts(sponsorOrgId: string): Promise<ServiceResponse<CohortSponsor[]>> {
  await delay();
  const cohortSponsors = mockCohortSponsors.filter((cs) => cs.sponsorOrgId === sponsorOrgId);
  return success(cohortSponsors);
}

async function getCohortSponsor(
  cohortId: string,
  sponsorOrgId: string
): Promise<ServiceResponse<CohortSponsor | null>> {
  await delay();
  const cohortSponsor = mockGetCohortSponsor(cohortId, sponsorOrgId) || null;
  return success(cohortSponsor);
}

async function createCohortSponsor(data: Omit<CohortSponsor, "id">): Promise<ServiceResponse<CohortSponsor>> {
  await delay(200);

  // Check if already exists
  const existing = mockCohortSponsors.find(
    (cs) => cs.cohortId === data.cohortId && cs.sponsorOrgId === data.sponsorOrgId
  );
  if (existing) {
    return error("Sponsorship already exists for this cohort", existing);
  }

  const newCohortSponsor: CohortSponsor = {
    ...data,
    id: generateId("cs"),
  };

  mockCohortSponsors.push(newCohortSponsor);
  return success(newCohortSponsor);
}

async function updateCohortSponsor(
  id: string,
  data: Partial<CohortSponsor>
): Promise<ServiceResponse<CohortSponsor>> {
  await delay(150);

  const csIndex = mockCohortSponsors.findIndex((cs) => cs.id === id);
  if (csIndex === -1) {
    return error("Cohort sponsorship not found", null as unknown as CohortSponsor);
  }

  const updatedCS = { ...mockCohortSponsors[csIndex], ...data };
  mockCohortSponsors[csIndex] = updatedCS;

  return success(updatedCS);
}

async function deleteCohortSponsor(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const csIndex = mockCohortSponsors.findIndex((cs) => cs.id === id);
  if (csIndex === -1) {
    return error("Cohort sponsorship not found", undefined);
  }

  mockCohortSponsors.splice(csIndex, 1);
  return success(undefined);
}

export const sponsorsService: SponsorsService = {
  getOrgById,
  getOrgByUser,
  listOrgs,
  createOrg,
  updateOrg,
  deleteOrg,
  listCohortSponsors,
  getCohortSponsors,
  getSponsorCohorts,
  getCohortSponsor,
  createCohortSponsor,
  updateCohortSponsor,
  deleteCohortSponsor,
};
