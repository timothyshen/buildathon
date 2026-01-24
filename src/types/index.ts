export type UserRole = "admin" | "sponsor" | "judge" | "participant";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  sponsorId?: string;
  walletAddress?: string;
  bio?: string;
  twitter?: string;
  github?: string;
  createdAt: Date;
}

export interface Cohort {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline?: string;
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  judgingStart: Date;
  judgingEnd: Date;
  status: "draft" | "upcoming" | "active" | "judging" | "completed";
  isPublic: boolean;
  maxTeamSize: number;
  prizes?: Prize[];
}

export interface Prize {
  place: string;
  amount: string;
  description?: string;
}

export interface Track {
  id: string;
  cohortId: string;
  sponsorId?: string;
  name: string;
  description: string;
  prizePool?: string;
  sponsorName?: string;
  sponsorLogo?: string;
  requirements?: string[];
}

export interface Team {
  id: string;
  cohortId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  members: TeamMember[];
}

export interface TeamMember {
  userId: string;
  user: User;
  role: "lead" | "member";
  joinedAt: Date;
}

export interface Submission {
  id: string;
  cohortId: string;
  cohort?: Cohort;
  teamId: string;
  team?: Team;
  trackId?: string;
  trackIds?: string[];
  track?: Track;
  tracks?: Track[];

  // Project details
  title: string;
  tagline?: string;
  description: string;
  demoUrl?: string;
  videoUrl?: string;
  repoUrl?: string;
  presentationUrl?: string;
  screenshots: string[];

  // Tech
  techStack: string[];
  builtWithStory: boolean;

  // IP (mocked for now)
  ipAssetId?: string;
  ipRegisteredAt?: Date;
  ipLicenseType?: "non-commercial" | "commercial-use" | "commercial-remix";

  // Status
  status: "draft" | "submitted" | "under_review" | "accepted" | "winner";
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  submissionId: string;
  submission?: Submission;
  judgeId: string;
  judge?: User;

  // Scores (1-10)
  innovationScore?: number;
  executionScore?: number;
  designScore?: number;
  impactScore?: number;
  presentationScore?: number;

  overallScore?: number;
  feedback?: string;
  internalNotes?: string;

  status: "pending" | "in_progress" | "completed";
  completedAt?: Date;
  createdAt: Date;
}

export type WorkshopStatus = "draft" | "published" | "archived";

export interface Workshop {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  articleUrl?: string;
  partnerName?: string;
  partnerLogo?: string;
  sponsorId?: string;
  createdBy?: string;
  category: string;
  duration?: string;
  status: WorkshopStatus;
  publishedAt?: Date;

  // Scheduling fields
  scheduledAt?: Date;
  endTime?: Date;
  timezone?: string;
  isLive?: boolean;
  maxAttendees?: number;
  location?: string;
  meetingUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  submissionId: string;
  submission?: Submission;
  title: string;
  description: string;
  category: string;
  tags: string[];
  ipAssetId?: string;
  forkCount: number;
  isFeatured: boolean;
  createdAt: Date;
}

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze" | "community";

export interface Sponsor {
  id: string;
  cohortId: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
  contactName: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

export interface WorkshopVersion {
  id: string;
  workshopId: string;
  content: string;
  title: string;
  authorId: string;
  createdAt: Date;
  changeNote?: string;
}

export type RSVPStatus = "registered" | "attended" | "cancelled";

export interface WorkshopRSVP {
  id: string;
  workshopId: string;
  userId: string;
  user?: User;
  status: RSVPStatus;
  registeredAt: Date;
}
