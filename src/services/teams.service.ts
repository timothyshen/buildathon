/**
 * Teams Service
 * Handles team CRUD, member management, and invitations
 */

import { createClient } from "@/lib/supabase/client";
import type { Team, TeamInvite, User } from "@/types";
import type { ServiceResponse } from "./types";
import { success, error } from "./types";

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

// Convert user row to User type
function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User["role"],
    avatar: row.avatar as string | undefined,
    walletAddress: row.wallet_address as string | undefined,
    bio: row.bio as string | undefined,
    twitter: row.twitter as string | undefined,
    github: row.github as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

// Convert database rows to Team type with members
function toTeam(
  teamRow: Record<string, unknown>,
  members: Array<{ user: Record<string, unknown>; role: string; joined_at: string }>
): Team {
  return {
    id: teamRow.id as string,
    cohortId: teamRow.cohort_id as string,
    name: teamRow.name as string,
    slug: teamRow.slug as string,
    description: teamRow.description as string | undefined,
    logoUrl: teamRow.logo_url as string | undefined,
    members: members.map((m) => ({
      userId: m.user.id as string,
      user: toUser(m.user),
      role: m.role as "lead" | "member",
      joinedAt: new Date(m.joined_at),
    })),
  };
}

// Convert database row to TeamInvite type
function toTeamInvite(row: Record<string, unknown>, team?: Team, inviter?: User): TeamInvite {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    team,
    email: row.email as string,
    invitedBy: row.invited_by as string,
    inviter,
    status: row.status as TeamInvite["status"],
    createdAt: new Date(row.created_at as string),
    expiresAt: new Date(row.expires_at as string),
  };
}

// Helper to fetch team with members
async function fetchTeamWithMembers(supabase: ReturnType<typeof createClient>, teamId: string): Promise<Team | null> {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError) return null;

  const { data: membersData } = await supabase
    .from("team_members")
    .select(`
      role,
      joined_at,
      users (*)
    `)
    .eq("team_id", teamId);

  const members = (membersData || []).map((m) => ({
    user: m.users as Record<string, unknown>,
    role: m.role as string,
    joined_at: m.joined_at as string,
  }));

  return toTeam(teamData, members);
}

// Team CRUD

async function getById(id: string): Promise<ServiceResponse<Team | null>> {
  const supabase = createClient();
  const team = await fetchTeamWithMembers(supabase, id);
  return success(team);
}

async function getByUser(userId: string): Promise<ServiceResponse<Team[]>> {
  const supabase = createClient();

  // Get all team IDs the user is a member of
  const { data: memberData, error: memberError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (memberError) {
    return error(memberError.message, []);
  }

  if (!memberData || memberData.length === 0) {
    return success([]);
  }

  const teamIds = memberData.map((m) => m.team_id);
  const teams: Team[] = [];

  for (const teamId of teamIds) {
    const team = await fetchTeamWithMembers(supabase, teamId);
    if (team) teams.push(team);
  }

  return success(teams);
}

async function getByUserAndCohort(
  userId: string,
  cohortId: string
): Promise<ServiceResponse<Team | null>> {
  const supabase = createClient();

  // Get team IDs for the user
  const { data: memberData } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (!memberData || memberData.length === 0) {
    return success(null);
  }

  const teamIds = memberData.map((m) => m.team_id);

  // Find team in the specified cohort
  const { data: teamData } = await supabase
    .from("teams")
    .select("id")
    .eq("cohort_id", cohortId)
    .in("id", teamIds)
    .single();

  if (!teamData) {
    return success(null);
  }

  const team = await fetchTeamWithMembers(supabase, teamData.id);
  return success(team);
}

async function create(data: CreateTeamData): Promise<ServiceResponse<Team>> {
  const supabase = createClient();

  const slug = data.name.trim().toLowerCase().replace(/\s+/g, "-");

  // Create team
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .insert({
      cohort_id: data.cohortId,
      name: data.name.trim(),
      slug,
      description: data.description?.trim(),
    })
    .select()
    .maybeSingle();

  if (teamError) {
    return error(teamError.message);
  }

  if (!teamData) {
    return error("Failed to retrieve created team");
  }

  // Add lead member
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamData.id,
      user_id: data.leadUserId,
      role: "lead",
    });

  if (memberError) {
    // Rollback team creation
    await supabase.from("teams").delete().eq("id", teamData.id);
    return error(memberError.message);
  }

  const team = await fetchTeamWithMembers(supabase, teamData.id);
  return success(team!);
}

async function update(
  id: string,
  data: Partial<Pick<Team, "name" | "description" | "logoUrl">>
): Promise<ServiceResponse<Team>> {
  const supabase = createClient();

  const dbData: Record<string, unknown> = {};
  if (data.name !== undefined) {
    dbData.name = data.name.trim();
    dbData.slug = data.name.trim().toLowerCase().replace(/\s+/g, "-");
  }
  if (data.description !== undefined) dbData.description = data.description;
  if (data.logoUrl !== undefined) dbData.logo_url = data.logoUrl;

  const { error: dbError } = await supabase
    .from("teams")
    .update(dbData)
    .eq("id", id);

  if (dbError) {
    return error(dbError.message);
  }

  const team = await fetchTeamWithMembers(supabase, id);
  return success(team!);
}

async function deleteTeam(id: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("teams")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(dbError.message, undefined);
  }

  return success(undefined);
}

// Member management

