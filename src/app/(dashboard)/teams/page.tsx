"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { teamsService, cohortsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Users, Loader2 } from "lucide-react";
import { TeamCard, PendingInvites } from "@/components/teams";
import { toast } from "sonner";
import type { Team, TeamInvite, Cohort } from "@/types";

export default function TeamsPage() {
  const { user } = useAuth();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([]);
  const [cohortMap, setCohortMap] = useState<Map<string, Cohort>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const [teamsResult, invitesResult, cohortsResult] = await Promise.all([
        teamsService.getByUser(user.id),
        teamsService.getPendingInvitesForUser(user.email),
        cohortsService.list(),
      ]);

      if (teamsResult.success) {
        setUserTeams(teamsResult.data);
      }
      if (invitesResult.success) {
        setPendingInvites(invitesResult.data);
      }
      if (cohortsResult.success) {
        setCohortMap(new Map(cohortsResult.data.map((c: Cohort) => [c.id, c])));
      }
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  if (!user) return null;

  const handleAcceptInvite = async (inviteId: string) => {
    const { success } = await teamsService.acceptInvite(inviteId, user.id);
    if (success) {
      toast.success("You have joined the team!");
      // Reload data
      const [teamsResult, invitesResult] = await Promise.all([
        teamsService.getByUser(user.id),
        teamsService.getPendingInvitesForUser(user.email),
      ]);
      if (teamsResult.success) setUserTeams(teamsResult.data);
      if (invitesResult.success) setPendingInvites(invitesResult.data);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    const { success } = await teamsService.declineInvite(inviteId);
    if (success) {
      toast.success("Invitation declined");
      const { data } = await teamsService.getPendingInvitesForUser(user.email);
      setPendingInvites(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your buildathon teams and invitations
          </p>
        </div>
        <Button asChild>
          <Link href="/teams/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      <PendingInvites
        invites={pendingInvites}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      {userTeams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a team to start collaborating on buildathon projects.
            </p>
            <Button asChild className="mt-4">
              <Link href="/teams/new">Create Team</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {userTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              currentUserId={user.id}
              cohort={team.cohortId ? cohortMap.get(team.cohortId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
