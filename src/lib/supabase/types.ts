import type { Database } from "./database.types";

// Re-export the Database type
export type { Database };

// Table row types
export type DbUser = Database["public"]["Tables"]["users"]["Row"];
export type DbCohort = Database["public"]["Tables"]["cohorts"]["Row"];
export type DbSponsorOrg = Database["public"]["Tables"]["sponsor_orgs"]["Row"];
export type DbCohortSponsor = Database["public"]["Tables"]["cohort_sponsors"]["Row"];
export type DbTrack = Database["public"]["Tables"]["tracks"]["Row"];
export type DbTeam = Database["public"]["Tables"]["teams"]["Row"];
export type DbTeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type DbTeamInvite = Database["public"]["Tables"]["team_invites"]["Row"];
export type DbSubmission = Database["public"]["Tables"]["submissions"]["Row"];
export type DbSubmissionTrack = Database["public"]["Tables"]["submission_tracks"]["Row"];
export type DbReview = Database["public"]["Tables"]["reviews"]["Row"];
export type DbWorkshop = Database["public"]["Tables"]["workshops"]["Row"];
export type DbWorkshopCohort = Database["public"]["Tables"]["workshop_cohorts"]["Row"];
export type DbWorkshopRsvp = Database["public"]["Tables"]["workshop_rsvps"]["Row"];
export type DbWorkshopVersion = Database["public"]["Tables"]["workshop_versions"]["Row"];
export type DbMediaAsset = Database["public"]["Tables"]["media_assets"]["Row"];
export type DbTemplate = Database["public"]["Tables"]["templates"]["Row"];

// Insert types
export type DbUserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type DbCohortInsert = Database["public"]["Tables"]["cohorts"]["Insert"];
export type DbSponsorOrgInsert = Database["public"]["Tables"]["sponsor_orgs"]["Insert"];
export type DbCohortSponsorInsert = Database["public"]["Tables"]["cohort_sponsors"]["Insert"];
export type DbTrackInsert = Database["public"]["Tables"]["tracks"]["Insert"];
export type DbTeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
export type DbTeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"];
export type DbTeamInviteInsert = Database["public"]["Tables"]["team_invites"]["Insert"];
export type DbSubmissionInsert = Database["public"]["Tables"]["submissions"]["Insert"];
export type DbSubmissionTrackInsert = Database["public"]["Tables"]["submission_tracks"]["Insert"];
export type DbReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type DbWorkshopInsert = Database["public"]["Tables"]["workshops"]["Insert"];
export type DbWorkshopCohortInsert = Database["public"]["Tables"]["workshop_cohorts"]["Insert"];
export type DbWorkshopRsvpInsert = Database["public"]["Tables"]["workshop_rsvps"]["Insert"];
export type DbWorkshopVersionInsert = Database["public"]["Tables"]["workshop_versions"]["Insert"];
export type DbMediaAssetInsert = Database["public"]["Tables"]["media_assets"]["Insert"];
export type DbTemplateInsert = Database["public"]["Tables"]["templates"]["Insert"];

// Update types
export type DbUserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type DbCohortUpdate = Database["public"]["Tables"]["cohorts"]["Update"];
export type DbSponsorOrgUpdate = Database["public"]["Tables"]["sponsor_orgs"]["Update"];
export type DbCohortSponsorUpdate = Database["public"]["Tables"]["cohort_sponsors"]["Update"];
export type DbTrackUpdate = Database["public"]["Tables"]["tracks"]["Update"];
export type DbTeamUpdate = Database["public"]["Tables"]["teams"]["Update"];
export type DbTeamMemberUpdate = Database["public"]["Tables"]["team_members"]["Update"];
export type DbTeamInviteUpdate = Database["public"]["Tables"]["team_invites"]["Update"];
export type DbSubmissionUpdate = Database["public"]["Tables"]["submissions"]["Update"];
export type DbSubmissionTrackUpdate = Database["public"]["Tables"]["submission_tracks"]["Update"];
export type DbReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];
export type DbWorkshopUpdate = Database["public"]["Tables"]["workshops"]["Update"];
export type DbWorkshopCohortUpdate = Database["public"]["Tables"]["workshop_cohorts"]["Update"];
export type DbWorkshopRsvpUpdate = Database["public"]["Tables"]["workshop_rsvps"]["Update"];
export type DbWorkshopVersionUpdate = Database["public"]["Tables"]["workshop_versions"]["Update"];
export type DbMediaAssetUpdate = Database["public"]["Tables"]["media_assets"]["Update"];
export type DbTemplateUpdate = Database["public"]["Tables"]["templates"]["Update"];

// Enum types
export type UserRole = Database["public"]["Enums"]["user_role"];
export type CohortStatus = Database["public"]["Enums"]["cohort_status"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
export type ReviewStatus = Database["public"]["Enums"]["review_status"];
export type WorkshopStatus = Database["public"]["Enums"]["workshop_status"];
export type TeamRole = Database["public"]["Enums"]["team_role"];
export type InviteStatus = Database["public"]["Enums"]["invite_status"];
export type SponsorTier = Database["public"]["Enums"]["sponsor_tier"];
export type RsvpStatus = Database["public"]["Enums"]["rsvp_status"];
export type IpLicenseType = Database["public"]["Enums"]["ip_license_type"];