async function addMember(
  teamId: string,
  userId: string,
  role: "lead" | "member" = "member"
): Promise<ServiceResponse<Team>> {
  const supabase = createClient();

  // Enforce team size limit
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);
  const { data: teamRow } = await supabase.from("teams").select("cohort_id").eq("id", teamId).single();
  let maxSize = 5;
  if (teamRow?.cohort_id) {
    const { data: cohort } = await supabase.from("cohorts").select("max_team_size").eq("id", teamRow.cohort_id).single();
    if (cohort?.max_team_size) maxSize = cohort.max_team_size;
  }
  if (count !== null && count >= maxSize) {
    return error("Team has reached maximum size");
  }

  const { error: dbError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    });

  if (dbError) {
    if (dbError.code === "23505") {
      return error("User is already a member");
    }
    return error(dbError.message);
  }

  const team = await fetchTeamWithMembers(supabase, teamId);
  return success(team!);
}

async function removeMember(teamId: string, userId: string): Promise<ServiceResponse<Team>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (dbError) {
    return error(dbError.message);
  }

  const team = await fetchTeamWithMembers(supabase, teamId);
  return success(team!);
}

async function transferLead(teamId: string, newLeadUserId: string): Promise<ServiceResponse<Team>> {
  const supabase = createClient();

  // Demote all current leads to members
  await supabase
    .from("team_members")
    .update({ role: "member" })
    .eq("team_id", teamId)
    .eq("role", "lead");

  // Promote new lead
  const { error: dbError } = await supabase
    .from("team_members")
    .update({ role: "lead" })
    .eq("team_id", teamId)
    .eq("user_id", newLeadUserId);

  if (dbError) {
    return error(dbError.message);
  }

  const team = await fetchTeamWithMembers(supabase, teamId);
  return success(team!);
}

async function isLead(userId: string, teamId: string): Promise<ServiceResponse<boolean>> {
  const supabase = createClient();

  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  return success(data?.role === "lead");
}

// Invites

async function getInvites(teamId: string): Promise<ServiceResponse<TeamInvite[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("team_invites")
    .select(`
      *,
      users!team_invites_invited_by_fkey (*)
    `)
    .eq("team_id", teamId)
    .eq("status", "pending");

  if (dbError) {
    return error(dbError.message, []);
  }

  const team = await fetchTeamWithMembers(supabase, teamId);

  const invites = (data || []).map((row) => {
    const inviter = row.users ? toUser(row.users as Record<string, unknown>) : undefined;
    return toTeamInvite(row, team || undefined, inviter);
  });

  return success(invites);
}

async function getPendingInvitesForUser(email: string): Promise<ServiceResponse<TeamInvite[]>> {
  const supabase = createClient();

  const { data, error: dbError } = await supabase
    .from("team_invites")
    .select(`
      *,
      teams (*),
      users!team_invites_invited_by_fkey (*)
    `)
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (dbError) {
    return error(dbError.message, []);
  }

  const invites: TeamInvite[] = [];
  for (const row of data || []) {
    const teamData = row.teams as Record<string, unknown>;
    const team = teamData ? await fetchTeamWithMembers(supabase, teamData.id as string) : undefined;
    const inviter = row.users ? toUser(row.users as Record<string, unknown>) : undefined;
    invites.push(toTeamInvite(row, team || undefined, inviter));
  }

  return success(invites);
}

async function createInvite(data: CreateInviteData): Promise<ServiceResponse<TeamInvite>> {
  const supabase = createClient();

  // Check for existing pending invite
  const { data: existing } = await supabase
    .from("team_invites")
    .select("id")
    .eq("team_id", data.teamId)
    .eq("email", data.email.toLowerCase())
    .eq("status", "pending")
    .single();

  if (existing) {
    return error("User already has a pending invite");
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { data: created, error: dbError } = await supabase
    .from("team_invites")
    .insert({
      team_id: data.teamId,
      email: data.email.toLowerCase(),
      invited_by: data.invitedBy,
      expires_at: expiresAt.toISOString(),
    })
    .select(`
      *,
      users!team_invites_invited_by_fkey (*)
    `)
    .single();

  if (dbError) {
    return error(dbError.message);
  }

  const team = await fetchTeamWithMembers(supabase, data.teamId);
  const inviter = created.users ? toUser(created.users as Record<string, unknown>) : undefined;

  return success(toTeamInvite(created, team || undefined, inviter));
}

async function acceptInvite(inviteId: string, userId: string): Promise<ServiceResponse<Team>> {
  const supabase = createClient();

  // Get invite
  const { data: invite, error: inviteError } = await supabase
    .from("team_invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (inviteError || !invite) {
    return error("Invite not found");
  }

  if (invite.status !== "pending") {
    return error("Invite is no longer pending");
  }

  // Enforce team size limit
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", invite.team_id);
  const { data: teamRow } = await supabase.from("teams").select("cohort_id").eq("id", invite.team_id).single();
  let maxSize = 5;
  if (teamRow?.cohort_id) {
    const { data: cohort } = await supabase.from("cohorts").select("max_team_size").eq("id", teamRow.cohort_id).single();
    if (cohort?.max_team_size) maxSize = cohort.max_team_size;
  }
  if (count !== null && count >= maxSize) {
    return error("Team has reached maximum size");
  }

  // Update invite status
  await supabase
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId);

  // Add user to team
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: invite.team_id,
      user_id: userId,
      role: "member",
    });

  if (memberError) {
    return error(memberError.message);
  }

  const team = await fetchTeamWithMembers(supabase, invite.team_id);
  return success(team!);
}

async function declineInvite(inviteId: string): Promise<ServiceResponse<void>> {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from("team_invites")
    .update({ status: "declined" })
    .eq("id", inviteId);

  if (dbError) {
    return error(dbError.message, undefined);
  }

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
