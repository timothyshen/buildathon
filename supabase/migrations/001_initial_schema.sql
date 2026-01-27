-- Supabase Schema for Buildathon Platform
-- Run this in the Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'sponsor', 'judge', 'participant');
CREATE TYPE cohort_status AS ENUM ('draft', 'upcoming', 'active', 'judging', 'completed');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'under_review', 'accepted', 'winner');
CREATE TYPE review_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE workshop_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE team_role AS ENUM ('lead', 'member');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE sponsor_tier AS ENUM ('platinum', 'gold', 'silver', 'bronze', 'community');
CREATE TYPE rsvp_status AS ENUM ('registered', 'attended', 'cancelled');
CREATE TYPE ip_license_type AS ENUM ('non-commercial', 'commercial-use', 'commercial-remix');

-- ============================================
-- TABLES
-- ============================================

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  avatar TEXT,
  wallet_address TEXT,
  bio TEXT,
  twitter TEXT,
  github TEXT,
  sponsor_org_id UUID,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts table
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tagline TEXT,
  banner_image TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  submission_deadline TIMESTAMPTZ NOT NULL,
  judging_start TIMESTAMPTZ,
  judging_end TIMESTAMPTZ,
  status cohort_status NOT NULL DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  max_team_size INTEGER DEFAULT 5,
  prizes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsor Organizations (persistent across cohorts)
CREATE TABLE sponsor_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to users table for sponsor_org_id
ALTER TABLE users ADD CONSTRAINT fk_users_sponsor_org
  FOREIGN KEY (sponsor_org_id) REFERENCES sponsor_orgs(id) ON DELETE SET NULL;

-- Cohort Sponsors (junction table for sponsor participation in cohorts)
CREATE TABLE cohort_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  sponsor_org_id UUID NOT NULL REFERENCES sponsor_orgs(id) ON DELETE CASCADE,
  tier sponsor_tier NOT NULL,
  prize_pool_contribution INTEGER DEFAULT 0,
  has_dedicated_track BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, sponsor_org_id)
);

-- Tracks (bounty tracks within cohorts)
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  sponsor_org_id UUID REFERENCES sponsor_orgs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_pool TEXT,
  requirements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, slug)
);

-- Team Members (junction table)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team Invites
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  status invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Project details
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  demo_url TEXT,
  video_url TEXT,
  repo_url TEXT,
  presentation_url TEXT,
  screenshots JSONB DEFAULT '[]',

  -- Tech
  tech_stack JSONB DEFAULT '[]',
  built_with_story BOOLEAN DEFAULT false,

  -- IP (Story Protocol integration)
  ip_asset_id TEXT,
  ip_registered_at TIMESTAMPTZ,
  ip_license_type ip_license_type,

  -- Status
  status submission_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission Tracks (junction table for multi-track submissions)
CREATE TABLE submission_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  UNIQUE(submission_id, track_id)
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Scores (1-10)
  innovation_score INTEGER CHECK (innovation_score >= 1 AND innovation_score <= 10),
  execution_score INTEGER CHECK (execution_score >= 1 AND execution_score <= 10),
  design_score INTEGER CHECK (design_score >= 1 AND design_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  presentation_score INTEGER CHECK (presentation_score >= 1 AND presentation_score <= 10),

  overall_score NUMERIC(3,1),
  feedback TEXT,
  internal_notes TEXT,

  status review_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshops
CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  article_url TEXT,
  partner_name TEXT,
  partner_logo TEXT,
  sponsor_org_id UUID REFERENCES sponsor_orgs(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  duration TEXT,
  status workshop_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  -- Cohort association
  is_evergreen BOOLEAN DEFAULT true,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  timezone TEXT,
  is_live BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  location TEXT,
  meeting_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Cohorts (junction table for cohort-specific workshops)
CREATE TABLE workshop_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  UNIQUE(workshop_id, cohort_id)
);

-- Workshop RSVPs
CREATE TABLE workshop_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  UNIQUE(workshop_id, user_id)
);

-- Workshop Versions (for content versioning)
CREATE TABLE workshop_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  change_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates (for project templates/starters)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  ip_asset_id TEXT,
  fork_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_sponsor_org ON users(sponsor_org_id);

CREATE INDEX idx_cohorts_slug ON cohorts(slug);
CREATE INDEX idx_cohorts_status ON cohorts(status);

CREATE INDEX idx_tracks_cohort ON tracks(cohort_id);
CREATE INDEX idx_tracks_sponsor ON tracks(sponsor_org_id);

CREATE INDEX idx_teams_cohort ON teams(cohort_id);
CREATE INDEX idx_teams_slug ON teams(cohort_id, slug);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

CREATE INDEX idx_team_invites_team ON team_invites(team_id);
CREATE INDEX idx_team_invites_email ON team_invites(email);

CREATE INDEX idx_submissions_cohort ON submissions(cohort_id);
CREATE INDEX idx_submissions_team ON submissions(team_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE INDEX idx_submission_tracks_submission ON submission_tracks(submission_id);
CREATE INDEX idx_submission_tracks_track ON submission_tracks(track_id);

CREATE INDEX idx_reviews_submission ON reviews(submission_id);
CREATE INDEX idx_reviews_judge ON reviews(judge_id);
CREATE INDEX idx_reviews_status ON reviews(status);

CREATE INDEX idx_cohort_sponsors_cohort ON cohort_sponsors(cohort_id);
CREATE INDEX idx_cohort_sponsors_sponsor ON cohort_sponsors(sponsor_org_id);

CREATE INDEX idx_workshops_status ON workshops(status);
CREATE INDEX idx_workshops_sponsor ON workshops(sponsor_org_id);
CREATE INDEX idx_workshops_scheduled ON workshops(scheduled_at);

CREATE INDEX idx_workshop_cohorts_workshop ON workshop_cohorts(workshop_id);
CREATE INDEX idx_workshop_cohorts_cohort ON workshop_cohorts(cohort_id);

CREATE INDEX idx_workshop_rsvps_workshop ON workshop_rsvps(workshop_id);
CREATE INDEX idx_workshop_rsvps_user ON workshop_rsvps(user_id);

CREATE INDEX idx_workshop_versions_workshop ON workshop_versions(workshop_id);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_featured ON templates(is_featured);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sponsor_orgs_updated_at
  BEFORE UPDATE ON sponsor_orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workshops_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'participant'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate overall score
CREATE OR REPLACE FUNCTION calculate_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.innovation_score IS NOT NULL
     AND NEW.execution_score IS NOT NULL
     AND NEW.design_score IS NOT NULL
     AND NEW.impact_score IS NOT NULL
     AND NEW.presentation_score IS NOT NULL THEN
    NEW.overall_score = (
      NEW.innovation_score +
      NEW.execution_score +
      NEW.design_score +
      NEW.impact_score +
      NEW.presentation_score
    )::NUMERIC / 5;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_review_overall_score
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION calculate_overall_score();
