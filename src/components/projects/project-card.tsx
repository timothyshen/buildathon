import Link from "next/link";
import { Submission } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Submission;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const displayedTechStack = project.techStack.slice(0, 4);
  const remainingCount = project.techStack.length - 4;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md h-full">
        {/* Screenshot background section */}
        <div
          className="h-40 bg-muted bg-cover bg-center"
          style={
            project.screenshots?.[0]
              ? { backgroundImage: `url(${project.screenshots[0]})` }
              : undefined
          }
        />

        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            {project.status === "winner" && (
              <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
                Winner
              </Badge>
            )}
          </div>
          {project.tagline && (
            <CardDescription>{project.tagline}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          {/* Tech stack badges */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayedTechStack.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline">+{remainingCount}</Badge>
              )}
            </div>
          )}

          {/* Team name */}
          {project.team && (
            <p className="text-xs text-muted-foreground mt-auto">
              {project.team.name}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
