-- ============================================================
-- Migration: comments edit support + content reports
-- ============================================================

-- 1) comments: updated_at + update policy + trigger
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS comments_update_own ON public.comments;
CREATE POLICY comments_update_own
  ON public.comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'snippet', 'comment')),
  target_id   uuid NOT NULL,
  reason      text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'copyright', 'other')),
  details     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

DROP POLICY IF EXISTS reports_insert_own ON public.reports;
CREATE POLICY reports_insert_own
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS reports_select_admin ON public.reports;
CREATE POLICY reports_select_admin
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS reports_update_admin ON public.reports;
CREATE POLICY reports_update_admin
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS reports_delete_admin ON public.reports;
CREATE POLICY reports_delete_admin
  ON public.reports FOR DELETE
  TO authenticated
  USING (public.is_admin_user());
