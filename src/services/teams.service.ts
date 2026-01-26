/**
 * Teams Service
 * Handles team CRUD, member management, and invitations
 */

import {
  mockTeams,
  mockTeamInvites,
  mockUsers,
  mockCohorts,
  getUserTeams as mockGetUserTeams,
  getUserTeamForCohort as mockGetUserTeamForCohort,
  getPendingInvitesForUser as mockGetPendingInvitesForUser,
  getTeamInvites as mockGetTeamInvites,
  isTeamLead as mockIsTeamLead,
} from "@/data/mock-data";
import type { Team, TeamMember, TeamInvite, User } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error, delay, generateId } from "./types";

export interface CreateTeamData {
  cohortId: string;
  name: string;
  description?: string;
  leadUserId: string;
}

export interface CreateInviteData {
  teamId: string;
  email: string;
  invitedBy: string;
}

export interface TeamsService {
  // Team CRUD
  getById(id: string): Promise<ServiceResponse<Team | null>>;
  getByUser(userId: string): Promise<ServiceResponse<Team[]>>;
  getByUserAndCohort(userId: string, cohortId: string): Promise<ServiceResponse<Team | null>>;
  create(data: CreateTeamData): Promise<ServiceResponse<Team>>;
  update(id: string, data: Partial<Pick<Team, "name" | "description" | "logoUrl">>): Promise<ServiceResponse<Team>>;
  delete(id: string): Promise<ServiceResponse<void>>;

  // Member management
  addMember(teamId: string, userId: string, role?: "lead" | "member"): Promise<ServiceResponse<Team>>;
  removeMember(teamId: string, userId: string): Promise<ServiceResponse<Team>>;
  transferLead(teamId: string, newLeadUserId: string): Promise<ServiceResponse<Team>>;
  isLead(userId: string, teamId: string): Promise<ServiceResponse<boolean>>;

  // Invites
  getInvites(teamId: string): Promise<ServiceResponse<TeamInvite[]>>;
  getPendingInvitesForUser(email: string): Promise<ServiceResponse<TeamInvite[]>>;
  createInvite(data: CreateInviteData): Promise<ServiceResponse<TeamInvite>>;
  acceptInvite(inviteId: string, userId: string): Promise<ServiceResponse<Team>>;
  declineInvite(inviteId: string): Promise<ServiceResponse<void>>;
}

// Team CRUD

async function getById(id: string): Promise<ServiceResponse<Team | null>> {
  await delay();
  const team = mockTeams.find((t) => t.id === id) || null;
  return success(team);
}

async function getByUser(userId: string): Promise<ServiceResponse<Team[]>> {
  await delay();
  const teams = mockGetUserTeams(userId);
  return success(teams);
}

async function getByUserAndCohort(
  userId: string,
  cohortId: string
): Promise<ServiceResponse<Team | null>> {
  await delay();
  const team = mockGetUserTeamForCohort(userId, cohortId) || null;
  return success(team);
}

async function create(data: CreateTeamData): Promise<ServiceResponse<Team>> {
  await delay(200);

  const leadUser = mockUsers.find((u) => u.id === data.leadUserId);
  if (!leadUser) {
    return error("Lead user not found", null as unknown as Team);
  }

  const cohort = mockCohorts.find((c) => c.id === data.cohortId);
  if (!cohort) {
    return error("Cohort not found", null as unknown as Team);
  }

  const newTeam: Team = {
    id: generateId("team"),
    cohortId: data.cohortId,
    name: data.name.trim(),
    slug: data.name.trim().toLowerCase().replace(/\s+/g, "-"),
    description: data.description?.trim(),
    members: [
      {
        userId: data.leadUserId,
        user: leadUser,
        role: "lead",
        joinedAt: new Date(),
      },
    ],
  };

  mockTeams.push(newTeam);
  return success(newTeam);
}

async function update(
  id: string,
  data: Partial<Pick<Team, "name" | "description" | "logoUrl">>
): Promise<ServiceResponse<Team>> {
  await delay(150);

  const teamIndex = mockTeams.findIndex((t) => t.id === id);
  if (teamIndex === -1) {
    return error("Team not found", null as unknown as Team);
  }

  const updatedTeam = {
    ...mockTeams[teamIndex],
    ...data,
    slug: data.name
      ? data.name.trim().toLowerCase().replace(/\s+/g, "-")
      : mockTeams[teamIndex].slug,
  };

  mockTeams[teamIndex] = updatedTeam;
  return success(updatedTeam);
}

async function deleteTeam(id: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const teamIndex = mockTeams.findIndex((t) => t.id === id);
  if (teamIndex === -1) {
    return error("Team not found", undefined);
  }

  mockTeams.splice(teamIndex, 1);

  // Also remove any pending invites for this team
  const inviteIndicesToRemove = mockTeamInvites
    .map((invite, index) => (invite.teamId === id ? index : -1))
    .filter((i) => i !== -1)
    .reverse();

  for (const index of inviteIndicesToRemove) {
    mockTeamInvites.splice(index, 1);
  }

  return success(undefined);
}

// Member management

