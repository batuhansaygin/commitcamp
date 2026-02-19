-- ─────────────────────────────────────────────────────────────────────────────
-- 00013_profile_enhancements.sql
-- Adds new profile columns, synced count columns, triggers, and an RPC for
-- profile stats.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns on profiles ───────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS github_username text,
  ADD COLUMN IF NOT EXISTS twitter_username text,
  ADD COLUMN IF NOT EXISTS tech_stack text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT
    '{"likes": true, "comments": true, "follows": true, "level_up": true}'::jsonb;

-- ── 2. Back-fill counts from existing data ───────────────────────────────────

UPDATE public.profiles p
SET
  followers_count = COALESCE((
    SELECT COUNT(*) FROM public.follows WHERE following_id = p.id
  ), 0),
  following_count = COALESCE((
    SELECT COUNT(*) FROM public.follows WHERE follower_id = p.id
  ), 0),
  posts_count = COALESCE((
    SELECT COUNT(*) FROM public.posts WHERE user_id = p.id
  ), 0);

-- ── 3. Trigger: keep followers_count / following_count in sync ────────────────

CREATE OR REPLACE FUNCTION public.sync_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles
      SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE public.profiles
      SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_follow_counts();

-- ── 4. Trigger: keep posts_count in sync ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_change ON public.posts;
CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_count();

-- ── 5. RPC: get_profile_stats ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_profile_stats(p_username text)
RETURNS TABLE (
  posts_count       bigint,
  total_likes       bigint,
  followers_count   bigint,
  following_count   bigint,
  total_xp          integer,
  member_since      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.posts_count::bigint,
    COALESCE((
      SELECT COUNT(*)
      FROM public.reactions r
      JOIN public.posts po
        ON r.target_id = po.id AND r.target_type = 'post'
      WHERE po.user_id = p.id
    ), 0) AS total_likes,
    p.followers_count::bigint,
    p.following_count::bigint,
    p.xp_points AS total_xp,
    p.created_at AS member_since
  FROM public.profiles p
  WHERE p.username = p_username
$$;

-- ── 6. Storage bucket RLS policies ───────────────────────────────────────────
-- NOTE: Buckets 'avatars' and 'covers' must be created in the Supabase
-- dashboard (Storage → New bucket → public, 2 MB / 5 MB limit).
-- The policies below will apply once the buckets exist.

DO $$
BEGIN
  -- avatars: authenticated users can manage objects in their own folder
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_select_public'
  ) THEN
    CREATE POLICY avatars_select_public ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars');
  END IF;

  -- covers: same pattern
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
