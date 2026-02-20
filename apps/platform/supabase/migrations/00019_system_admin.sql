-- ─────────────────────────────────────────────────────────────────────────────
-- 00019_system_admin.sql
-- Adds system_admin role, ban columns, platform_settings, admin_audit_logs.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend profiles role enum ─────────────────────────────────────────────

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'moderator', 'admin', 'system_admin'));

-- ── 2. Ban columns on profiles ───────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned       boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason      text,
  ADD COLUMN IF NOT EXISTS banned_until    timestamptz,
  ADD COLUMN IF NOT EXISTS banned_by       uuid        REFERENCES auth.users(id);

-- ── 3. platform_settings ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         text        PRIMARY KEY,
  value       jsonb       NOT NULL,
  description text,
  category    text        NOT NULL DEFAULT 'general'
              CHECK (category IN ('auth', 'features', 'content', 'rate_limits', 'maintenance')),
  updated_by  uuid        REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only system_admins and admins can read settings
CREATE POLICY "platform_settings_select_admin"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'system_admin')
    )
  );

-- Only system_admins can write settings
CREATE POLICY "platform_settings_write_system_admin"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'system_admin'
    )
  );

-- ── 4. Seed default platform settings ────────────────────────────────────────

INSERT INTO public.platform_settings (key, value, description, category) VALUES
  -- Auth
  ('allow_signup',              'true',  'Allow new user registrations',                        'auth'),
  ('require_email_verification','true',  'Require email verification on signup',                'auth'),
  ('manual_linking_enabled',    'true',  'Allow users to manually link OAuth accounts',         'auth'),
  ('oauth_github_enabled',      'true',  'Enable GitHub OAuth login',                           'auth'),
  ('oauth_google_enabled',      'true',  'Enable Google OAuth login',                           'auth'),
  ('oauth_discord_enabled',     'true',  'Enable Discord OAuth login',                          'auth'),
  -- Features
  ('forum_enabled',             'true',  'Enable the forum feature',                            'features'),
  ('snippets_enabled',          'true',  'Enable code snippets feature',                        'features'),
  ('challenges_enabled',        'true',  'Enable coding challenges',                            'features'),
  ('leaderboard_enabled',       'true',  'Enable the leaderboard',                              'features'),
  ('ai_assistant_enabled',      'true',  'Enable AI assistant',                                 'features'),
  ('achievements_enabled',      'true',  'Enable the achievements system',                      'features'),
  -- Content
  ('post_moderation_enabled',   'false', 'Require admin approval before posts go live',         'content'),
  ('snippet_moderation_enabled','false', 'Require admin approval before snippets go live',      'content'),
  ('max_bio_length',            '500',   'Maximum character length for user bios',              'content'),
  ('max_post_length',           '50000', 'Maximum character length for forum posts',            'content'),
  -- Rate limits
  ('max_posts_per_day',         '20',    'Maximum forum posts per user per day',                'rate_limits'),
  ('max_snippets_per_day',      '30',    'Maximum snippets per user per day',                   'rate_limits'),
  ('max_comments_per_day',      '100',   'Maximum comments per user per day',                   'rate_limits'),
  -- Maintenance
  ('maintenance_mode',          'false', 'Show maintenance page to all non-admins',             'maintenance'),
  ('announcement_banner',       'null',  'Site-wide announcement banner (null = hidden)',       'maintenance')
ON CONFLICT (key) DO NOTHING;

-- ── 5. auto-update updated_at on platform_settings ───────────────────────────

CREATE OR REPLACE FUNCTION public.update_platform_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_settings_updated_at();

-- ── 6. admin_audit_logs ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid        NOT NULL REFERENCES auth.users(id),
  action      text        NOT NULL,
  target_type text,
  target_id   text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id   ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and system_admins can read audit logs
CREATE POLICY "audit_logs_select_admin"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'system_admin')
    )
  );

-- Service role (server actions) inserts logs
CREATE POLICY "audit_logs_insert_service"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- ── 7. Helper: check if caller is admin/system_admin ─────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'system_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'system_admin'
  );
$$;
