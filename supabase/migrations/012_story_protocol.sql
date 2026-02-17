-- 012_story_protocol.sql
-- Adds normalized Story Protocol tables for IP registration, licensing, and royalties.
-- Also adds fork tracking to submissions.

-- ============================================================
-- 1. New table: ip_assets
-- ============================================================
CREATE TABLE ip_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  ip_id TEXT NOT NULL UNIQUE,
  nft_contract TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  metadata_uri TEXT,
  metadata_hash TEXT,
  parent_ip_id TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_assets_submission ON ip_assets(submission_id);
CREATE INDEX idx_ip_assets_ip_id ON ip_assets(ip_id);
CREATE INDEX idx_ip_assets_parent_ip_id ON ip_assets(parent_ip_id);
CREATE INDEX idx_ip_assets_owner_address ON ip_assets(owner_address);

-- ============================================================
-- 2. New table: ip_license_terms
-- ============================================================
CREATE TABLE ip_license_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
  license_terms_id TEXT NOT NULL,
  commercial_use BOOLEAN NOT NULL DEFAULT false,
  commercial_attribution BOOLEAN NOT NULL DEFAULT false,
  commercial_rev_share INTEGER NOT NULL DEFAULT 0,
  default_minting_fee TEXT NOT NULL DEFAULT '0',
  derivatives_allowed BOOLEAN NOT NULL DEFAULT false,
  derivatives_attribution BOOLEAN NOT NULL DEFAULT false,
  derivatives_reciprocal BOOLEAN NOT NULL DEFAULT false,
  derivatives_approval BOOLEAN NOT NULL DEFAULT false,
  transferable BOOLEAN NOT NULL DEFAULT true,
  currency TEXT,
  expiration BIGINT NOT NULL DEFAULT 0,
  uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_license_terms_ip_asset ON ip_license_terms(ip_asset_id);

-- ============================================================
-- 3. New table: royalty_snapshots
-- ============================================================
CREATE TABLE royalty_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
  vault_address TEXT,
  total_revenue_wip TEXT NOT NULL DEFAULT '0',
  claimable_wip TEXT NOT NULL DEFAULT '0',
  royalty_token_balance INTEGER NOT NULL DEFAULT 100,
  derivative_count INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_royalty_snapshots_ip_asset ON royalty_snapshots(ip_asset_id);
CREATE INDEX idx_royalty_snapshots_snapshot_at ON royalty_snapshots(snapshot_at DESC);

-- ============================================================
-- 4. Alter submissions: add fork tracking column
-- ============================================================
ALTER TABLE submissions
  ADD COLUMN forked_from_submission_id UUID REFERENCES submissions(id);

CREATE INDEX idx_submissions_forked_from ON submissions(forked_from_submission_id);

-- ============================================================
-- 5. Enable RLS on new tables
-- ============================================================
ALTER TABLE ip_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_license_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_snapshots ENABLE ROW LEVEL SECURITY;

-- ip_assets: anyone can SELECT, authenticated can INSERT
CREATE POLICY "ip_assets_select" ON ip_assets
  FOR SELECT USING (true);

CREATE POLICY "ip_assets_insert" ON ip_assets
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ip_license_terms: anyone can SELECT, authenticated can INSERT
CREATE POLICY "ip_license_terms_select" ON ip_license_terms
  FOR SELECT USING (true);

CREATE POLICY "ip_license_terms_insert" ON ip_license_terms
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- royalty_snapshots: anyone can SELECT, service_role can manage (ALL)
CREATE POLICY "royalty_snapshots_select" ON royalty_snapshots
  FOR SELECT USING (true);

CREATE POLICY "royalty_snapshots_manage" ON royalty_snapshots
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
