export type UserRole = "admin" | "sponsor" | "judge" | "participant";

export interface NotificationPreferences {
  push_enabled: boolean;
  submission_updates: boolean;
  review_alerts: boolean;
  deadline_reminders: boolean;
  team_activity: boolean;
}

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
  notificationPreferences?: NotificationPreferences;
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
  minReviewsPerSubmission: number;
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
  logoUrl?: string;
  description: string;
  demoUrl?: string;
  videoUrl?: string;
  repoUrl?: string;
  presentationUrl?: string;
  screenshots: string[];

  // Track integration descriptions (trackId → description)
  trackDescriptions?: Record<string, string>;

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
  prizePoolLimit: number;
  hasDedicatedTrack: boolean;
  description?: string; // Rich text description for this sponsor in this cohort
}

export interface CohortJudge {
  id: string;
  cohortId: string;
  judgeId: string;
  createdAt: Date;
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
  onchainDailyTxCount?: number;
  onchainWeeklyTxCount?: number;
  onchainDailyVolume?: string;
  onchainWeeklyVolume?: string;
  onchainDailyActiveAddresses?: number;
  onchainWeeklyActiveAddresses?: number;

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

// ==================== Referrals ====================

export type ReferralStatus = "pending" | "credited";

export interface ReferralCode {
  id: string;
  userId: string;
  cohortId: string;
  code: string;
  createdAt: Date;
}

export interface Referral {
  id: string;
  referralCodeId: string;
  referrerId: string;
  referredId: string;
  cohortId: string;
  status: ReferralStatus;
  creditedAt?: Date;
  createdAt: Date;
  referrer?: User;
  referred?: User;
  cohort?: Cohort;
}

export interface ReferralLeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  cohortId: string;
  totalReferrals: number;
  pendingReferrals: number;
  rank: number;
}

// ==================== Calendar Events (Luma) ====================

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  descriptionMd?: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  eventUrl: string; // lu.ma URL
  coverUrl?: string;
  meetingUrl?: string;
  location?: string;
  hostName?: string;
  hostAvatar?: string;
  category: string;
  tags?: string[];
  lumaApiId: string;
  attendeeCount?: number;
}

export interface EventRSVP {
  id: string;
  lumaEventId: string;
  userId: string;
  createdAt: Date;
}

// ==================== Feedback ====================

export type FeedbackStatus = "open" | "planned" | "in_progress" | "completed" | "declined";
export type FeedbackCategory = "feature_request" | "bug_report" | "improvement";

export interface FeedbackPost {
  id: string;
  authorId: string;
  author?: User;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  voteCount: number;
  commentCount: number;
  statusChangedBy?: string;
  statusChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  hasVoted?: boolean;
}

export interface FeedbackVote {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface FeedbackComment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  parentId?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: FeedbackComment[];
}

// ==================== Ideas ====================

export type IdeaStatus = "open" | "seeking_team" | "in_progress" | "built" | "archived";
export type IdeaInterestRole = "builder" | "designer" | "business" | "other";

export interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorId: string;
  author?: User;
  status: IdeaStatus;
  cohortId?: string;
  submissionId?: string;
  voteCount: number;
  commentCount: number;
  interestCount: number;
  createdAt: Date;
  updatedAt: Date;
  hasVoted?: boolean;
}

export interface IdeaVote {
  id: string;
  ideaId: string;
  userId: string;
  createdAt: Date;
}

export interface IdeaComment {
  id: string;
  ideaId: string;
  authorId: string;
  author?: User;
  parentId?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: IdeaComment[];
}

export interface IdeaInterest {
  id: string;
  ideaId: string;
  userId: string;
  user?: User;
  role: IdeaInterestRole;
  message?: string;
  createdAt: Date;
}

// Notifications
export type NotificationType =
  | "submission_status_changed"
  | "review_received"
  | "deadline_reminder"
  | "team_invite"
  | "winner_announced"
  | "review_assigned"
  | "review_deadline"
  | "new_track_submission"
  | "track_review_completed"
  | "new_submission"
  | "new_user"
  | "new_feedback"
  | "idea_comment"
  | "idea_interest";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}
