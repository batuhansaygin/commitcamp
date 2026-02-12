-- ============================================================
-- Migration: Create profiles table
-- Extends auth.users with application-specific user data.
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  bio          text,
  avatar_url   text,
  role         text not null default 'user'
               check (role in ('user', 'moderator', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Indexes
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_role on public.profiles(role);

-- ── RLS Policies ──

-- Anyone can read public profiles
create policy "profiles_select_public"
  on public.profiles for select
  to authenticated, anon
  using (true);

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Only the trigger inserts profiles (via service role)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ── Auto-sync trigger: auth.users → profiles ──

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _username text;
  _display_name text;
  _avatar_url text;
  _role text;
begin
  -- Derive username from email (before @), ensure uniqueness
  _username := split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4);
  _display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  _avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  _role := case
    when (new.raw_user_meta_data ->> 'is_admin')::boolean = true then 'admin'
    when new.raw_user_meta_data ->> 'role' is not null then new.raw_user_meta_data ->> 'role'
    else 'user'
  end;

  insert into public.profiles (id, username, display_name, avatar_url, role)
  values (new.id, _username, _display_name, _avatar_url, _role)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── Auto-update updated_at ──

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();
