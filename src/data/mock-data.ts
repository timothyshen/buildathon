import type { User, Cohort, Track, Team, TeamInvite, Submission, Review, Workshop, Template, SponsorOrg, CohortSponsor, Sponsor, MediaAsset, WorkshopVersion, WorkshopRSVP } from "@/types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "admin@story.foundation",
    name: "Alex Admin",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    hasCompletedOnboarding: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    email: "judge@example.com",
    name: "Jordan Judge",
    role: "judge",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=judge",
    bio: "Web3 investor and advisor",
    twitter: "jordanjudge",
    hasCompletedOnboarding: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "user-3",
    email: "builder@example.com",
    name: "Blake Builder",
    role: "participant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=builder",
    walletAddress: "0x1234...5678",
    github: "blakebuilder",
    hasCompletedOnboarding: true,
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "user-4",
    email: "sam@example.com",
    name: "Sam Smith",
    role: "participant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    hasCompletedOnboarding: true,
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "user-5",
    email: "sponsor@gamefi.com",
    name: "Sarah Sponsor",
    role: "sponsor",
    sponsorOrgId: "sponsor-org-1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sponsor",
    hasCompletedOnboarding: true,
    createdAt: new Date("2024-02-01"),
  },
];

// Mock Cohorts
export const mockCohorts: Cohort[] = [
  {
    id: "cohort-1",
    slug: "swa-spring-2024",
    name: "SWA Spring 2024",
    description: "The inaugural Surreal World Assets buildathon. Build the future of programmable IP on Story Protocol.",
    tagline: "Build. Register. Fork.",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-03-31"),
    submissionDeadline: new Date("2024-03-28"),
    judgingStart: new Date("2024-03-29"),
    judgingEnd: new Date("2024-04-05"),
    status: "completed",
    isPublic: true,
    maxTeamSize: 5,
    minReviewsPerSubmission: 3,
    prizes: [
      { place: "1st", amount: "$10,000", description: "Grand Prize" },
      { place: "2nd", amount: "$5,000" },
      { place: "3rd", amount: "$2,500" },
    ],
  },
  {
    id: "cohort-2",
    slug: "swa-summer-2024",
    name: "SWA Summer 2024",
    description: "Summer edition of the SWA buildathon. Focus on AI x IP applications.",
    tagline: "AI meets IP",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-30"),
    submissionDeadline: new Date("2024-06-27"),
    judgingStart: new Date("2024-06-28"),
    judgingEnd: new Date("2024-07-05"),
    status: "active",
    isPublic: true,
    maxTeamSize: 5,
    minReviewsPerSubmission: 3,
    prizes: [
      { place: "1st", amount: "$15,000" },
      { place: "2nd", amount: "$7,500" },
      { place: "3rd", amount: "$3,500" },
    ],
  },
  {
    id: "cohort-3",
    slug: "swa-fall-2024",
    name: "SWA Fall 2024",
    description: "Coming soon - Fall 2024 buildathon.",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2024-09-30"),
    submissionDeadline: new Date("2024-09-27"),
    judgingStart: new Date("2024-09-28"),
    judgingEnd: new Date("2024-10-05"),
    status: "upcoming",
    isPublic: false,
    maxTeamSize: 5,
    minReviewsPerSubmission: 3,
  },
];

