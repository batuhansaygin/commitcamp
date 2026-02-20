-- ─────────────────────────────────────────────────────────────────────────────
-- 00028_create_avatar_cover_buckets.sql
-- Creates the `avatars` and `covers` storage buckets that were referenced by
-- RLS policies in migration 00013 but never actually inserted into
-- storage.buckets — causing all avatar/cover uploads to fail in production.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET
    public             = true,
    file_size_limit    = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET
    public             = true,
    file_size_limit    = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ── Re-apply RLS policies (idempotent — skipped if they already exist) ────────

DO $$
BEGIN
  -- avatars: insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_insert_own'
  ) THEN
    CREATE POLICY avatars_insert_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- avatars: update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_update_own'
  ) THEN
    CREATE POLICY avatars_update_own ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- avatars: delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_delete_own'
  ) THEN
    CREATE POLICY avatars_delete_own ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- avatars: public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_select_public'
  ) THEN
    CREATE POLICY avatars_select_public ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars');
  END IF;

  -- covers: insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'covers_insert_own'
  ) THEN
    CREATE POLICY covers_insert_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'covers'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- covers: update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'covers_update_own'
  ) THEN
    CREATE POLICY covers_update_own ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'covers'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- covers: delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'covers_delete_own'
  ) THEN
    CREATE POLICY covers_delete_own ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'covers'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- covers: public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'covers_select_public'
  ) THEN
    CREATE POLICY covers_select_public ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'covers');
  END IF;
END $$;
