-- Traction Tracking tables for post-hackathon metrics
-- Tracks usage, on-chain activity, and social metrics for submissions

-- Milestone type enum
CREATE TYPE milestone_type AS ENUM (
  'testnet_launch',
  'mainnet_launch',
  'first_100_users',
  'first_1000_users',
  'first_10000_users',
  'funding_raised',
  'partnership',
  'media_feature',
  'award',
  'other'
);

-- Main traction config per submission
CREATE TABLE submission_traction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

  -- Contract addresses (Story Protocol)
  testnet_contract_address TEXT,
  mainnet_contract_address TEXT,
  contract_deployed_at TIMESTAMPTZ,

  -- Twitter integration
  twitter_handle TEXT,
  twitter_user_id TEXT,  -- For API lookups

  -- Website
  website_url TEXT,

  -- Google Analytics integration
  ga_property_id TEXT,           -- GA4 property ID (e.g., "properties/123456789")
  ga_refresh_token TEXT,         -- OAuth refresh token (encrypted)
  ga_connected_at TIMESTAMPTZ,   -- When GA was connected
  ga_connected_by UUID REFERENCES users(id),  -- Who connected it

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id)
);

-- Periodic snapshots of metrics for historical tracking
CREATE TABLE traction_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Usage (self-reported)
  reported_dau INTEGER,
  reported_mau INTEGER,
  reported_monthly_visits INTEGER,

  -- On-chain (automated via Dune)
  onchain_tx_count INTEGER,
  onchain_unique_addresses INTEGER,
  onchain_tvl_usd NUMERIC(20,2),

  -- Twitter (automated)
  twitter_followers INTEGER,
  twitter_impressions_7d INTEGER,
  twitter_engagement_7d INTEGER,  -- likes + retweets + replies

  -- Google Analytics (automated)
  ga_active_users INTEGER,        -- Daily active users from GA
  ga_total_users INTEGER,         -- Total unique users
  ga_sessions INTEGER,
  ga_pageviews INTEGER,
  ga_bounce_rate NUMERIC(5,2),    -- Percentage
  ga_avg_session_duration INTEGER -- Seconds

  -- Metadata
  data_source TEXT DEFAULT 'manual',  -- 'manual', 'api', 'both'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(submission_id, snapshot_date)
);

-- Key achievements/milestones
CREATE TABLE traction_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

  milestone_type milestone_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  achieved_at DATE NOT NULL,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  proof_url TEXT,  -- Link to announcement, tx, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_submission_traction_submission ON submission_traction(submission_id);
CREATE INDEX idx_traction_snapshots_submission ON traction_snapshots(submission_id);
CREATE INDEX idx_traction_snapshots_date ON traction_snapshots(snapshot_date);
CREATE INDEX idx_traction_milestones_submission ON traction_milestones(submission_id);
CREATE INDEX idx_traction_milestones_type ON traction_milestones(milestone_type);

-- RLS Policies
ALTER TABLE submission_traction ENABLE ROW LEVEL SECURITY;
ALTER TABLE traction_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE traction_milestones ENABLE ROW LEVEL SECURITY;

-- submission_traction policies
CREATE POLICY "Users can view traction for their submissions"
  ON submission_traction FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can insert traction for their submissions"
  ON submission_traction FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can update traction for their submissions"
  ON submission_traction FOR UPDATE
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

-- traction_snapshots policies
CREATE POLICY "Users can view snapshots for their submissions"
  ON traction_snapshots FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can insert snapshots for their submissions"
  ON traction_snapshots FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

-- traction_milestones policies
CREATE POLICY "Users can view milestones for their submissions"
  ON traction_milestones FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can insert milestones for their submissions"
  ON traction_milestones FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can update milestones for their submissions"
  ON traction_milestones FOR UPDATE
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "Users can delete milestones for their submissions"
  ON traction_milestones FOR DELETE
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE created_by = auth.uid()
      UNION
      SELECT s.id FROM submissions s
      JOIN team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
    OR is_admin()
  );
