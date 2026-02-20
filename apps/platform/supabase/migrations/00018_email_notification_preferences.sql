-- ============================================================
-- Migration: Add email_notification_preferences to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notification_preferences jsonb NOT NULL DEFAULT
    '{"likes": true, "comments": true, "follows": true, "level_up": true}'::jsonb;
