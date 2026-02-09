import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { submissionsService, tracksService, cohortsService } from "@/services";
import { ProjectHero } from "@/components/projects/project-hero";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { ProjectCard } from "@/components/projects/project-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Project Details - SWA.XYZ",
  description: "View project details, team info, and submission information on SWA.XYZ.",
};

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const { data: submission } = await submissionsService.getById(id);

  // Return 404 if not found or if status is draft
  if (!submission || submission.status === "draft") {
    notFound();
  }

  // Fetch related data in parallel
  const [tracksResponse, cohortResponse, cohortSubmissionsResponse] = await Promise.all([
    submission.cohortId ? tracksService.getByCohort(submission.cohortId) : Promise.resolve({ data: [] }),
    submission.cohortId ? cohortsService.getById(submission.cohortId) : Promise.resolve({ data: null }),
    submissionsService.getByCohort(submission.cohortId),
  ]);

  // Get the track info if projectTrack exists
  const tracks = tracksResponse.data;
  const projectTrack = tracks.find((t) => t.id === submission.trackId);

  // Get cohort info for breadcrumb
  const cohort = cohortResponse.data;

  // Get related projects from same cohort (excluding current and drafts)
  const cohortSubmissions = cohortSubmissionsResponse.data;
  const relatedProjects = cohortSubmissions
    .filter((s) => s.id !== submission.id && s.status !== "draft")
    .slice(0, 3);

  // Format date for IP registration
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get license type label
  const getLicenseLabel = (licenseType: string) => {
    switch (licenseType) {
      case "non-commercial":
        return "Non-Commercial";
      case "commercial-use":
        return "Commercial Use";
      case "commercial-remix":
        return "Commercial Remix";
      default:
        return licenseType;
    }
  };

  // Build breadcrumb items
  const breadcrumbItems = cohort
    ? [
        { label: "Cohorts", href: "/cohorts" },
        { label: cohort.name, href: `/cohorts/${cohort.slug}` },
        { label: submission.title },
      ]
    : [
        { label: "Explore", href: "/explore" },
        { label: submission.title },
      ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        <ProjectHero
          project={submission}
          trackName={projectTrack?.name}
          cohortName={cohort?.name}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <ProjectGallery
              screenshots={submission.screenshots}
              videoUrl={submission.videoUrl}
            />

            {/* About Card */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {submission.description}
                </p>
                {submission.builtWithStory && (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Shield className="h-3 w-3 mr-1" />
                    Built with Story Protocol
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Tech Stack Card */}
            {submission.techStack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {submission.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Track Card */}
            {projectTrack && (
              <Card>
                <CardHeader>
                  <CardTitle>Track</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold">{projectTrack.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {projectTrack.description}
                    </p>
                  </div>
                  {projectTrack.sponsorName && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {projectTrack.sponsorLogo && (
                        <Image
                          unoptimized
                          src={projectTrack.sponsorLogo}
                          alt={projectTrack.sponsorName}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        Sponsored by {projectTrack.sponsorName}
                      </span>
                    </div>
                  )}
                  {projectTrack.prizePool && (
                    <Badge variant="outline">{projectTrack.prizePool} Prize Pool</Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Team Card or Solo Badge */}
            {submission.team ? (
              <ProjectTeam team={submission.team} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submitted by</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Solo submission</Badge>
                </CardContent>
              </Card>
            )}

            {/* IP Registration Card */}
            {submission.ipAssetId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-success-foreground" />
                    IP Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className="bg-success text-success-foreground hover:bg-success/90">
                    Registered on Story Protocol
                  </Badge>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Asset ID</p>
                      <p className="font-mono text-sm break-all">
                        {submission.ipAssetId}
                      </p>
                    </div>

                    {submission.ipLicenseType && (
                      <div>
                        <p className="text-xs text-muted-foreground">License Type</p>
                        <p className="text-sm">
                          {getLicenseLabel(submission.ipLicenseType)}
                        </p>
                      </div>
                    )}

                    {submission.ipRegisteredAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Registration Date
                        </p>
                        <p className="text-sm">
                          {formatDate(submission.ipRegisteredAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cohort Card */}
            {submission.cohort && (
              <Card>
                <CardHeader>
                  <CardTitle>Cohort</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/cohorts/${submission.cohort.slug}`}
                    className="group block"
                  >
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {submission.cohort.name}
                    </h4>
                    {submission.cohort.tagline && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {submission.cohort.tagline}
                      </p>
                    )}
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Projects Section */}
        {relatedProjects.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">
              More from {submission.cohort?.name || "this cohort"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
