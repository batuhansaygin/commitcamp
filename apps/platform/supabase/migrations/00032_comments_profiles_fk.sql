-- ============================================================
-- Migration: Link comments.user_id to profiles for PostgREST join
-- Needed for `profiles:user_id (...)` select in getComments action.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comments_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_user_id_profiles_fk
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END
$$;
