-- ============================================================
-- Migration: Link posts.user_id to profiles for Supabase join
-- PostgREST needs this FK to expose the "profiles" relation on posts.
-- ============================================================

alter table public.posts
  add constraint posts_user_id_profiles_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;
