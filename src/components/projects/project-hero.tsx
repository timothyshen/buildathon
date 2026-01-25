import { Submission } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, Play, FileText, Trophy, Award, Medal, Star } from "lucide-react";

interface ProjectHeroProps {
  project: Submission;
  trackName?: string;
  cohortName?: string;
}

function getStatusBadge(status: Submission["status"]) {
  switch (status) {
    case "winner":
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Trophy className="h-3 w-3 mr-1.5" />
          Winner
        </Badge>
      );
    case "submitted":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          Submitted
        </Badge>
      );
    case "under_review":
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          Under Review
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <Star className="h-3 w-3 mr-1.5" />
          Accepted
        </Badge>
      );
    case "draft":
    default:
      return (
        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
          Draft
        </Badge>
      );
  }
}

export function ProjectHero({ project, trackName, cohortName }: ProjectHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 mx-4 mt-4">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative p-8 lg:p-12">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {getStatusBadge(project.status)}
          {trackName && (
            <Badge variant="outline" className="text-slate-300 border-slate-700">
              <Award className="h-3 w-3 mr-1.5" />
              {trackName}
            </Badge>
          )}
          {cohortName && (
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              {cohortName}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
          {project.title}
        </h1>

        {/* Tagline */}
        {project.tagline && (
          <p className="mt-4 text-xl text-slate-400">{project.tagline}</p>
        )}

        {/* Team Name */}
        {project.team && (
          <p className="mt-3 text-slate-500">by {project.team.name}</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          {project.demoUrl && (
            <Button className="bg-white text-slate-900 hover:bg-slate-100" asChild>
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
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                View Code
              </a>
            </Button>
          )}

          {project.videoUrl && (
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
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
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
              <a
                href={project.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4" />
                Presentation
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