// Mock Tracks
export const mockTracks: Track[] = [
  {
    id: "track-1",
    cohortId: "cohort-2",
    name: "AI Agents",
    description: "Build AI agents that create, manage, or interact with IP assets",
    prizePool: "$5,000",
    requirements: ["Must use Story Protocol SDK", "AI component required"],
  },
  {
    id: "track-2",
    cohortId: "cohort-2",
    name: "Creator Tools",
    description: "Tools that help creators register and monetize their IP",
    prizePool: "$5,000",
    requirements: ["Must include IP registration flow"],
  },
  {
    id: "track-3",
    cohortId: "cohort-2",
    name: "Gaming",
    description: "Games or gaming infrastructure using programmable IP",
    prizePool: "$5,000",
    sponsorName: "GameFi Labs",
  },
  {
    id: "track-4",
    cohortId: "cohort-1",
    name: "Open Track",
    description: "Build anything on Story Protocol",
    prizePool: "$10,000",
  },
];

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: "team-1",
    cohortId: "cohort-2",
    name: "IP Wizards",
    slug: "ip-wizards",
    description: "Building the future of IP management",
    members: [
      { userId: "user-3", user: mockUsers[2], role: "lead", joinedAt: new Date("2024-06-01") },
      { userId: "user-4", user: mockUsers[3], role: "member", joinedAt: new Date("2024-06-02") },
    ],
  },
  {
    id: "team-2",
    cohortId: "cohort-1",
    name: "Story Builders",
    slug: "story-builders",
    members: [
      { userId: "user-3", user: mockUsers[2], role: "lead", joinedAt: new Date("2024-03-01") },
    ],
  },
];

// Mock Team Invites
export const mockTeamInvites: TeamInvite[] = [
  {
    id: "invite-1",
    teamId: "team-1",
    team: mockTeams[0],
    email: "newuser@example.com",
    invitedBy: "user-3",
    inviter: mockUsers[2],
    status: "pending",
    createdAt: new Date("2024-06-15"),
    expiresAt: new Date("2024-06-22"),
  },
];

// Mock Submissions
export const mockSubmissions: Submission[] = [
  {
    id: "sub-1",
    cohortId: "cohort-1",
    cohort: mockCohorts[0],
    teamId: "team-2",
    team: mockTeams[1],
    createdBy: "user-3",
    trackId: "track-4",
    title: "IPify",
    tagline: "One-click IP registration for creators",
    description: "IPify makes it easy for any creator to register their work as IP on Story Protocol. Upload your content, set your licensing terms, and you're done.",
    demoUrl: "https://ipify.demo.com",
    videoUrl: "https://youtube.com/watch?v=demo",
    repoUrl: "https://github.com/example/ipify",
    screenshots: ["/screenshots/ipify-1.png", "/screenshots/ipify-2.png"],
    techStack: ["Next.js", "Story Protocol SDK", "IPFS"],
    builtWithStory: true,
    ipAssetId: "0xip123",
    ipRegisteredAt: new Date("2024-03-28"),
    ipLicenseType: "commercial-remix",
    status: "winner",
    submittedAt: new Date("2024-03-27"),
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-27"),
  },
  {
    id: "sub-2",
    cohortId: "cohort-2",
    cohort: mockCohorts[1],
    teamId: "team-1",
    team: mockTeams[0],
    createdBy: "user-3",
    trackId: "track-1",
    track: mockTracks[0],
    title: "AI Story Agent",
    tagline: "AI that writes and registers stories as IP",
    description: "An AI agent that helps you write stories and automatically registers them as IP assets with proper attribution and licensing.",
    demoUrl: "https://ai-story.demo.com",
    repoUrl: "https://github.com/example/ai-story",
    screenshots: [],
    techStack: ["Python", "OpenAI", "Story Protocol SDK"],
    builtWithStory: true,
    status: "submitted",
    submittedAt: new Date("2024-06-25"),
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-06-25"),
  },
  {
    id: "sub-3",
    cohortId: "cohort-2",
    cohort: mockCohorts[1],
    teamId: "team-1",
    team: mockTeams[0],
    createdBy: "user-3",
    trackId: "track-2",
    title: "IP Dashboard",
    tagline: "Manage all your IP in one place",
    description: "A comprehensive dashboard to track, manage, and monetize all your registered IP assets.",
    screenshots: [],
    techStack: ["React", "Story Protocol SDK"],
    builtWithStory: true,
    status: "draft",
    createdAt: new Date("2024-06-20"),
    updatedAt: new Date("2024-06-20"),
  },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: "review-1",
    submissionId: "sub-1",
    submission: mockSubmissions[0],
    judgeId: "user-2",
    judge: mockUsers[1],
    innovationScore: 9,
    executionScore: 8,
    designScore: 9,
    impactScore: 8,
    presentationScore: 9,
    overallScore: 8.6,
    feedback: "Excellent project with clear utility. The UX is polished and the Story Protocol integration is seamless.",
    status: "completed",
    completedAt: new Date("2024-04-01"),
    createdAt: new Date("2024-03-29"),
  },
  {
    id: "review-2",
    submissionId: "sub-2",
    submission: mockSubmissions[1],
    judgeId: "user-2",
    judge: mockUsers[1],
    status: "pending",
    createdAt: new Date("2024-06-28"),
  },
];

