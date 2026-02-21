-- ─────────────────────────────────────────────────────────────────────────────
-- 00030_realtime_for_interactions.sql
--
-- Add comments, reactions, bookmarks, and profiles tables to the
-- supabase_realtime publication so that client-side Realtime subscriptions
-- actually receive INSERT / UPDATE / DELETE events.
--
-- Without this, optimistic UI entries (e.g. newly posted comments) are never
-- replaced by the authoritative DB row, causing them to disappear from the UI
-- after the 5-second cleanup timer fires — even though the data WAS saved.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'comments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.comments';
  END IF;

  -- reactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions';
  END IF;

  -- bookmarks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bookmarks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks';
  END IF;

  -- profiles (follower/following counters use UPDATE events on profiles)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END $$;
