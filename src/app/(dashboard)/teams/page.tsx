"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserTeams, getPendingInvitesForUser, mockTeamInvites, mockTeams } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";
import { TeamCard, PendingInvites } from "@/components/teams";
import { toast } from "sonner";
import { useState } from "react";

export default function TeamsPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return null;

  const userTeams = getUserTeams(user.id);
  const pendingInvites = getPendingInvitesForUser(user.email);

  const handleAcceptInvite = (inviteId: string) => {
    // Mock: Find the invite and update it
    const invite = mockTeamInvites.find((i) => i.id === inviteId);
    if (invite) {
      invite.status = "accepted";
      // Add user to team
      const team = mockTeams.find((t) => t.id === invite.teamId);
      if (team) {
        team.members.push({
          userId: user.id,
          user: user,
          role: "member",
          joinedAt: new Date(),
        });
      }
    }
    toast.success("You have joined the team!");
    setRefreshKey((k) => k + 1);
  };

  const handleDeclineInvite = (inviteId: string) => {
    const invite = mockTeamInvites.find((i) => i.id === inviteId);
    if (invite) {
      invite.status = "declined";
    }
    toast.success("Invitation declined");
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-8" key={refreshKey}>
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
            <TeamCard key={team.id} team={team} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
