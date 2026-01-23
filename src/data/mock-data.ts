import type { User, Cohort, Track, Team, Submission, Review, Workshop, Template, Sponsor, MediaAsset, WorkshopVersion } from "@/types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "admin@story.foundation",
    name: "Alex Admin",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
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
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "user-4",
    email: "sam@example.com",
    name: "Sam Smith",
    role: "participant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "user-5",
    email: "sponsor@gamefi.com",
    name: "Sarah Sponsor",
    role: "sponsor",
    sponsorId: "sponsor-1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sponsor",
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

// Mock Submissions
export const mockSubmissions: Submission[] = [
  {
    id: "sub-1",
    cohortId: "cohort-1",
    cohort: mockCohorts[0],
    teamId: "team-2",
    team: mockTeams[1],
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
    category: "Basics",
    duration: "30 min",
    status: "published",
    createdBy: "user-1",
    publishedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "workshop-2",
    title: "Building AI Agents on Story",
    description: "Deep dive into creating AI agents that interact with IP assets.",
    videoUrl: "https://youtube.com/watch?v=ai-agents",
    articleUrl: "https://docs.story.foundation/ai-agents",
    partnerName: "AI Labs",
    sponsorId: "sponsor-2",
    category: "Advanced",
    duration: "45 min",
    status: "published",
    createdBy: "user-5",
    publishedAt: new Date("2024-02-20"),
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "workshop-3",
    title: "IP Licensing 101",
    description: "Understanding programmable licenses and royalty policies.",
    articleUrl: "https://docs.story.foundation/licensing",
    partnerName: "Story Foundation",
    category: "Basics",
    duration: "20 min",
    status: "published",
    createdBy: "user-1",
    publishedAt: new Date("2024-03-01"),
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "workshop-4",
    title: "From Hackathon to Production",
    description: "How to take your buildathon project and turn it into a real product.",
    videoUrl: "https://youtube.com/watch?v=production",
    partnerName: "Builder Academy",
    category: "Business",
    duration: "60 min",
    status: "draft",
    createdBy: "user-1",
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-04-10"),
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

// Mock Sponsors
export const mockSponsors: Sponsor[] = [
  {
    id: "sponsor-1",
    cohortId: "cohort-2",
    name: "GameFi Labs",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=gamefi",
    website: "https://gamefi.example.com",
    description: "Leading gaming infrastructure provider for Web3",
    tier: "gold",
    prizePoolContribution: 5000,
    hasDedicatedTrack: true,
    contactName: "Sarah Sponsor",
    contactEmail: "sponsor@gamefi.com",
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "sponsor-2",
    cohortId: "cohort-2",
    name: "AI Labs",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=ailabs",
    website: "https://ailabs.example.com",
    description: "Pioneering AI research and applications",
    tier: "platinum",
    prizePoolContribution: 10000,
    hasDedicatedTrack: false,
    contactName: "Alex AI",
    contactEmail: "alex@ailabs.example.com",
    createdAt: new Date("2024-05-10"),
    updatedAt: new Date("2024-05-10"),
  },
];

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

// Helper function to get sponsors by cohort
export function getSponsorsByCohort(cohortId: string): Sponsor[] {
  return mockSponsors.filter(s => s.cohortId === cohortId);
}

// Helper function to get workshops by sponsor
export function getWorkshopsBySponsor(sponsorId: string): Workshop[] {
  return mockWorkshops.filter(w => w.sponsorId === sponsorId);
}

// Helper function to get sponsor by user
export function getSponsorByUser(userId: string): Sponsor | undefined {
  const user = mockUsers.find(u => u.id === userId);
  if (!user?.sponsorId) return undefined;
  return mockSponsors.find(s => s.id === user.sponsorId);
}
