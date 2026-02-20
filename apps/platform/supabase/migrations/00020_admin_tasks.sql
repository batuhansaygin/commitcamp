-- ─────────────────────────────────────────────────────────────────────────────
-- 00020_admin_tasks.sql
-- Admin task management system (Jira-like Kanban for admin users)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM (
    'backlog', 'todo', 'in_progress', 'in_review', 'done'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM (
    'low', 'medium', 'high', 'urgent'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. admin_tasks ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  status       public.task_status   NOT NULL DEFAULT 'todo',
  priority     public.task_priority NOT NULL DEFAULT 'medium',
  assignee_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date     date,
  labels       text[] NOT NULL DEFAULT '{}',
  position     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_status     ON public.admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assignee   ON public.admin_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_created_by ON public.admin_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_position   ON public.admin_tasks(status, position);

-- ── 3. admin_task_comments ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_task_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES public.admin_tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_task_comments_task ON public.admin_task_comments(task_id);

-- ── 4. updated_at triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_tasks_updated_at ON public.admin_tasks;
CREATE TRIGGER admin_tasks_updated_at
  BEFORE UPDATE ON public.admin_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS admin_task_comments_updated_at ON public.admin_task_comments;
CREATE TRIGGER admin_task_comments_updated_at
  BEFORE UPDATE ON public.admin_task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_task_comments ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin or system_admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'system_admin')
  );
$$;

-- admin_tasks policies
DROP POLICY IF EXISTS admin_tasks_select ON public.admin_tasks;
CREATE POLICY admin_tasks_select ON public.admin_tasks
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS admin_tasks_insert ON public.admin_tasks;
CREATE POLICY admin_tasks_insert ON public.admin_tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_tasks_update ON public.admin_tasks;
CREATE POLICY admin_tasks_update ON public.admin_tasks
  FOR UPDATE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS admin_tasks_delete ON public.admin_tasks;
CREATE POLICY admin_tasks_delete ON public.admin_tasks
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- admin_task_comments policies
DROP POLICY IF EXISTS admin_task_comments_select ON public.admin_task_comments;
CREATE POLICY admin_task_comments_select ON public.admin_task_comments
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS admin_task_comments_insert ON public.admin_task_comments;
CREATE POLICY admin_task_comments_insert ON public.admin_task_comments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user() AND user_id = auth.uid());

DROP POLICY IF EXISTS admin_task_comments_update ON public.admin_task_comments;
CREATE POLICY admin_task_comments_update ON public.admin_task_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS admin_task_comments_delete ON public.admin_task_comments;
CREATE POLICY admin_task_comments_delete ON public.admin_task_comments
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() OR public.is_admin_user()
  );