async function addMember(
  teamId: string,
  userId: string,
  role: "lead" | "member" = "member"
): Promise<ServiceResponse<Team>> {
  await delay(150);

  const team = mockTeams.find((t) => t.id === teamId);
  if (!team) {
    return error("Team not found", null as unknown as Team);
  }

  const user = mockUsers.find((u) => u.id === userId);
  if (!user) {
    return error("User not found", null as unknown as Team);
  }

  // Check if already a member
  if (team.members.some((m) => m.userId === userId)) {
    return error("User is already a member", team);
  }

  const newMember: TeamMember = {
    userId,
    user,
    role,
    joinedAt: new Date(),
  };

  team.members.push(newMember);
  return success(team);
}

async function removeMember(teamId: string, userId: string): Promise<ServiceResponse<Team>> {
  await delay(150);

  const team = mockTeams.find((t) => t.id === teamId);
  if (!team) {
    return error("Team not found", null as unknown as Team);
  }

  const memberIndex = team.members.findIndex((m) => m.userId === userId);
  if (memberIndex === -1) {
    return error("User is not a member of this team", team);
  }

  team.members.splice(memberIndex, 1);
  return success(team);
}

async function transferLead(teamId: string, newLeadUserId: string): Promise<ServiceResponse<Team>> {
  await delay(150);

  const team = mockTeams.find((t) => t.id === teamId);
  if (!team) {
    return error("Team not found", null as unknown as Team);
  }

  const newLead = team.members.find((m) => m.userId === newLeadUserId);
  if (!newLead) {
    return error("User is not a member of this team", team);
  }

  // Demote current lead(s)
  team.members.forEach((m) => {
    if (m.role === "lead") {
      m.role = "member";
    }
  });

  // Promote new lead
  newLead.role = "lead";

  return success(team);
}

async function isLead(userId: string, teamId: string): Promise<ServiceResponse<boolean>> {
  await delay();
  const result = mockIsTeamLead(userId, teamId);
  return success(result);
}

// Invites

async function getInvites(teamId: string): Promise<ServiceResponse<TeamInvite[]>> {
  await delay();
  const invites = mockGetTeamInvites(teamId);
  return success(invites);
}

async function getPendingInvitesForUser(email: string): Promise<ServiceResponse<TeamInvite[]>> {
  await delay();
  const invites = mockGetPendingInvitesForUser(email);
  return success(invites);
}

async function createInvite(data: CreateInviteData): Promise<ServiceResponse<TeamInvite>> {
  await delay(200);

  const team = mockTeams.find((t) => t.id === data.teamId);
  if (!team) {
    return error("Team not found", null as unknown as TeamInvite);
  }

  const inviter = mockUsers.find((u) => u.id === data.invitedBy);
  if (!inviter) {
    return error("Inviter not found", null as unknown as TeamInvite);
  }

  // Check if already invited
  const existingInvite = mockTeamInvites.find(
    (i) => i.teamId === data.teamId && i.email.toLowerCase() === data.email.toLowerCase() && i.status === "pending"
  );
  if (existingInvite) {
    return error("User already has a pending invite", existingInvite);
  }

  // Check if already a member
  const existingMember = team.members.find(
    (m) => m.user.email.toLowerCase() === data.email.toLowerCase()
  );
  if (existingMember) {
    return error("User is already a team member", null as unknown as TeamInvite);
  }

  const newInvite: TeamInvite = {
    id: generateId("invite"),
    teamId: data.teamId,
    team,
    email: data.email.toLowerCase(),
    invitedBy: data.invitedBy,
    inviter,
    status: "pending",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  mockTeamInvites.push(newInvite);
  return success(newInvite);
}

async function acceptInvite(inviteId: string, userId: string): Promise<ServiceResponse<Team>> {
  await delay(200);

  const invite = mockTeamInvites.find((i) => i.id === inviteId);
  if (!invite) {
    return error("Invite not found", null as unknown as Team);
  }

  if (invite.status !== "pending") {
    return error("Invite is no longer pending", null as unknown as Team);
  }

  const team = mockTeams.find((t) => t.id === invite.teamId);
  if (!team) {
    return error("Team not found", null as unknown as Team);
  }

  const user = mockUsers.find((u) => u.id === userId);
  if (!user) {
    return error("User not found", null as unknown as Team);
  }

  // Update invite status
  invite.status = "accepted";

  // Add user to team
  const newMember: TeamMember = {
    userId,
    user,
    role: "member",
    joinedAt: new Date(),
  };
  team.members.push(newMember);

  return success(team);
}

async function declineInvite(inviteId: string): Promise<ServiceResponse<void>> {
  await delay(150);

  const invite = mockTeamInvites.find((i) => i.id === inviteId);
  if (!invite) {
    return error("Invite not found", undefined);
  }

  invite.status = "declined";
  return success(undefined);
}

export const teamsService: TeamsService = {
  getById,
  getByUser,
  getByUserAndCohort,
  create,
  update,
  delete: deleteTeam,
  addMember,
  removeMember,
  transferLead,
  isLead,
  getInvites,
  getPendingInvitesForUser,
  createInvite,
  acceptInvite,
  declineInvite,
};
