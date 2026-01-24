import Link from "next/link";
import { Cohort } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy } from "lucide-react";
import { getTracksByCohort } from "@/data/mock-data";

interface CohortCardProps {
  cohort: Cohort;
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

function calculateTotalPrizePool(cohort: Cohort): string {
  if (!cohort.prizes || cohort.prizes.length === 0) {
    return "$0";
  }

  const total = cohort.prizes.reduce((sum, prize) => {
    // Extract numeric value from amount string (e.g., "$10,000" -> 10000)
    const numericValue = parseInt(prize.amount.replace(/[^0-9]/g, ""), 10);
    return sum + (isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  return `$${total.toLocaleString()}`;
}

export function CohortCard({ cohort }: CohortCardProps) {
  const tracks = getTracksByCohort(cohort.id);
  const totalPrizePool = calculateTotalPrizePool(cohort);
  const dateRange = formatDateRange(cohort.startDate, cohort.endDate);

  return (
    <Link href={`/cohorts/${cohort.slug}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        {/* Banner Section */}
        <div
          className="h-32 w-full bg-gradient-to-r from-indigo-500 to-purple-600"
          style={
            cohort.bannerImage
              ? {
                  backgroundImage: `url(${cohort.bannerImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{cohort.name}</CardTitle>
            <Badge className={getStatusBadgeClasses(cohort.status)}>
              {cohort.status}
            </Badge>
          </div>
          {cohort.tagline && (
            <CardDescription>{cohort.tagline}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{dateRange}</span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Track Count */}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </span>
            </div>

            {/* Prize Pool */}
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>{totalPrizePool}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
