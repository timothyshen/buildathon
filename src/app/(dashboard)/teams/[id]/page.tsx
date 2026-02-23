"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { teamsService, cohortsService } from "@/services";
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
import { ArrowLeft, Users, LogOut, Trash2, Clock, Loader2, Crown, Copy } from "lucide-react";
import { TeamMemberList, InviteForm } from "@/components/teams";
import { toast } from "sonner";
import type { Team, Cohort, TeamInvite } from "@/types";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

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

        const { data: cohortData } = await cohortsService.getById(teamResult.data.cohortId);
        setCohort(cohortData);

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
        <h2 className="text-sm font-medium">Team not found</h2>
        <Button asChild size="sm" className="mt-4" variant="ghost">
          <Link href="/teams">Back to Teams</Link>
        </Button>
      </div>
    );
  }

  const isMember = team.members.some((m) => m.userId === user.id);

  if (!isMember) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-sm font-medium">You&apos;re not a member of this team</h2>
        <Button asChild size="sm" className="mt-4" variant="ghost">
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
      const { data: invites } = await teamsService.getInvites(teamId);
      setPendingInvites(invites.filter((i) => i.status === "pending"));

      // Fire-and-forget notification trigger
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "team_invite_created",
          data: { teamName: team.name, email },
        }),
      }).catch(() => {});
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
    if (isLead && team.members.length > 1) {
      const nextMember = team.members.find((m) => m.userId !== user.id);
      if (nextMember) {
        await teamsService.transferLead(teamId, nextMember.userId);
      }
    }

    const { success } = await teamsService.removeMember(teamId, user.id);

    if (success) {
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
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/teams"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
            {isLead && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cohort?.name || "Unknown Cohort"}
            {cohort?.status === "active" && (
              <span className="inline-flex items-center ml-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:gap-0">
        <div className="md:pr-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            {team.members.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Members</div>
        </div>
        <div className="md:px-8">
          <div className="text-3xl font-mono font-semibold tabular-nums text-violet-600">
            {pendingInvites.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending invites</div>
        </div>
        <div className="md:pl-8">
          <div className="text-3xl font-mono font-semibold tabular-nums">
            5
          </div>
          <div className="text-xs text-muted-foreground mt-1">Max size</div>
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Description
          </h2>
          <p className="text-sm text-muted-foreground">{team.description}</p>
        </section>
      )}

      {/* Members */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Members
          </h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {team.members.length}/5
          </span>
        </div>
        <div className="rounded-xl border overflow-x-auto">
          <TeamMemberList
            members={team.members}
            currentUserId={user.id}
            isLead={isLead}
            onRemove={isLead ? handleRemoveMember : undefined}
          />
        </div>
      </section>

      {/* Invite section (lead only) */}
      {isLead && (
        <section>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            Invite Members
          </h2>
          <div className="rounded-xl border p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Share this link with people you want to invite to your team.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const link = `${window.location.origin}/teams?join=${teamId}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Invite link copied to clipboard");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                Copy Invite Link
              </Button>
            </div>

            {/* Email invite (alternative) */}
            <div className="pt-4 border-t">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Or invite by email
              </p>
              <InviteForm
                currentMemberCount={team.members.length + pendingInvites.length}
                existingEmails={existingEmails}
                onInvite={handleInvite}
              />
            </div>
          </div>

          {pendingInvites.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Pending
              </p>
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-dashed py-2.5 px-3"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{invite.email}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Danger zone */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-destructive font-medium mb-4">
          Danger Zone
        </h2>
        <div className="space-y-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-2 w-full rounded-xl border py-3 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <LogOut className="h-4 w-4" />
                Leave Team
              </button>
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
                <button className="flex items-center gap-2 w-full rounded-xl border border-destructive/20 py-3 px-4 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                  <Trash2 className="h-4 w-4" />
                  Delete Team
                </button>
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
        </div>
      </section>
    </div>
  );
}
