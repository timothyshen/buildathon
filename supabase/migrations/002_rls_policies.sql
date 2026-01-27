-- Row Level Security Policies
-- Run this after 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is sponsor
CREATE OR REPLACE FUNCTION public.is_sponsor()
RETURNS BOOLEAN AS $$
  SELECT public.user_role() = 'sponsor'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is judge
CREATE OR REPLACE FUNCTION public.is_judge()
RETURNS BOOLEAN AS $$
  SELECT public.user_role() = 'judge'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's sponsor org id
CREATE OR REPLACE FUNCTION public.user_sponsor_org_id()
RETURNS UUID AS $$
  SELECT sponsor_org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = $1 AND user_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is team lead
CREATE OR REPLACE FUNCTION public.is_team_lead(team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = $1 AND user_id = auth.uid() AND role = 'lead'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Anyone can view user profiles
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can manage all users
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (public.is_admin());

-- ============================================
-- COHORTS POLICIES
-- ============================================

-- Public cohorts viewable by everyone, all cohorts viewable by admins
CREATE POLICY "Cohorts are viewable"
  ON cohorts FOR SELECT
  USING (is_public = true OR public.is_admin());

-- Only admins can manage cohorts
CREATE POLICY "Admins can manage cohorts"
  ON cohorts FOR ALL
  USING (public.is_admin());

-- ============================================
-- SPONSOR ORGS POLICIES
-- ============================================

-- Anyone can view sponsor orgs
CREATE POLICY "Sponsor orgs are viewable by everyone"
  ON sponsor_orgs FOR SELECT
  USING (true);

-- Admins can manage sponsor orgs
CREATE POLICY "Admins can manage sponsor orgs"
  ON sponsor_orgs FOR ALL
  USING (public.is_admin());

-- Sponsors can update their own org
CREATE POLICY "Sponsors can update own org"
  ON sponsor_orgs FOR UPDATE
  USING (id = public.user_sponsor_org_id())
  WITH CHECK (id = public.user_sponsor_org_id());

-- ============================================
-- COHORT SPONSORS POLICIES
-- ============================================

-- Anyone can view cohort sponsors
CREATE POLICY "Cohort sponsors are viewable by everyone"
  ON cohort_sponsors FOR SELECT
  USING (true);

-- Admins can manage cohort sponsors
CREATE POLICY "Admins can manage cohort sponsors"
  ON cohort_sponsors FOR ALL
  USING (public.is_admin());

-- ============================================
-- TRACKS POLICIES
-- ============================================

-- Anyone can view tracks
CREATE POLICY "Tracks are viewable by everyone"
  ON tracks FOR SELECT
  USING (true);

-- Admins can manage all tracks
CREATE POLICY "Admins can manage tracks"
  ON tracks FOR ALL
  USING (public.is_admin());

-- Sponsors can manage their own tracks
CREATE POLICY "Sponsors can manage own tracks"
  ON tracks FOR ALL
  USING (sponsor_org_id = public.user_sponsor_org_id());

-- ============================================
-- TEAMS POLICIES
-- ============================================

-- Anyone can view teams
CREATE POLICY "Teams are viewable by everyone"
  ON teams FOR SELECT
  USING (true);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Team leads can update team
CREATE POLICY "Team leads can update team"
  ON teams FOR UPDATE
  USING (public.is_team_lead(id))
  WITH CHECK (public.is_team_lead(id));

-- Team leads can delete team
CREATE POLICY "Team leads can delete team"
  ON teams FOR DELETE
  USING (public.is_team_lead(id));

-- Admins can manage all teams
CREATE POLICY "Admins can manage all teams"
  ON teams FOR ALL
  USING (public.is_admin());

-- ============================================
-- TEAM MEMBERS POLICIES
-- ============================================

-- Anyone can view team members
CREATE POLICY "Team members are viewable by everyone"
  ON team_members FOR SELECT
  USING (true);

-- Team leads can manage team members
CREATE POLICY "Team leads can manage members"
  ON team_members FOR ALL
  USING (public.is_team_lead(team_id));

-- Users can remove themselves from team
CREATE POLICY "Users can leave team"
  ON team_members FOR DELETE
  USING (user_id = auth.uid());

-- Admins can manage all team members
CREATE POLICY "Admins can manage all team members"
  ON team_members FOR ALL
  USING (public.is_admin());

-- ============================================
-- TEAM INVITES POLICIES
-- ============================================

-- Team members can view invites for their team
CREATE POLICY "Team members can view invites"
  ON team_invites FOR SELECT
  USING (public.is_team_member(team_id) OR email = (SELECT email FROM users WHERE id = auth.uid()));

-- Team leads can manage invites
CREATE POLICY "Team leads can manage invites"
  ON team_invites FOR ALL
  USING (public.is_team_lead(team_id));

-- Users can update invites sent to them
CREATE POLICY "Users can respond to their invites"
  ON team_invites FOR UPDATE
  USING (email = (SELECT email FROM users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM users WHERE id = auth.uid()));

-- Admins can manage all invites
CREATE POLICY "Admins can manage all invites"
  ON team_invites FOR ALL
  USING (public.is_admin());

-- ============================================
-- SUBMISSIONS POLICIES
-- ============================================

-- Submitted submissions are viewable by everyone
CREATE POLICY "Submitted submissions are viewable"
  ON submissions FOR SELECT
  USING (status != 'draft' OR public.is_team_member(team_id) OR public.is_admin() OR public.is_judge());

-- Team members can create submissions
CREATE POLICY "Team members can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (public.is_team_member(team_id));

-- Team members can update their submissions
CREATE POLICY "Team members can update submissions"
  ON submissions FOR UPDATE
  USING (public.is_team_member(team_id))
  WITH CHECK (public.is_team_member(team_id));

-- Team leads can delete draft submissions
CREATE POLICY "Team leads can delete draft submissions"
  ON submissions FOR DELETE
  USING (status = 'draft' AND public.is_team_lead(team_id));

-- Admins can manage all submissions
CREATE POLICY "Admins can manage all submissions"
  ON submissions FOR ALL
  USING (public.is_admin());

-- ============================================
-- SUBMISSION TRACKS POLICIES
-- ============================================

-- Anyone can view submission tracks
CREATE POLICY "Submission tracks are viewable"
  ON submission_tracks FOR SELECT
  USING (true);

-- Team members can manage submission tracks
CREATE POLICY "Team members can manage submission tracks"
  ON submission_tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id AND public.is_team_member(s.team_id)
    )
  );

