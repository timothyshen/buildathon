"use client";

import { mockUser, mockSubmissions, mockCohorts } from "../page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Trophy, Calendar } from "lucide-react";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In Review",
  winner: "Winner",
};

const statusDot: Record<string, string> = {
  draft: "bg-muted-foreground",
  submitted: "bg-blue-500",
  under_review: "bg-amber-500",
  winner: "bg-emerald-500",
};

function daysUntil(date: Date) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function V5FocusMode() {
  const drafts = mockSubmissions.filter((s) => s.status === "draft");
  const activeCohorts = mockCohorts.filter((c) => c.status === "active");
  const wins = mockSubmissions.filter((s) => s.status === "winner").length;

  // Determine the most urgent action
  const nearestDeadline = activeCohorts
    .sort((a, b) => new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime())
    [0];
  const deadlineDays = nearestDeadline ? daysUntil(nearestDeadline.submissionDeadline) : null;

  let focusTitle: string;
  let focusDescription: string;
  let focusCta: string;

  if (drafts.length > 0) {
    focusTitle = `Finish "${drafts[0].title}"`;
    focusDescription = `You have ${drafts.length} draft${drafts.length > 1 ? "s" : ""} waiting. Complete your submission before the deadline.`;
    focusCta = "Continue editing";
  } else if (nearestDeadline && deadlineDays !== null && deadlineDays <= 7) {
    focusTitle = `${deadlineDays} days until deadline`;
    focusDescription = `${nearestDeadline.name} submissions close soon. Start a new project or polish existing ones.`;
    focusCta = "Start a project";
  } else {
    focusTitle = "You're all caught up";
    focusDescription = "No urgent deadlines. Browse upcoming buildathons or work on a new idea.";
    focusCta = "Explore buildathons";
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Greeting */}
      <div className="text-center mb-12 mt-4">
        <p className="text-sm text-muted-foreground">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          {mockUser.name.split(" ")[0]}
        </h1>
      </div>

      {/* Focus card */}
      <div className="rounded-2xl border bg-gradient-to-b from-muted/30 to-transparent p-8 text-center mb-12">
        <h2 className="text-xl font-semibold">{focusTitle}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {focusDescription}
        </p>
        <Button className="mt-6 bg-foreground text-background hover:bg-foreground/90">
          {focusCta}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Quick stats inline */}
      <div className="flex items-center justify-center gap-8 mb-10 text-center">
        <div>
          <div className="text-2xl font-mono font-semibold tabular-nums">
            {mockSubmissions.length}
          </div>
          <div className="text-xs text-muted-foreground">Projects</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-2xl font-mono font-semibold tabular-nums text-emerald-600">
            {wins}
          </div>
          <div className="text-xs text-muted-foreground">Wins</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-2xl font-mono font-semibold tabular-nums">
            {activeCohorts.length}
          </div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple" className="w-full">
        {/* Projects */}
        <AccordionItem value="projects">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Projects</span>
              <span className="text-xs text-muted-foreground ml-1">
                {mockSubmissions.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pt-1">
              {mockSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[s.status]}`} />
                    <span className="text-sm truncate">{s.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {statusLabel[s.status]}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Buildathons */}
        <AccordionItem value="cohorts">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Buildathons</span>
              <span className="text-xs text-muted-foreground ml-1">
                {mockCohorts.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pt-1">
              {mockCohorts.map((c) => {
                const days = daysUntil(c.submissionDeadline);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {c.status === "active" && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      )}
                      {c.status === "upcoming" && (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm truncate">{c.name}</span>
                    </div>
                    <span className={`text-xs shrink-0 ml-2 font-mono tabular-nums ${
                      c.status === "active" && days <= 5 ? "text-red-500" : "text-muted-foreground"
                    }`}>
                      {c.status === "active" ? `${days}d left` : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Wins */}
        {wins > 0 && (
          <AccordionItem value="wins">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span>Wins</span>
                <span className="text-xs text-muted-foreground ml-1">{wins}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pt-1">
                {mockSubmissions
                  .filter((s) => s.status === "winner")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm truncate">{s.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {s.cohortName} &middot; {s.trackName}
                      </span>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
