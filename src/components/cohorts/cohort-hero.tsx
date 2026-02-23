import { Cohort, Sponsor, Track, Submission } from "@/types";
import { computeCohortStatus } from "@/lib/cohort-utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy } from "lucide-react";

interface CohortHeroProps {
  cohort: Cohort;
  tracks?: Track[];
  sponsors?: Sponsor[];
  submissions?: Submission[];
}

function getCountdown(deadline: Date) {
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

function getStatusBadge(status: Cohort["status"], countdown: { days: number; hours: number } | null) {
  switch (status) {
    case "active":
      return (
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Now
          </Badge>
          {countdown && (
            <Badge variant="outline" className="text-slate-300 border-slate-700">
              <Clock className="h-3 w-3 mr-1" />
              {countdown.days}d {countdown.hours}h left
            </Badge>
          )}
        </div>
      );
    case "upcoming":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          Coming Soon
        </Badge>
      );
    case "judging":
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          Judging
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
          <Trophy className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return null;
  }
}

export function CohortHero({ cohort, tracks = [], sponsors = [], submissions = [] }: CohortHeroProps) {
  const status = computeCohortStatus(cohort);
  const countdown = getCountdown(cohort.submissionDeadline);
  const totalPrize = cohort.prizes?.reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, "") || "0"), 0) || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 mx-auto max-w-6xl mt-4">
      {/* Background: banner image or subtle pattern overlay */}
      {cohort.bannerImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cohort.bannerImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/70" />
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}

      <div className="relative p-8 lg:p-12">
        {/* Status Badge */}
        <div className="mb-4">
          {getStatusBadge(status, countdown)}
        </div>

        {/* Name */}
        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
          {cohort.name}
        </h1>

        {/* Tagline */}
        {cohort.tagline && (
          <p className="mt-4 text-xl text-slate-400">{cohort.tagline}</p>
        )}

        {/* Stats */}
        <div className="mt-8 flex gap-8">
          <div>
            <div className="text-4xl font-bold text-white">{tracks.length}</div>
            <div className="text-slate-500">Tracks</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white">{submissions.length}</div>
            <div className="text-slate-500">Builders</div>
          </div>
          {totalPrize > 0 && (
            <div>
              <div className="text-4xl font-bold text-white">${(totalPrize / 1000).toFixed(0)}k</div>
              <div className="text-slate-500">In Prizes</div>
            </div>
          )}
        </div>

        {/* Sponsors */}
        {sponsors.length > 0 && (
          <div className="mt-8">
            <div className="text-sm text-slate-500 mb-3">Presented by</div>
            <div className="flex items-center gap-4">
              {sponsors.slice(0, 4).map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="h-12 w-12 rounded-xl bg-slate-800 p-2 flex items-center justify-center"
                >
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">
                      {sponsor.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {sponsors.length > 4 && (
                <div className="text-sm text-slate-500">+{sponsors.length - 4} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
