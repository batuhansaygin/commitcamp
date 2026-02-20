-- Add icon_url column to achievements (stores uploaded image URL).
-- The existing emoji `icon` field is kept as a text fallback.

ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS icon_url text;

-- Storage bucket for achievement icon images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'achievement-icons',
  'achievement-icons',
  true,
  5242880,   -- 5 MB limit per file
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for the achievement-icons bucket objects
CREATE POLICY "achievement_icons_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'achievement-icons');

CREATE POLICY "achievement_icons_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'achievement-icons'
    AND public.is_admin_user()
  );

CREATE POLICY "achievement_icons_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'achievement-icons'
    AND public.is_admin_user()
  );
