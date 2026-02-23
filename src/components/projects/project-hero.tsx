"use client";

import { Submission } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Github, Play, FileText, Trophy, Award, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProjectHeroProps {
  project: Submission;
  trackName?: string;
  cohortName?: string;
}

function getStatusDot(status: Submission["status"]) {
  const config: Record<string, { color: string; label: string }> = {
    winner: { color: "bg-amber-500", label: "Winner" },
    submitted: { color: "bg-blue-500", label: "Submitted" },
    under_review: { color: "bg-amber-500", label: "Under Review" },
    accepted: { color: "bg-emerald-500", label: "Accepted" },
    draft: { color: "bg-muted-foreground", label: "Draft" },
  };
  const { color, label } = config[status] ?? config.draft;
  return (
    <div className="flex items-center gap-2">
      {status === "winner" ? (
        <Trophy className="h-4 w-4 text-amber-400" />
      ) : (
        <span className={cn("h-2 w-2 rounded-full", color)} />
      )}
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  );
}

export function ProjectHero({ project, trackName, cohortName }: ProjectHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/projects/${project.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };
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
        {/* Status & Meta Row */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {getStatusDot(project.status)}
          {trackName && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Award className="h-3.5 w-3.5" />
              <span className="text-xs">{trackName}</span>
            </div>
          )}
          {cohortName && (
            <span className="text-xs text-slate-500">{cohortName}</span>
          )}
        </div>

        {/* Title with Logo */}
        <div className="flex items-center gap-5">
          {project.logoUrl && (
            <img
              src={project.logoUrl}
              alt={`${project.title} logo`}
              className="h-16 w-16 lg:h-20 lg:w-20 rounded-2xl object-cover border-2 border-white/10 flex-shrink-0"
            />
          )}
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            {project.title}
          </h1>
        </div>

        {/* Tagline */}
        {project.tagline && (
          <p className="mt-4 text-xl text-slate-400">{project.tagline}</p>
        )}

        {/* Team Name */}
        <p className="mt-3 text-slate-500">by {project.team?.name || "Solo submission"}</p>

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

          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={handleShare}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Share"}
          </Button>
        </div>
      </div>
    </div>
  );
}
