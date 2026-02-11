import { z } from "zod";

// Cohort Schema
export const cohortSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().min(1, "Description is required"),
  tagline: z.string().optional(),
  bannerImage: z.string().optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  submissionDeadline: z.string().min(1, "Submission deadline is required"),
  judgingStart: z.string().min(1, "Judging start is required"),
  judgingEnd: z.string().min(1, "Judging end is required"),
  status: z.enum(["draft", "upcoming", "active", "judging", "completed"]),
  isPublic: z.boolean(),
  maxTeamSize: z.number().min(1).max(10),
  minReviewsPerSubmission: z.number().min(1).max(10),
  prizes: z.array(z.object({
    place: z.string().min(1),
    amount: z.string().min(1),
    description: z.string().optional(),
  })).optional(),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: "Start date must be before end date",
  path: ["endDate"],
}).refine(data => {
  const submissionDate = new Date(data.submissionDeadline);
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return submissionDate >= startDate && submissionDate <= endDate;
}, {
  message: "Submission deadline must be between start and end dates",
  path: ["submissionDeadline"],
}).refine(data => new Date(data.judgingStart) >= new Date(data.submissionDeadline), {
  message: "Judging must start after submission deadline",
  path: ["judgingStart"],
}).refine(data => new Date(data.judgingEnd) > new Date(data.judgingStart), {
  message: "Judging end must be after judging start",
  path: ["judgingEnd"],
});

export type CohortFormData = z.infer<typeof cohortSchema>;

// Sponsor Schema
export const sponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  tier: z.enum(["platinum", "gold", "silver", "bronze", "community"]),
  prizePoolContribution: z.number().min(0, "Must be 0 or greater"),
  hasDedicatedTrack: z.boolean(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Must be a valid email"),
  cohortId: z.string().min(1, "Cohort is required"),
});

export type SponsorFormData = z.infer<typeof sponsorSchema>;

// Sponsor Org Schema (org-level fields only, no cohort-specific fields)
export const sponsorOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Must be a valid email"),
});

export type SponsorOrgFormData = z.infer<typeof sponsorOrgSchema>;

// Invite Sponsor Schema
export const inviteSponsorSchema = z.object({
  email: z.string().email("Must be a valid email"),
  name: z.string().min(1, "Name is required"),
  sponsorId: z.string().min(1, "Sponsor organization is required"),
});

export type InviteSponsorFormData = z.infer<typeof inviteSponsorSchema>;

// Track Schema
export const trackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  prizePool: z.string().optional(),
  cohortId: z.string().min(1, "Cohort is required"),
  requirements: z.array(z.string()).optional(),
});

export type TrackFormData = z.infer<typeof trackSchema>;

// Workshop Schema
export const workshopSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  duration: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  articleUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});

export type WorkshopFormData = z.infer<typeof workshopSchema>;
