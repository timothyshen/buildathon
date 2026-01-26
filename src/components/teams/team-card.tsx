"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, ChevronRight } from "lucide-react";
import { Team, Cohort } from "@/types";
import { mockCohorts } from "@/data/mock-data";

interface TeamCardProps {
  team: Team;
  currentUserId: string;
}

export function TeamCard({ team, currentUserId }: TeamCardProps) {
  const cohort = mockCohorts.find((c) => c.id === team.cohortId);
  const isLead = team.members.some(
    (m) => m.userId === currentUserId && m.role === "lead"
  );
  const memberCount = team.members.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              {isLead && (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Lead
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              {cohort?.name || "Unknown Cohort"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teams/${team.id}`}>
              View
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {team.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {team.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{memberCount}/5 members</span>
            </div>
            {cohort && (
              <Badge
                variant={cohort.status === "active" ? "default" : "secondary"}
                className="text-xs"
              >
                {cohort.status}
              </Badge>
            )}
          </div>
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((member) => (
              <img
                key={member.userId}
                src={
                  member.user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`
                }
                alt={member.user.name}
                title={member.user.name}
                className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