// Mock Workshops
export const mockWorkshops: Workshop[] = [
  {
    id: "workshop-1",
    title: "Getting Started with Story Protocol",
    description: "Learn the basics of Story Protocol and how to register your first IP asset.",
    content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Welcome to Story Protocol!" }] }] }),
    videoUrl: "https://youtube.com/watch?v=intro",
    partnerName: "Story Foundation",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=storyfoundation",
    sponsorOrgId: "sponsor-org-3",
    category: "Basics",
    duration: "30 min",
    status: "published",
    isEvergreen: true, // Global - shows in learning library
    createdBy: "user-1",
    publishedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
    scheduledAt: new Date("2026-01-27T10:00:00"),
    endTime: new Date("2026-01-27T10:30:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    maxAttendees: 100,
    meetingUrl: "https://meet.story.foundation/workshop-1",
  },
  {
    id: "workshop-2",
    title: "Building AI Agents on Story",
    description: "Deep dive into creating AI agents that interact with IP assets.",
    videoUrl: "https://youtube.com/watch?v=ai-agents",
    articleUrl: "https://docs.story.foundation/ai-agents",
    partnerName: "AI Labs",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=ailabs",
    sponsorOrgId: "sponsor-org-2",
    category: "Advanced",
    duration: "45 min",
    status: "published",
    isEvergreen: false,
    cohortIds: ["cohort-2"], // Cohort-specific for Summer 2024
    createdBy: "user-5",
    publishedAt: new Date("2024-02-20"),
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-20"),
    scheduledAt: new Date("2026-01-28T14:00:00"),
    endTime: new Date("2026-01-28T14:45:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    maxAttendees: 50,
    meetingUrl: "https://meet.story.foundation/workshop-2",
  },
  {
    id: "workshop-3",
    title: "IP Licensing 101",
    description: "Understanding programmable licenses and royalty policies.",
    articleUrl: "https://docs.story.foundation/licensing",
    partnerName: "Story Foundation",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=storyfoundation",
    sponsorOrgId: "sponsor-org-3",
    category: "Basics",
    duration: "20 min",
    status: "published",
    isEvergreen: true, // Global
    createdBy: "user-1",
    publishedAt: new Date("2024-03-01"),
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-03-01"),
    scheduledAt: new Date("2026-01-30T16:00:00"),
    endTime: new Date("2026-01-30T16:20:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
  },
  {
    id: "workshop-4",
    title: "From Hackathon to Production",
    description: "How to take your buildathon project and turn it into a real product.",
    videoUrl: "https://youtube.com/watch?v=production",
    partnerName: "Builder Academy",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=builderacademy",
    category: "Business",
    duration: "60 min",
    status: "published",
    isEvergreen: true, // Global
    createdBy: "user-1",
    publishedAt: new Date("2024-04-05"),
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-04-10"),
    scheduledAt: new Date("2026-02-03T11:00:00"),
    endTime: new Date("2026-02-03T12:00:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    maxAttendees: 200,
    meetingUrl: "https://meet.story.foundation/workshop-4",
  },
  {
    id: "workshop-5",
    title: "Smart Contract Security for IP",
    description: "Learn best practices for securing your IP smart contracts and avoiding common vulnerabilities.",
    videoUrl: "https://youtube.com/watch?v=security",
    partnerName: "Security Guild",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=securityguild",
    category: "Advanced",
    duration: "45 min",
    status: "published",
    isEvergreen: true, // Global
    createdBy: "user-1",
    publishedAt: new Date("2024-04-15"),
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-15"),
    scheduledAt: new Date("2026-02-05T15:00:00"),
    endTime: new Date("2026-02-05T15:45:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    meetingUrl: "https://meet.story.foundation/workshop-5",
  },
  {
    id: "workshop-6",
    title: "Tokenizing Creative Works",
    description: "A comprehensive guide to tokenizing art, music, and other creative works as IP assets.",
    articleUrl: "https://docs.story.foundation/tokenizing",
    partnerName: "Creative DAO",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=creativedao",
    category: "Creator Tools",
    duration: "35 min",
    status: "published",
    isEvergreen: true, // Global
    createdBy: "user-1",
    publishedAt: new Date("2024-05-01"),
    createdAt: new Date("2024-04-25"),
    updatedAt: new Date("2024-05-01"),
    scheduledAt: new Date("2026-02-10T13:00:00"),
    endTime: new Date("2026-02-10T13:35:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    maxAttendees: 75,
  },
  {
    id: "workshop-7",
    title: "GameFi IP Integration Workshop",
    description: "Learn how to integrate Story Protocol IP into your gaming projects.",
    videoUrl: "https://youtube.com/watch?v=gamefi-ip",
    partnerName: "GameFi Labs",
    partnerLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=gamefi",
    sponsorOrgId: "sponsor-org-1",
    category: "Advanced",
    duration: "50 min",
    status: "published",
    isEvergreen: false,
    cohortIds: ["cohort-1", "cohort-2"], // Reused across multiple cohorts
    createdBy: "user-5",
    publishedAt: new Date("2024-03-10"),
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-10"),
    scheduledAt: new Date("2026-02-12T14:00:00"),
    endTime: new Date("2026-02-12T14:50:00"),
    timezone: "America/Los_Angeles",
    isLive: true,
    location: "Online",
    maxAttendees: 60,
    meetingUrl: "https://meet.story.foundation/workshop-7",
  },
];

// Mock Templates (from winning submissions)
export const mockTemplates: Template[] = [
  {
    id: "template-1",
    submissionId: "sub-1",
    submission: mockSubmissions[0],
    title: "IPify Template",
    description: "A starter template for building IP registration apps",
    category: "Creator Tools",
    tags: ["registration", "creators", "nextjs"],
    ipAssetId: "0xip123",
    forkCount: 12,
    isFeatured: true,
    createdAt: new Date("2024-04-10"),
  },
];

// Helper function to get user by email (for mock login)
export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Helper function to get submissions by user
export function getSubmissionsByUser(userId: string): Submission[] {
  return mockSubmissions.filter(s =>
    s.team?.members.some(m => m.userId === userId)
  );
}

// Helper function to get reviews by judge
export function getReviewsByJudge(judgeId: string): Review[] {
  return mockReviews.filter(r => r.judgeId === judgeId);
}

// Helper function to get tracks by cohort
export function getTracksByCohort(cohortId: string): Track[] {
  return mockTracks.filter(t => t.cohortId === cohortId);
}

// Mock Sponsor Organizations (persistent across cohorts)
export const mockSponsorOrgs: SponsorOrg[] = [
  {
    id: "sponsor-org-1",
    name: "GameFi Labs",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=gamefi",
    website: "https://gamefi.example.com",
    description: "Leading gaming infrastructure provider for Web3",
    contactName: "Sarah Sponsor",
    contactEmail: "sponsor@gamefi.com",
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "sponsor-org-2",
    name: "AI Labs",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=ailabs",
    website: "https://ailabs.example.com",
    description: "Pioneering AI research and applications",
    contactName: "Alex AI",
    contactEmail: "alex@ailabs.example.com",
    createdAt: new Date("2024-05-10"),
    updatedAt: new Date("2024-05-10"),
  },
  {
    id: "sponsor-org-3",
    name: "Story Foundation",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=storyfoundation",
    website: "https://story.foundation",
    description: "Building the future of programmable IP",
    contactName: "Story Team",
    contactEmail: "hello@story.foundation",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock Cohort Sponsors (junction: sponsor participation per cohort)
export const mockCohortSponsors: CohortSponsor[] = [
  {
    id: "cs-1",
    cohortId: "cohort-2",
    sponsorOrgId: "sponsor-org-1",
    tier: "gold",
    prizePoolContribution: 5000,
    prizePoolLimit: 0,
    hasDedicatedTrack: true,
    description: "<p>GameFi Labs is excited to sponsor the Summer Buildathon 2024! We're looking for innovative projects that push the boundaries of gaming and blockchain technology.</p><h2>What We're Looking For</h2><ul><li>Creative use of NFTs in gaming</li><li>Novel tokenomics for play-to-earn</li><li>Cross-chain gaming experiences</li></ul><p>Top submissions will be considered for our accelerator program!</p>",
  },
  {
    id: "cs-2",
    cohortId: "cohort-2",
    sponsorOrgId: "sponsor-org-2",
    tier: "platinum",
    prizePoolContribution: 10000,
    prizePoolLimit: 0,
    hasDedicatedTrack: false,
  },
  {
    id: "cs-3",
    cohortId: "cohort-1",
    sponsorOrgId: "sponsor-org-1",
    tier: "silver",
    prizePoolContribution: 2500,
    prizePoolLimit: 0,
    hasDedicatedTrack: false,
  },
  {
    id: "cs-4",
    cohortId: "cohort-1",
    sponsorOrgId: "sponsor-org-3",
    tier: "platinum",
    prizePoolContribution: 15000,
    prizePoolLimit: 0,
    hasDedicatedTrack: false,
  },
  {
    id: "cs-5",
    cohortId: "cohort-2",
    sponsorOrgId: "sponsor-org-3",
    tier: "platinum",
    prizePoolContribution: 20000,
    prizePoolLimit: 0,
    hasDedicatedTrack: false,
  },
];

// Legacy alias for backwards compatibility
export const mockSponsors: Sponsor[] = mockSponsorOrgs;

// Mock Media Assets
export const mockMediaAssets: MediaAsset[] = [
  {
    id: "media-1",
    filename: "workshop-banner.png",
    url: "https://picsum.photos/seed/banner1/800/400",
    mimeType: "image/png",
    size: 245000,
    uploadedBy: "user-1",
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "media-2",
    filename: "sponsor-logo.svg",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=logo",
    mimeType: "image/svg+xml",
    size: 12000,
    uploadedBy: "user-5",
    createdAt: new Date("2024-03-15"),
  },
];

// Mock Workshop Versions
export const mockWorkshopVersions: WorkshopVersion[] = [
  {
    id: "version-1",
    workshopId: "workshop-1",
    content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Initial version" }] }] }),
    title: "Getting Started with Story Protocol",
    authorId: "user-1",
    createdAt: new Date("2024-01-15"),
    changeNote: "Initial publish",
  },
];

// Mock Workshop RSVPs
export const mockWorkshopRSVPs: WorkshopRSVP[] = [
  {
    id: "rsvp-1",
    workshopId: "workshop-1",
    userId: "user-3",
    user: mockUsers[2],
    status: "registered",
    registeredAt: new Date("2026-01-20"),
  },
  {
    id: "rsvp-2",
    workshopId: "workshop-1",
    userId: "user-4",
    user: mockUsers[3],
    status: "registered",
    registeredAt: new Date("2026-01-21"),
  },
  {
    id: "rsvp-3",
    workshopId: "workshop-2",
    userId: "user-3",
    user: mockUsers[2],
    status: "registered",
    registeredAt: new Date("2026-01-22"),
  },
];

// Helper function to get sponsor organizations by cohort (via junction table)
export function getSponsorsByCohort(cohortId: string): (SponsorOrg & { tier: CohortSponsor["tier"]; prizePoolContribution: number; hasDedicatedTrack: boolean })[] {
  const cohortSponsors = mockCohortSponsors.filter(cs => cs.cohortId === cohortId);
  return cohortSponsors.map(cs => {
    const org = mockSponsorOrgs.find(s => s.id === cs.sponsorOrgId);
    if (!org) return null;
    return {
      ...org,
      tier: cs.tier,
      prizePoolContribution: cs.prizePoolContribution,
      hasDedicatedTrack: cs.hasDedicatedTrack,
    };
  }).filter((s): s is NonNullable<typeof s> => s !== null);
}

// Helper function to get workshops by sponsor org
export function getWorkshopsBySponsor(sponsorOrgId: string): Workshop[] {
  return mockWorkshops.filter(w => w.sponsorOrgId === sponsorOrgId);
}

// Helper function to get workshops by cohort (evergreen + cohort-specific)
export function getWorkshopsByCohort(cohortId: string): Workshop[] {
  return mockWorkshops.filter(w =>
    w.isEvergreen || (w.cohortIds && w.cohortIds.includes(cohortId))
  );
}

// Helper function to get sponsor org by user
export function getSponsorByUser(userId: string): SponsorOrg | undefined {
  const user = mockUsers.find(u => u.id === userId);
  if (!user?.sponsorOrgId) return undefined;
  return mockSponsorOrgs.find(s => s.id === user.sponsorOrgId);
}

// Helper function to get sponsor org by ID
export function getSponsorOrgById(id: string): SponsorOrg | undefined {
  return mockSponsorOrgs.find(s => s.id === id);
}

// Helper function to get cohort sponsor relationship
export function getCohortSponsor(cohortId: string, sponsorOrgId: string): CohortSponsor | undefined {
  return mockCohortSponsors.find(cs => cs.cohortId === cohortId && cs.sponsorOrgId === sponsorOrgId);
}

// Helper function to get workshops by date range
export function getWorkshopsByDateRange(start: Date, end: Date): Workshop[] {
  return mockWorkshops.filter(w => {
    if (!w.scheduledAt) return false;
    return w.scheduledAt >= start && w.scheduledAt <= end;
  });
}

// Helper function to get RSVPs by workshop
export function getRSVPsByWorkshop(workshopId: string): WorkshopRSVP[] {
  return mockWorkshopRSVPs.filter(r => r.workshopId === workshopId);
}

// Helper function to get RSVPs by user
export function getRSVPsByUser(userId: string): WorkshopRSVP[] {
  return mockWorkshopRSVPs.filter(r => r.userId === userId);
}

// Helper function to get submissions by cohort
export function getSubmissionsByCohort(cohortId: string): Submission[] {
  return mockSubmissions.filter(s => s.cohortId === cohortId);
}

// Helper function to get cohort by slug
export function getCohortBySlug(slug: string): Cohort | undefined {
  return mockCohorts.find(c => c.slug === slug);
}

// Helper function to get cohort by ID
export function getCohortById(id: string): Cohort | undefined {
  return mockCohorts.find(c => c.id === id);
}

// Helper function to get submission by ID
export function getSubmissionById(id: string): Submission | undefined {
  return mockSubmissions.find(s => s.id === id);
}

// Team helper functions
export function getUserTeams(userId: string): Team[] {
  return mockTeams.filter((t) => t.members.some((m) => m.userId === userId));
}

export function getUserTeamForCohort(userId: string, cohortId: string): Team | undefined {
  return mockTeams.find(
    (t) => t.cohortId === cohortId && t.members.some((m) => m.userId === userId)
  );
}

export function getPendingInvitesForUser(email: string): TeamInvite[] {
  return mockTeamInvites.filter((i) => i.email === email && i.status === "pending");
}

export function getTeamInvites(teamId: string): TeamInvite[] {
  return mockTeamInvites.filter((i) => i.teamId === teamId);
}

export function isTeamLead(userId: string, teamId: string): boolean {
  const team = mockTeams.find((t) => t.id === teamId);
  return team?.members.some((m) => m.userId === userId && m.role === "lead") ?? false;
}
