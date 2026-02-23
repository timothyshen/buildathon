-- Add description column to submission_tracks junction table
-- Allows participants to describe their integration for sponsor bounty tracks
ALTER TABLE submission_tracks ADD COLUMN description TEXT;
