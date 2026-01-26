"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X } from "lucide-react";
import { TeamMember } from "@/types";

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId: string;
  isLead: boolean;
  onRemove?: (userId: string) => void;
}

export function TeamMemberList({
  members,
  currentUserId,
  isLead,
  onRemove,
}: TeamMemberListProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const canRemove = isLead && !isSelf && member.role !== "lead";

        return (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  member.user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`
                }
                alt={member.user.name}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {member.user.name}
                    {isSelf && (
                      <span className="ml-1 text-muted-foreground">(you)</span>
                    )}
                  </p>
                  {member.role === "lead" && (
                    <Badge variant="secondary" className="gap-1">
                      <Crown className="h-3 w-3" />
                      Lead
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>
            {canRemove && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(member.userId)}
                className="text-destructive hover:text-destructive"
                aria-label={`Remove ${member.user.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
