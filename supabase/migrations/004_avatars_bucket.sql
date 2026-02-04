-- Create avatars storage bucket for user profile pictures

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow uploads
CREATE POLICY "Allow upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- Allow delete for replacements
CREATE POLICY "Allow delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');
