import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cohortsService, tracksService, sponsorsService, submissionsService } from "@/services";
import { CohortHero } from "@/components/cohorts/cohort-hero";
import { CohortTimeline } from "@/components/cohorts/cohort-timeline";
import { CohortTracks } from "@/components/cohorts/cohort-tracks";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ExternalLink } from "lucide-react";
import type { SponsorOrg, SponsorTier } from "@/types";

// Type for sponsor with cohort-specific data
type CohortSponsor = SponsorOrg & {
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
};

interface CohortDetailPageProps {
  params: Promise<{ slug: string }>;
}

const tierOrder: SponsorTier[] = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "community",
];

const tierLabels: Record<SponsorTier, string> = {
  platinum: "Platinum Sponsors",
  gold: "Gold Sponsors",
  silver: "Silver Sponsors",
  bronze: "Bronze Sponsors",
  community: "Community Partners",
};

function groupSponsorsByTier(
  sponsors: CohortSponsor[]
): Record<SponsorTier, CohortSponsor[]> {
  const grouped: Record<SponsorTier, CohortSponsor[]> = {
    platinum: [],
    gold: [],
    silver: [],
    bronze: [],
    community: [],
  };

  sponsors.forEach((sponsor) => {
    grouped[sponsor.tier].push(sponsor);
  });

  return grouped;
}

export default async function CohortDetailPage({
  params,
}: CohortDetailPageProps) {
  const { slug } = await params;

  const { data: cohort } = await cohortsService.getBySlug(slug);

  if (!cohort) {
    notFound();
  }

  const [tracksResponse, sponsorsResponse, submissionsResponse] = await Promise.all([
    tracksService.getByCohort(cohort.id),
    sponsorsService.getCohortSponsors(cohort.id),
    submissionsService.getByCohort(cohort.id),
  ]);

  const tracks = tracksResponse.data;
  const sponsors = sponsorsResponse.data;
  const submissions = submissionsResponse.data;

  // Filter out draft submissions for public display
  const publishedSubmissions = submissions.filter((s) => s.status !== "draft");

  // Group sponsors by tier
  const sponsorsByTier = groupSponsorsByTier(sponsors);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumb
          items={[
            { label: "Cohorts", href: "/cohorts" },
            { label: cohort.name },
          ]}
        />
      </div>

      {/* Hero Section */}
      <div className="px-4">
        <CohortHero
          cohort={cohort}
          tracks={tracks}
          sponsors={sponsors}
          submissions={publishedSubmissions}
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Submit Button for Active Cohorts */}
        {cohort.status === "active" && (
          <div className="flex justify-end mb-6">
            <Link href="/submit">
              <Button size="lg">Submit Your Project</Button>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {cohort.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Prizes Card */}
                {cohort.prizes && cohort.prizes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Prizes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {cohort.prizes.map((prize, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between border-b last:border-0 pb-4 last:pb-0"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className="font-semibold"
                              >
                                {prize.place}
                              </Badge>
                              {prize.description && (
                                <span className="text-sm text-muted-foreground">
                                  {prize.description}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-lg">
                              {prize.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - 1 column */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <CohortTimeline cohort={cohort} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks">
            <CohortTracks tracks={tracks} sponsors={sponsors} />
          </TabsContent>

          {/* Sponsors Tab */}
          <TabsContent value="sponsors">
            <div className="py-6 space-y-10">
              {sponsors.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No sponsors have been announced yet.
                  </p>
                </div>
              ) : (
                tierOrder.map((tier) => {
                  const tierSponsors = sponsorsByTier[tier];
                  if (tierSponsors.length === 0) return null;

                  return (
                    <div key={tier}>
                      <h2 className="text-xl font-semibold mb-6">
                        {tierLabels[tier]}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {tierSponsors.map((sponsor) => (
                          <Card
                            key={sponsor.id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-6 flex flex-col items-center text-center">
                              {/* Sponsor Logo */}
                              <div className="w-20 h-20 mb-4 relative">
                                <Image
                                  src={sponsor.logo}
                                  alt={sponsor.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>

                              {/* Sponsor Name */}
                              <h3 className="font-semibold mb-2">
                                {sponsor.name}
                              </h3>

                              {/* Website Link */}
                              <a
                                href={sponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Visit Website
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="py-6">
              {publishedSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No projects have been submitted yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedSubmissions.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="overflow-hidden transition-shadow hover:shadow-md h-full">
                        {/* Screenshot background section */}
                        <div
                          className="h-40 bg-muted bg-cover bg-center"
                          style={
                            project.screenshots?.[0]
                              ? {
                                  backgroundImage: `url(${project.screenshots[0]})`,
                                }
                              : undefined
                          }
                        />

                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {project.title}
                            </CardTitle>
                            {project.status === "winner" && (
                              <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
                                Winner
                              </Badge>
                            )}
                          </div>
                          {project.tagline && (
                            <p className="text-sm text-muted-foreground">
                              {project.tagline}
                            </p>
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
                              {project.techStack.slice(0, 4).map((tech) => (
                                <Badge key={tech} variant="secondary">
                                  {tech}
                                </Badge>
                              ))}
                              {project.techStack.length > 4 && (
                                <Badge variant="outline">
                                  +{project.techStack.length - 4}
                                </Badge>
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
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
