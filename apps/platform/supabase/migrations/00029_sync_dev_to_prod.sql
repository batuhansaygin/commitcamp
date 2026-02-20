-- ─────────────────────────────────────────────────────────────────────────────
-- 00029_sync_dev_to_prod.sql
-- Captures three schema elements that were added directly in the dev Supabase
-- dashboard (not via a migration) and therefore never existed in production:
--
--   1. profiles.last_active_date  (date column)
--   2. achievements RLS policy    achievements_public_read
--   3. user_achievements RLS policy user_achievements_public_read
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add last_active_date to profiles ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- ── 2. Achievements — public read policy ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'achievements'
      AND policyname = 'achievements_public_read'
  ) THEN
    CREATE POLICY achievements_public_read ON public.achievements
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;

-- ── 3. User achievements — public read policy ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_achievements'
      AND policyname = 'user_achievements_public_read'
  ) THEN
    CREATE POLICY user_achievements_public_read ON public.user_achievements
      FOR SELECT TO public
      USING (true);
  END IF;
END $$;
