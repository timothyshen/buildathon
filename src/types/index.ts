export type UserRole = "admin" | "sponsor" | "judge" | "participant";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  sponsorOrgId?: string;
  walletAddress?: string;
  bio?: string;
  twitter?: string;
  github?: string;
  hasCompletedOnboarding?: boolean;
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
  sponsorOrgId?: string;
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

export interface TeamInvite {
  id: string;
  teamId: string;
  team?: Team;
  email: string;
  invitedBy: string;
  inviter?: User;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  expiresAt: Date;
}

export interface Submission {
  id: string;
  cohortId: string;
  cohort?: Cohort;
  teamId?: string;
  team?: Team;
  createdBy: string;
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
  sponsorOrgId?: string;
  createdBy?: string;
  category: string;
  duration?: string;
  status: WorkshopStatus;
  publishedAt?: Date;

  // Cohort association
  isEvergreen: boolean;        // true = global (learning library), false = cohort-specific
  cohortIds?: string[];        // if not evergreen, which cohorts to show in

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

// Persistent sponsor organization (can participate in multiple cohorts)
export interface SponsorOrg {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  contactName: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

// Junction: sponsor participation in a specific cohort
export interface CohortSponsor {
  id: string;
  cohortId: string;
  sponsorOrgId: string;
  tier: SponsorTier;
  prizePoolContribution: number;
  hasDedicatedTrack: boolean;
  description?: string; // Rich text description for this sponsor in this cohort
}

// Legacy alias for backwards compatibility during migration
export type Sponsor = SponsorOrg & {
  cohortId?: string;
  tier?: SponsorTier;
  prizePoolContribution?: number;
  hasDedicatedTrack?: boolean;
};

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

// Traction Tracking Types

export type MilestoneType =
  | "testnet_launch"
  | "mainnet_launch"
  | "first_100_users"
  | "first_1000_users"
  | "first_10000_users"
  | "funding_raised"
  | "partnership"
  | "media_feature"
  | "award"
  | "other";

export interface SubmissionTraction {
  id: string;
  submissionId: string;
  submission?: Submission;

  // Contract addresses (Story Protocol)
  testnetContractAddress?: string;
  mainnetContractAddress?: string;
  contractDeployedAt?: Date;

  // Twitter integration
  twitterHandle?: string;
  twitterUserId?: string;

  // Website
  websiteUrl?: string;

  // Google Analytics
  gaPropertyId?: string;
  gaRefreshToken?: string;
  gaConnectedAt?: Date;
  gaConnectedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface TractionSnapshot {
  id: string;
  submissionId: string;
  snapshotDate: Date;

  // Usage (self-reported)
  reportedDau?: number;
  reportedMau?: number;
  reportedMonthlyVisits?: number;

  // On-chain (automated via Dune)
  onchainTxCount?: number;
  onchainUniqueAddresses?: number;
  onchainTvlUsd?: number;

  // Twitter (automated)
  twitterFollowers?: number;
  twitterImpressions7d?: number;
  twitterEngagement7d?: number;

  // Google Analytics (automated)
  gaActiveUsers?: number;
  gaTotalUsers?: number;
  gaSessions?: number;
  gaPageviews?: number;
  gaBounceRate?: number;
  gaAvgSessionDuration?: number;

  dataSource: "manual" | "api" | "both";
  createdAt: Date;
}

export interface TractionMilestone {
  id: string;
  submissionId: string;

  milestoneType: MilestoneType;
  title: string;
  description?: string;
  achievedAt: Date;

  // Verification
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  proofUrl?: string;

  createdAt: Date;
}
