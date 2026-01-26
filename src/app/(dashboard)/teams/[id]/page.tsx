"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  mockTeams,
  mockCohorts,
  mockTeamInvites,
  getTeamInvites,
  isTeamLead,
} from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Trophy, LogOut, Trash2, Clock } from "lucide-react";
import { TeamMemberList, InviteForm } from "@/components/teams";
import { toast } from "sonner";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const teamId = params.id as string;
  const team = mockTeams.find((t) => t.id === teamId);

  if (!user || !team) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Team not found</h2>
        <Button asChild className="mt-4">
          <Link href="/teams">Back to Teams</Link>
        </Button>
      </div>
    );
  }

  const cohort = mockCohorts.find((c) => c.id === team.cohortId);
  const isLead = isTeamLead(user.id, teamId);
  const isMember = team.members.some((m) => m.userId === user.id);
  const pendingInvites = getTeamInvites(teamId).filter(
    (i) => i.status === "pending"
  );

  const existingEmails = [
    ...team.members.map((m) => m.user.email.toLowerCase()),
    ...pendingInvites.map((i) => i.email.toLowerCase()),
  ];

  const handleInvite = async (email: string) => {
    // Mock: Create new invite
    const newInvite = {
      id: `invite-${Date.now()}`,
      teamId,
      team,
      email: email.toLowerCase(),
      invitedBy: user.id,
      inviter: user,
      status: "pending" as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    mockTeamInvites.push(newInvite);
    setRefreshKey((k) => k + 1);
  };

  const handleRemoveMember = (userId: string) => {
    const memberIndex = team.members.findIndex((m) => m.userId === userId);
    if (memberIndex > -1) {
      team.members.splice(memberIndex, 1);
      toast.success("Member removed");
      setRefreshKey((k) => k + 1);
    }
  };

  const handleLeaveTeam = () => {
    const memberIndex = team.members.findIndex((m) => m.userId === user.id);
    if (memberIndex > -1) {
      if (isLead && team.members.length > 1) {
        // Transfer lead to next member
        const nextMember = team.members.find((m) => m.userId !== user.id);
        if (nextMember) nextMember.role = "lead";
      }
      team.members.splice(memberIndex, 1);

      // Delete team if no members left
      if (team.members.length === 0) {
        const teamIndex = mockTeams.findIndex((t) => t.id === teamId);
        if (teamIndex > -1) mockTeams.splice(teamIndex, 1);
      }

      toast.success("You have left the team");
      router.push("/teams");
    }
  };

  const handleDeleteTeam = () => {
    const teamIndex = mockTeams.findIndex((t) => t.id === teamId);
    if (teamIndex > -1) {
      mockTeams.splice(teamIndex, 1);
      toast.success("Team deleted");
      router.push("/teams");
    }
  };

  if (!isMember) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">You're not a member of this team</h2>
        <Button asChild className="mt-4">
          <Link href="/teams">Back to Teams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8" key={refreshKey}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams" aria-label="Back to teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {cohort?.name || "Unknown Cohort"}
          </p>
        </div>
      </div>

      {team.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <Badge variant="secondary">
              {team.members.length}/5 members
            </Badge>
          </div>
          <CardDescription>
            {isLead
              ? "Manage your team members and send invitations"
              : "View your team members"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TeamMemberList
            members={team.members}
            currentUserId={user.id}
            isLead={isLead}
            onRemove={isLead ? handleRemoveMember : undefined}
          />

          {isLead && (
            <>
              <hr />
              <InviteForm
                teamId={teamId}
                currentMemberCount={team.members.length + pendingInvites.length}
                existingEmails={existingEmails}
                onInvite={handleInvite}
              />

              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Invitations
                  </p>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border border-dashed p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{invite.email}</span>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Leave Team
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Team?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isLead && team.members.length > 1
                    ? "As the lead, leaving will transfer leadership to another member."
                    : isLead && team.members.length === 1
                    ? "You're the only member. Leaving will delete the team."
                    : "Are you sure you want to leave this team?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveTeam}>
                  Leave Team
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isLead && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the team and remove all members.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
