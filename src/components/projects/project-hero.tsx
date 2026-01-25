import { Submission } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, Play, FileText } from "lucide-react";

interface ProjectHeroProps {
  project: Submission;
}

function getStatusBadge(status: Submission["status"]) {
  switch (status) {
    case "winner":
      return {
        label: "Winner",
        className: "bg-yellow-500 text-yellow-950 border-yellow-400",
      };
    case "submitted":
      return {
        label: "Submitted",
        className: "bg-blue-500 text-white border-blue-400",
      };
    case "under_review":
      return {
        label: "Under Review",
        className: "bg-purple-500 text-white border-purple-400",
      };
    case "accepted":
      return {
        label: "Accepted",
        className: "bg-green-500 text-white border-green-400",
      };
    case "draft":
    default:
      return {
        label: "Draft",
        className: "bg-gray-500 text-white border-gray-400",
      };
  }
}

export function ProjectHero({ project }: ProjectHeroProps) {
  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {/* Status Badge */}
        <Badge className={`mb-4 ${statusBadge.className}`}>
          {statusBadge.label}
        </Badge>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
          {project.title}
        </h1>

        {/* Tagline */}
        {project.tagline && (
          <p className="text-lg md:text-xl text-slate-300 mb-4">
            {project.tagline}
          </p>
        )}

        {/* Team Name */}
        {project.team && (
          <p className="text-slate-400 mb-8">by {project.team.name}</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {project.demoUrl && (
            <Button asChild>
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View Demo
              </a>
            </Button>
          )}

          {project.repoUrl && (
            <Button variant="outline" asChild>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                View Repo
              </a>
            </Button>
          )}

          {project.videoUrl && (
            <Button variant="outline" asChild>
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play className="h-4 w-4" />
                Watch Video
              </a>
            </Button>
          )}

          {project.presentationUrl && (
            <Button variant="outline" asChild>
              <a
                href={project.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4" />
                View Presentation
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
