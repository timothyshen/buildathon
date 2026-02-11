import { Team } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Github, Twitter } from "lucide-react";

interface ProjectTeamProps {
  team: Team;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProjectTeam({ team }: ProjectTeamProps) {
  return (
    <section className="rounded-xl border p-5 space-y-4">
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
        {team.name}
      </h3>
      <ul className="space-y-4">
        {team.members.map((member) => (
          <li key={member.userId} className="flex items-center gap-3">
            <Avatar size="lg">
              {member.user.avatar ? (
                <AvatarImage
                  src={member.user.avatar}
                  alt={member.user.name}
                />
              ) : null}
              <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {member.user.name}
                </span>
                {member.role === "lead" && (
                  <span className="text-[11px] text-muted-foreground">Lead</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {member.user.github && (
                <a
                  href={`https://github.com/${member.user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`${member.user.name}'s GitHub`}
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {member.user.twitter && (
                <a
                  href={`https://twitter.com/${member.user.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`${member.user.name}'s Twitter`}
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
