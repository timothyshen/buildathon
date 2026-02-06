-- Referral system: per-cohort referral codes and tracking

-- Enum for referral status
CREATE TYPE referral_status AS ENUM ('pending', 'credited');

-- Referral codes: one unique short code per participant per cohort
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cohort_id)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_cohort ON referral_codes(cohort_id);

-- Referrals: tracks who referred whom for which cohort
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  status referral_status NOT NULL DEFAULT 'pending',
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id, cohort_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_cohort ON referrals(cohort_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referral codes: anyone can read (needed for link validation)
CREATE POLICY "Referral codes are viewable by everyone"
  ON referral_codes FOR SELECT
  USING (true);

-- Referral codes: participants can create their own
CREATE POLICY "Participants can create own referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Referrals: users can view their own (as referrer or referred)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Referrals: service role handles inserts/updates (via admin client in API routes)
-- No direct insert/update policies for regular users since all mutations
-- go through server-side API routes using the admin client
