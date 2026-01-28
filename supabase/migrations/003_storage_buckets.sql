-- Create storage buckets for file uploads

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Public read screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'screenshots');

-- Allow uploads (service role key bypasses RLS, but policies needed for completeness)
CREATE POLICY "Allow upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow upload screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'screenshots');

-- Allow delete for replacements
CREATE POLICY "Allow delete banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners');

CREATE POLICY "Allow delete screenshots"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'screenshots');
