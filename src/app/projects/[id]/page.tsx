import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { submissionsService, tracksService, cohortsService, tractionService } from "@/services";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { ProjectHero } from "@/components/projects/project-hero";
import { ProjectGallery } from "@/components/projects/project-gallery";
import { ProjectTeam } from "@/components/projects/project-team";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectWinnerBanner } from "@/components/projects/project-winner-banner";
import { ProjectTractionStats, ProjectTractionChart } from "@/components/projects/project-traction";
import { ProjectMilestones } from "@/components/projects/project-milestones";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Shield, FileCheck } from "lucide-react";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: submission } = await submissionsService.getById(id);

  if (!submission || submission.status === "draft") {
    return { title: "Project Not Found - SWA.XYZ" };
  }

  const description = submission.tagline || submission.description?.slice(0, 160) || "";
  const image = submission.screenshots?.[0] || submission.logoUrl;

  return {
    title: `${submission.title} - SWA.XYZ`,
    description,
    openGraph: {
      title: submission.title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: submission.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const { data: submission } = await submissionsService.getById(id);

  // Return 404 if not found or if status is draft
  if (!submission || submission.status === "draft") {
    notFound();
  }

  // Fetch related data in parallel
  const [
    tracksResponse,
    cohortResponse,
    cohortSubmissionsResponse,
    snapshotsResponse,
    latestSnapshotResponse,
    milestonesResponse,
  ] = await Promise.all([
    submission.cohortId ? tracksService.getByCohort(submission.cohortId) : Promise.resolve({ data: [] }),
    submission.cohortId ? cohortsService.getById(submission.cohortId) : Promise.resolve({ data: null }),
    submissionsService.getByCohort(submission.cohortId),
    tractionService.getSnapshots(id),
    tractionService.getLatestSnapshot(id),
    tractionService.getMilestones(id),
  ]);

  // Get tracks for this submission
  const tracks = tracksResponse.data;
  const projectTracks = submission.tracks?.length
    ? submission.tracks
    : submission.trackIds?.length
      ? tracks.filter((t) => submission.trackIds!.includes(t.id))
      : submission.trackId
        ? tracks.filter((t) => t.id === submission.trackId)
        : [];

  // Get cohort info for breadcrumb
  const cohort = cohortResponse.data;

  // Get related projects from same cohort (excluding current and drafts)
  const cohortSubmissions = cohortSubmissionsResponse.data;
  const relatedProjects = cohortSubmissions
    .filter((s) => s.id !== submission.id && s.status !== "draft")
    .slice(0, 3);

  // Traction data
  const snapshots = snapshotsResponse.data ?? [];
  const latestSnapshot = latestSnapshotResponse.data ?? null;
  const milestones = milestonesResponse.data ?? [];

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
          trackName={projectTracks.map((t) => t.name).join(", ") || undefined}
          cohortName={cohort?.name}
        />
      </div>

      {/* Winner Banner */}
      {submission.status === "winner" && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <ProjectWinnerBanner project={submission} trackName={projectTracks.map((t) => t.name).join(", ") || undefined} />
        </div>
      )}

      {/* Traction Stats Strip */}
      {latestSnapshot && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <ProjectTractionStats latestSnapshot={latestSnapshot} />
        </div>
      )}

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

            {/* Traction Chart */}
            {snapshots.length >= 2 && (
              <ProjectTractionChart snapshots={snapshots} />
            )}

            {/* About */}
            <section className="rounded-xl border p-5 space-y-4">
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                About
              </h3>
              <RichTextDisplay content={submission.description} className="text-sm text-muted-foreground" />
              {submission.builtWithStory && (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Built with Story Protocol
                </div>
              )}
            </section>

            {/* Tech Stack */}
            {submission.techStack.length > 0 && (
              <section className="rounded-xl border p-5 space-y-4">
                <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {submission.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Tracks */}
            {projectTracks.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  {projectTracks.length === 1 ? "Track" : "Tracks"}
                </h3>
                {projectTracks.map((track) => (
                  <div key={track.id} className="rounded-xl border p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold">{track.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {track.description}
                      </p>
                    </div>
                    {track.sponsorName && (
                      <div className="flex items-center gap-2 pt-3 border-t">
                        {track.sponsorLogo && (
                          <Image
                            unoptimized
                            src={track.sponsorLogo}
                            alt={track.sponsorName}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                        )}
                        <span className="text-xs text-muted-foreground">
                          Sponsored by {track.sponsorName}
                        </span>
                      </div>
                    )}
                    {track.prizePool && (
                      <span className="inline-block px-2.5 py-1 text-xs rounded-md border text-muted-foreground">
                        {track.prizePool} Prize Pool
                      </span>
                    )}
                    {submission.trackDescriptions?.[track.id] && (
                      <div className="pt-3 border-t">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Integration</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.trackDescriptions[track.id]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Team */}
            {submission.team ? (
              <ProjectTeam team={submission.team} />
            ) : (
              <section className="rounded-xl border p-5">
                <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Submitted by
                </h3>
                <p className="text-sm text-muted-foreground mt-3">Solo submission</p>
              </section>
            )}

            {/* Milestones */}
            {milestones.length > 0 && (
              <ProjectMilestones milestones={milestones} />
            )}

            {/* IP Registration */}
            {submission.ipAssetId && (
              <section className="rounded-xl border p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                    IP Registration
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600">Registered on Story Protocol</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Asset ID</p>
                    <p className="font-mono text-xs break-all mt-0.5">
                      {submission.ipAssetId}
                    </p>
                  </div>

                  {submission.ipLicenseType && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">License Type</p>
                      <p className="text-xs mt-0.5">
                        {getLicenseLabel(submission.ipLicenseType)}
                      </p>
                    </div>
                  )}

                  {submission.ipRegisteredAt && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Registration Date</p>
                      <p className="text-xs mt-0.5">
                        {formatDate(submission.ipRegisteredAt)}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Cohort */}
            {submission.cohort && (
              <section className="rounded-xl border p-5 space-y-3">
                <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  Cohort
                </h3>
                <Link
                  href={`/cohorts/${submission.cohort.slug}`}
                  className="group block"
                >
                  <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {submission.cohort.name}
                  </h4>
                  {submission.cohort.tagline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {submission.cohort.tagline}
                    </p>
                  )}
                </Link>
              </section>
            )}
          </div>
        </div>

        {/* Related Projects Section */}
        {relatedProjects.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-6">
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
