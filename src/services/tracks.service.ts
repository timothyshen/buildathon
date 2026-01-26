/**
 * Tracks Service
 * Handles track CRUD and queries
 */

import { mockTracks, getTracksByCohort as mockGetTracksByCohort } from "@/data/mock-data";
import type { Track } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error, delay, generateId } from "./types";

export interface TracksService {
  getById(id: string): Promise<ServiceResponse<Track | null>>;
  getByCohort(cohortId: string): Promise<ServiceResponse<Track[]>>;
  getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Track[]>>;
  create(data: Omit<Track, "id">): Promise<ServiceResponse<Track>>;
  update(id: string, data: Partial<Track>): Promise<ServiceResponse<Track>>;
  delete(id: string): Promise<ServiceResponse<void>>;
}

async function getById(id: string): Promise<ServiceResponse<Track | null>> {
  await delay();
  const track = mockTracks.find((t) => t.id === id) || null;
  return success(track);
}

async function getByCohort(cohortId: string): Promise<ServiceResponse<Track[]>> {
  await delay();
  const tracks = mockGetTracksByCohort(cohortId);
  return success(tracks);
}

async function getBySponsor(sponsorOrgId: string): Promise<ServiceResponse<Track[]>> {
  await delay();
  const tracks = mockTracks.filter((t) => t.sponsorOrgId === sponsorOrgId);
  return success(tracks);
}

async function create(data: Omit<Track, "id">): Promise<ServiceResponse<Track>> {
  await delay(200);

  const newTrack: Track = {
    ...data,
    id: generateId("track"),
  };

  mockTracks.push(newTrack);
  return success(newTrack);
}

async function update(id: string, data: Partial<Track>): Promise<ServiceResponse<Track>> {
  await delay(150);

  const trackIndex = mockTracks.findIndex((t) => t.id === id);
  if (trackIndex === -1) {
    return error("Track not found", null as unknown as Track);
  }

  const updatedTrack = { ...mockTracks[trackIndex], ...data };
  mockTracks[trackIndex] = updatedTrack;

  return success(updatedTrack);
}

async function deleteTrack(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const trackIndex = mockTracks.findIndex((t) => t.id === id);
  if (trackIndex === -1) {
    return error("Track not found", undefined);
  }

  mockTracks.splice(trackIndex, 1);
  return success(undefined);
}

export const tracksService: TracksService = {
  getById,
  getByCohort,
  getBySponsor,
  create,
  update,
  delete: deleteTrack,
};