-- Admins can manage all
CREATE POLICY "Admins can manage submission tracks"
  ON submission_tracks FOR ALL
  USING (public.is_admin());

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Judges can view their assigned reviews
CREATE POLICY "Judges can view assigned reviews"
  ON reviews FOR SELECT
  USING (judge_id = auth.uid() OR public.is_admin());

-- Judges can update their reviews
CREATE POLICY "Judges can update own reviews"
  ON reviews FOR UPDATE
  USING (judge_id = auth.uid())
  WITH CHECK (judge_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  USING (public.is_admin());

-- ============================================
-- WORKSHOPS POLICIES
-- ============================================

-- Published workshops are viewable by everyone
CREATE POLICY "Published workshops are viewable"
  ON workshops FOR SELECT
  USING (status = 'published' OR public.is_admin() OR sponsor_org_id = public.user_sponsor_org_id());

-- Admins can manage all workshops
CREATE POLICY "Admins can manage all workshops"
  ON workshops FOR ALL
  USING (public.is_admin());

-- Sponsors can manage their workshops
CREATE POLICY "Sponsors can manage own workshops"
  ON workshops FOR ALL
  USING (sponsor_org_id = public.user_sponsor_org_id());

-- ============================================
-- WORKSHOP COHORTS POLICIES
-- ============================================

-- Anyone can view workshop cohorts
CREATE POLICY "Workshop cohorts are viewable"
  ON workshop_cohorts FOR SELECT
  USING (true);

-- Admins can manage workshop cohorts
CREATE POLICY "Admins can manage workshop cohorts"
  ON workshop_cohorts FOR ALL
  USING (public.is_admin());

-- ============================================
-- WORKSHOP RSVPS POLICIES
-- ============================================

-- Anyone can view RSVPs (for counts)
CREATE POLICY "RSVPs are viewable"
  ON workshop_rsvps FOR SELECT
  USING (true);

-- Users can manage their own RSVPs
CREATE POLICY "Users can manage own RSVPs"
  ON workshop_rsvps FOR ALL
  USING (user_id = auth.uid());

-- Admins can manage all RSVPs
CREATE POLICY "Admins can manage all RSVPs"
  ON workshop_rsvps FOR ALL
  USING (public.is_admin());

-- ============================================
-- WORKSHOP VERSIONS POLICIES
-- ============================================

-- Workshop versions viewable by admins and sponsors
CREATE POLICY "Workshop versions viewable by admins and sponsors"
  ON workshop_versions FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM workshops w
      WHERE w.id = workshop_id AND w.sponsor_org_id = public.user_sponsor_org_id()
    )
  );

-- Admins and sponsors can create versions
CREATE POLICY "Admins and sponsors can create versions"
  ON workshop_versions FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM workshops w
      WHERE w.id = workshop_id AND w.sponsor_org_id = public.user_sponsor_org_id()
    )
  );

-- ============================================
-- MEDIA ASSETS POLICIES
-- ============================================

-- Anyone can view media assets
CREATE POLICY "Media assets are viewable"
  ON media_assets FOR SELECT
  USING (true);

-- Authenticated users can upload media
CREATE POLICY "Authenticated users can upload media"
  ON media_assets FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own media
CREATE POLICY "Users can delete own media"
  ON media_assets FOR DELETE
  USING (uploaded_by = auth.uid());

-- Admins can manage all media
CREATE POLICY "Admins can manage all media"
  ON media_assets FOR ALL
  USING (public.is_admin());

-- ============================================
-- TEMPLATES POLICIES
-- ============================================

-- Anyone can view templates
CREATE POLICY "Templates are viewable by everyone"
  ON templates FOR SELECT
  USING (true);

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON templates FOR ALL
  USING (public.is_admin());
