-- Cohort-scoped judge assignment and review configuration

-- Junction table: judges assigned to cohorts
CREATE TABLE cohort_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, judge_id)
);

CREATE INDEX idx_cohort_judges_cohort ON cohort_judges(cohort_id);
CREATE INDEX idx_cohort_judges_judge ON cohort_judges(judge_id);

-- Configurable minimum reviews per submission
ALTER TABLE cohorts ADD COLUMN min_reviews_per_submission INTEGER NOT NULL DEFAULT 3;

-- Prevent duplicate review assignments (same judge + same submission)
ALTER TABLE reviews ADD CONSTRAINT unique_review_per_judge_submission
  UNIQUE(submission_id, judge_id);

-- RLS
ALTER TABLE cohort_judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort judges viewable by admins and judges"
  ON cohort_judges FOR SELECT
  USING (public.is_admin() OR judge_id = auth.uid());

CREATE POLICY "Admins can manage cohort judges"
  ON cohort_judges FOR ALL
  USING (public.is_admin());
