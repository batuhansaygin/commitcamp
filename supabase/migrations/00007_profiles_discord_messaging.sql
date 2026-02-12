-- ============================================================
-- Migration: Add Discord messaging fields to profiles
-- ============================================================

alter table public.profiles
  add column if not exists allow_private_messages boolean not null default false,
  add column if not exists discord_user_id text,
  add column if not exists discord_username text;

comment on column public.profiles.allow_private_messages is 'User allows others to message them via Discord';
comment on column public.profiles.discord_user_id is 'Discord snowflake ID after OAuth link';
comment on column public.profiles.discord_username is 'Discord global_name or username';

create index if not exists idx_profiles_discord_user_id on public.profiles(discord_user_id) where discord_user_id is not null;
