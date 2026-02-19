"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { GitFork } from "lucide-react";

interface ForkProjectButtonProps {
  submissionId: string;
  createdBy: string;
  teamMemberIds?: string[];
}

export function ForkProjectButton({
  submissionId,
  createdBy,
  teamMemberIds = [],
}: ForkProjectButtonProps) {
  const { user } = useAuth();

  // Owner should not see the fork button
  if (user) {
    const isOwner =
      user.id === createdBy || teamMemberIds.includes(user.id);
    if (isOwner) return null;
  }

  const forkUrl = `/submissions/${submissionId}/fork`;

  return (
    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
      <Link href={forkUrl}>
        <GitFork className="h-4 w-4 mr-2" />
        Fork this Project
      </Link>
    </Button>
  );
}
