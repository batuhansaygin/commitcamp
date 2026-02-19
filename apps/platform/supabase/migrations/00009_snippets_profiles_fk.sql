-- ============================================================
-- Migration: Link snippets.user_id to profiles for Supabase join
-- Fixes getSnippetById 404 when selecting with profiles relation.
-- ============================================================

alter table public.snippets
  add constraint snippets_user_id_profiles_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;
