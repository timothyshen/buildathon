-- Add logo_url column to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS logo_url TEXT;
