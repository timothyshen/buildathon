"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { teamsService, cohortsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Plus, Users, Loader2, ChevronRight, Crown, Check, X, Mail } from "lucide-react";
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

      if (teamsResult.success) setUserTeams(teamsResult.data);
      if (invitesResult.success) setPendingInvites(invitesResult.data);
      if (cohortsResult.success) {
        setCohortMap(new Map(cohortsResult.data.map((c: Cohort) => [c.id, c])));
      }
      setIsLoading(false);
    }
    loadData();
  }, [user?.id]);

  if (!user) return null;

  const handleAcceptInvite = async (inviteId: string) => {
    const { success } = await teamsService.acceptInvite(inviteId, user.id);
    if (success) {
      toast.success("You have joined the team!");
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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teams/new" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="flex items-center divide-x">
        <div className="pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {userTeams.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Teams</div>
        </div>
        <div className="px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {userTeams.reduce((sum, t) => sum + t.members.length, 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total members</div>
        </div>
        {pendingInvites.length > 0 && (
          <div className="pl-8">
            <div className="text-3xl font-mono font-semibold tabular-nums text-violet-600">
              {pendingInvites.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Invitations</div>
          </div>
        )}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            Pending Invitations
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="h-4 w-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{invite.team?.name}</span>
                    <p className="text-xs text-muted-foreground">
                      Invited by {invite.inviter?.name || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleAcceptInvite(invite.id)}
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDeclineInvite(invite.id)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Teams */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          My Teams
        </h2>

        {userTeams.length === 0 ? (
          <div className="rounded-xl border p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-medium">No teams yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a team to start collaborating
            </p>
            <Button asChild size="sm" className="mt-4 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/teams/new">Create team</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userTeams.map((team) => {
              const cohort = team.cohortId ? cohortMap.get(team.cohortId) : undefined;
              const isLead = team.members.some(
                (m) => m.userId === user.id && m.role === "lead"
              );
              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{team.name}</span>
                        {isLead && (
                          <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cohort?.name || "Unknown Cohort"}
                        {cohort?.status === "active" && (
                          <span className="inline-flex items-center ml-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </span>
                        )}
                      </p>

                      {/* Member avatars */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex -space-x-1.5">
                          {team.members.slice(0, 4).map((member) => (
                            <Image
                              key={member.userId}
                              src={
                                member.user.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`
                              }
                              alt={member.user.name}
                              width={24}
                              height={24}
                              unoptimized
                              className="h-6 w-6 rounded-full border-2 border-background object-cover"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
