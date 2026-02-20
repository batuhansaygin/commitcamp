-- Role permissions: stores admin-configurable toggles for user / moderator / admin roles.
-- system_admin is intentionally excluded — it is immutable and always has full access.

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- singleton row
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed the singleton row so it always exists
INSERT INTO public.role_permissions (id, permissions)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only system_admin can read / write
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );

CREATE POLICY "role_permissions_update" ON public.role_permissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'system_admin'
    )
  );
