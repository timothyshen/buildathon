-- Add prize_pool_limit column to cohort_sponsors
-- Allows admins to set an upper limit on sponsor prize pool contribution per cohort
ALTER TABLE cohort_sponsors ADD COLUMN prize_pool_limit INTEGER DEFAULT 0;
