-- ─────────────────────────────────────────────────────────────────────────────
-- 00021_admin_projects.sql
-- Admin project management — group tasks under projects with a responsible owner
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. admin_projects ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_projects (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  color        text        NOT NULL DEFAULT '#6366f1',
  assignee_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_projects_assignee   ON public.admin_projects(assignee_id);
CREATE INDEX IF NOT EXISTS idx_admin_projects_created_by ON public.admin_projects(created_by);

-- ── 2. Add project_id to admin_tasks ──────────────────────────────────────────

ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS project_id uuid
  REFERENCES public.admin_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_tasks_project ON public.admin_tasks(project_id);

-- ── 3. updated_at trigger for admin_projects ──────────────────────────────────

DROP TRIGGER IF EXISTS admin_projects_updated_at ON public.admin_projects;
CREATE TRIGGER admin_projects_updated_at
  BEFORE UPDATE ON public.admin_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_projects_select ON public.admin_projects;
CREATE POLICY admin_projects_select ON public.admin_projects
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS admin_projects_insert ON public.admin_projects;
CREATE POLICY admin_projects_insert ON public.admin_projects
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_projects_update ON public.admin_projects;
CREATE POLICY admin_projects_update ON public.admin_projects
  FOR UPDATE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS admin_projects_delete ON public.admin_projects;
CREATE POLICY admin_projects_delete ON public.admin_projects
  FOR DELETE TO authenticated USING (public.is_admin_user());
