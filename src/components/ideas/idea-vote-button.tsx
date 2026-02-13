"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ideasService } from "@/services";
import { cn } from "@/lib/utils";

interface IdeaVoteButtonProps {
  ideaId: string;
  initialCount: number;
  initialHasVoted?: boolean;
  size?: "sm" | "lg";
  onVoteChange?: (newCount: number, hasVoted: boolean) => void;
}

export function IdeaVoteButton({ ideaId, initialCount, initialHasVoted = false, size = "sm", onVoteChange }: IdeaVoteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login?redirect=/ideas");
      return;
    }

    if (isLoading) return;

    const newHasVoted = !hasVoted;
    const newCount = newHasVoted ? count + 1 : count - 1;
    setHasVoted(newHasVoted);
    setCount(newCount);
    onVoteChange?.(newCount, newHasVoted);

    setIsLoading(true);
    try {
      const res = newHasVoted
        ? await ideasService.vote(ideaId, user.id)
        : await ideasService.unvote(ideaId, user.id);

      if (!res.success) {
        setHasVoted(!newHasVoted);
        setCount(newHasVoted ? newCount - 1 : newCount + 1);
        onVoteChange?.(newHasVoted ? newCount - 1 : newCount + 1, !newHasVoted);
      }
    } catch {
      setHasVoted(!newHasVoted);
      setCount(newHasVoted ? newCount - 1 : newCount + 1);
      onVoteChange?.(newHasVoted ? newCount - 1 : newCount + 1, !newHasVoted);
    } finally {
      setIsLoading(false);
    }
  };

  if (size === "lg") {
    return (
      <Button
        variant={hasVoted ? "default" : "outline"}
        onClick={handleVote}
        className={cn(
          "flex flex-col items-center gap-0.5 h-auto py-3 px-5 min-w-[72px]",
          hasVoted && "bg-primary text-primary-foreground"
        )}
      >
        <ChevronUp className="h-5 w-5" />
        <span className="text-sm font-semibold">{count}</span>
      </Button>
    );
  }

  return (
    <button
      onClick={handleVote}
      className={cn(
        "flex flex-col items-center gap-0 rounded-md border px-2.5 py-1.5 transition-colors min-w-[44px]",
        hasVoted
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      )}
    >
      <ChevronUp className="h-4 w-4 -mb-0.5" />
      <span className="text-xs font-semibold">{count}</span>
    </button>
  );
}
