-- Allow solo submissions (no team required)

-- 1. Add created_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE submissions
      ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Backfill from team leads (fallback: any member) where created_by is null
UPDATE submissions s
SET created_by = (
  SELECT tm.user_id FROM team_members tm
  WHERE tm.team_id = s.team_id
  ORDER BY CASE WHEN tm.role = 'lead' THEN 0 ELSE 1 END
  LIMIT 1
)
WHERE s.created_by IS NULL;

-- 3. Make NOT NULL after backfill
ALTER TABLE submissions ALTER COLUMN created_by SET NOT NULL;

-- 4. Make team_id nullable
ALTER TABLE submissions ALTER COLUMN team_id DROP NOT NULL;

-- 5. Index for created_by lookups
CREATE INDEX IF NOT EXISTS idx_submissions_created_by ON submissions(created_by);

-- 6. Fix team_members: allow users to add themselves (needed for team creation)
CREATE POLICY "Users can add themselves to teams"
  ON team_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7. Update RLS policies to support solo submissions (team_id IS NULL)

-- Submissions: SELECT
DROP POLICY IF EXISTS "Submitted submissions are viewable" ON submissions;
CREATE POLICY "Submissions are viewable"
  ON submissions FOR SELECT
  USING (
    status != 'draft'
    OR created_by = auth.uid()
    OR (team_id IS NOT NULL AND public.is_team_member(team_id))
    OR public.is_admin()
    OR public.is_judge()
  );

-- Submissions: INSERT
DROP POLICY IF EXISTS "Team members can create submissions" ON submissions;
CREATE POLICY "Users can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (
      team_id IS NULL
      OR public.is_team_member(team_id)
    )
  );

-- Submissions: UPDATE
DROP POLICY IF EXISTS "Team members can update submissions" ON submissions;
CREATE POLICY "Submission owners can update"
  ON submissions FOR UPDATE
  USING (
    created_by = auth.uid()
    OR (team_id IS NOT NULL AND public.is_team_member(team_id))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

-- Submissions: DELETE
DROP POLICY IF EXISTS "Team leads can delete draft submissions" ON submissions;
CREATE POLICY "Owners can delete draft submissions"
  ON submissions FOR DELETE
  USING (
    status = 'draft'
    AND (
      created_by = auth.uid()
      OR (team_id IS NOT NULL AND public.is_team_lead(team_id))
    )
  );

-- Submission tracks: update to support solo
DROP POLICY IF EXISTS "Team members can manage submission tracks" ON submission_tracks;
CREATE POLICY "Submission owners can manage tracks"
  ON submission_tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id
      AND (
        s.created_by = auth.uid()
        OR (s.team_id IS NOT NULL AND public.is_team_member(s.team_id))
      )
    )
  );
