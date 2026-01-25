import { Team } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card>
      <CardHeader>
        <CardTitle>{team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {team.members.map((member) => (
            <li key={member.userId} className="flex items-center gap-4">
              {/* Avatar */}
              <Avatar size="lg">
                {member.user.avatar ? (
                  <AvatarImage
                    src={member.user.avatar}
                    alt={member.user.name}
                  />
                ) : null}
                <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
              </Avatar>

              {/* Name and Role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {member.user.name}
                  </span>
                  {member.role === "lead" && (
                    <Badge variant="secondary">Lead</Badge>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2">
                {member.user.github && (
                  <a
                    href={`https://github.com/${member.user.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${member.user.name}'s GitHub`}
                  >
                    <Github className="h-5 w-5" />
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
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
