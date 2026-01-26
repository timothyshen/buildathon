"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { teamsService, cohortsService } from "@/services";
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
import { ArrowLeft, Users, LogOut, Trash2, Clock, Loader2 } from "lucide-react";
import { TeamMemberList, InviteForm } from "@/components/teams";
import { toast } from "sonner";
import type { Team, Cohort, TeamInvite } from "@/types";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([]);
  const [isLead, setIsLead] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const [teamResult, isLeadResult] = await Promise.all([
        teamsService.getById(teamId),
        teamsService.isLead(user.id, teamId),
      ]);

      if (teamResult.success && teamResult.data) {
        setTeam(teamResult.data);

        // Load cohort
        const { data: cohortData } = await cohortsService.getById(teamResult.data.cohortId);
        setCohort(cohortData);

        // Load pending invites
        const { data: invites } = await teamsService.getInvites(teamId);
        setPendingInvites(invites.filter((i) => i.status === "pending"));
      }

      if (isLeadResult.success) {
        setIsLead(isLeadResult.data);
      }

      setIsLoading(false);
    }
    loadData();
  }, [teamId, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  const isMember = team.members.some((m) => m.userId === user.id);

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

  const existingEmails = [
    ...team.members.map((m) => m.user.email.toLowerCase()),
    ...pendingInvites.map((i) => i.email.toLowerCase()),
  ];

  const handleInvite = async (email: string) => {
    const { success, error } = await teamsService.createInvite({
      teamId,
      email,
      invitedBy: user.id,
    });

    if (success) {
      // Reload invites
      const { data: invites } = await teamsService.getInvites(teamId);
      setPendingInvites(invites.filter((i) => i.status === "pending"));
    } else {
      toast.error(error || "Failed to send invite");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const { success, data: updatedTeam } = await teamsService.removeMember(teamId, userId);
    if (success && updatedTeam) {
      setTeam(updatedTeam);
      toast.success("Member removed");
    }
  };

  const handleLeaveTeam = async () => {
    // If lead and more than one member, transfer lead first
    if (isLead && team.members.length > 1) {
      const nextMember = team.members.find((m) => m.userId !== user.id);
      if (nextMember) {
        await teamsService.transferLead(teamId, nextMember.userId);
      }
    }

    // Remove self from team
    const { success } = await teamsService.removeMember(teamId, user.id);

    if (success) {
      // If was last member, delete team
      if (team.members.length === 1) {
        await teamsService.delete(teamId);
      }
      toast.success("You have left the team");
      router.push("/teams");
    }
  };

  const handleDeleteTeam = async () => {
    const { success } = await teamsService.delete(teamId);
    if (success) {
      toast.error("Team has been deleted");
      router.push("/teams");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
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
