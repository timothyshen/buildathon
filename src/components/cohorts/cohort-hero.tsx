import { Cohort } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";

interface CohortHeroProps {
  cohort: Cohort;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

function getStatusBadgeClasses(status: Cohort["status"]): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "upcoming":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "judging":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "completed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function CohortHero({ cohort }: CohortHeroProps) {
  const dateRange = formatDateRange(cohort.startDate, cohort.endDate);
  const submissionDeadline = formatDate(cohort.submissionDeadline);

  return (
    <div className="relative">
      {/* Hero Background */}
      <div
        className="h-64 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        style={
          cohort.bannerImage
            ? {
                backgroundImage: `url(${cohort.bannerImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 h-64 bg-black/30" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 h-64 flex flex-col justify-center px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Status Badge */}
          <Badge className={`mb-4 ${getStatusBadgeClasses(cohort.status)}`}>
            {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
          </Badge>

          {/* Name */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            {cohort.name}
          </h1>

          {/* Tagline */}
          {cohort.tagline && (
            <p className="text-lg md:text-xl text-white/90 mb-6">
              {cohort.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {/* Date Range */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{dateRange}</span>
            </div>

            {/* Submission Deadline */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Submissions due {submissionDeadline}</span>
            </div>

            {/* Max Team Size */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Max {cohort.maxTeamSize} members per team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
