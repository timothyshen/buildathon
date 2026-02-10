/**
 * Services Index
 * Barrel export for all service modules
 *
 * Usage:
 *   import { teamsService, cohortsService } from "@/services";
 *   const { data: teams } = await teamsService.getByUser(userId);
 */

// Export service instances
export { authService } from "./auth.service";
export { usersService } from "./users.service";
export { cohortsService } from "./cohorts.service";
export { teamsService } from "./teams.service";
export { submissionsService } from "./submissions.service";
export { tracksService } from "./tracks.service";
export { workshopsService } from "./workshops.service";
export { reviewsService } from "./reviews.service";
export { sponsorsService } from "./sponsors.service";
export { tractionService } from "./traction.service";
export { referralsService } from "./referrals.service";
export { feedbackService } from "./feedback.service";
export { eventsService } from "./events.service";
export { notificationsService } from "./notifications.service";

// Export types
export type { ServiceResponse, PaginatedResponse, QueryOptions } from "./types";
export { success, error, paginated } from "./types";

// Export service-specific types
export type { OnboardingData, RegisterData, AuthService } from "./auth.service";
export type { UsersService } from "./users.service";
export type { CohortsService } from "./cohorts.service";
export type { TeamsService, CreateTeamData, CreateInviteData } from "./teams.service";
export type { SubmissionsService } from "./submissions.service";
export type { TracksService } from "./tracks.service";
export type { WorkshopsService } from "./workshops.service";
export type { ReviewsService, ReviewScores, SubmitReviewData } from "./reviews.service";
export type { SponsorsService, CohortSponsorWithOrg } from "./sponsors.service";
export type { TractionService } from "./traction.service";
export type { ReferralsService } from "./referrals.service";
export type { FeedbackService, FeedbackListOptions, CreateFeedbackData } from "./feedback.service";
export type { NotificationsService } from "./notifications.service";
