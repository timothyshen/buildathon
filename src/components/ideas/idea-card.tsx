"use client";

import Link from "next/link";
import { MessageCircle, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IdeaVoteButton } from "./idea-vote-button";
import { cn } from "@/lib/utils";
import type { Idea, IdeaStatus } from "@/types";

interface IdeaCardProps {
  idea: Idea;
  onVoteChange?: (ideaId: string, newCount: number, hasVoted: boolean) => void;
}

const STATUS_COLORS: Record<IdeaStatus, string> = {
  open: "bg-blue-500",
  seeking_team: "bg-amber-500",
  in_progress: "bg-violet-500",
  built: "bg-emerald-500",
  archived: "bg-muted-foreground",
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  open: "Open",
  seeking_team: "Seeking Team",
  in_progress: "In Progress",
  built: "Built",
  archived: "Archived",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function IdeaCard({ idea, onVoteChange }: IdeaCardProps) {
  return (
    <Link href={`/ideas/${idea.id}`} className="block">
      <article className="rounded-xl border p-5 hover:border-foreground/20 transition-colors space-y-3">
        {/* Header: status + title */}
        <div className="flex items-start gap-3">
          <IdeaVoteButton
            ideaId={idea.id}
            initialCount={idea.voteCount}
            initialHasVoted={idea.hasVoted}
            onVoteChange={(newCount, hasVoted) => onVoteChange?.(idea.id, newCount, hasVoted)}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold line-clamp-1">{idea.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {stripHtml(idea.description)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-[11px] text-muted-foreground">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: author, status, stats */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {idea.author && (
              <>
                <Avatar size="sm">
                  {idea.author.avatar && (
                    <AvatarImage src={idea.author.avatar} alt={idea.author.name} />
                  )}
                  <AvatarFallback>
                    {getInitials(idea.author.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {idea.author.name}
                </span>
              </>
            )}
            <div className="flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-full", STATUS_COLORS[idea.status])} />
              <span className="text-[11px] text-muted-foreground">{STATUS_LABELS[idea.status]}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1 text-xs">
              <MessageCircle className="h-3.5 w-3.5" />
              {idea.commentCount}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Users className="h-3.5 w-3.5" />
              {idea.interestCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
