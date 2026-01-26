"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Users } from "lucide-react";
import { TeamInvite } from "@/types";
import { toast } from "sonner";

interface PendingInvitesProps {
  invites: TeamInvite[];
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
}

export function PendingInvites({ invites, onAccept, onDecline }: PendingInvitesProps) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <Card className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-violet-600" />
          <CardTitle className="text-lg">Team Invitations</CardTitle>
        </div>
        <CardDescription>
          You have {invites.length} pending team invitation{invites.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-white p-3 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium">{invite.team?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Invited by {invite.inviter?.name || "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAccept(invite.id)}
              >
                <Check className="mr-1 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(invite.id)}
              >
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
