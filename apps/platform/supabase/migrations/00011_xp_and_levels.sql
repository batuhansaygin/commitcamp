-- ============================================================
-- Migration: XP & Levels System
-- Adds xp_points/level to profiles, xp_transactions table,
-- increment_xp function, and leaderboard RPC functions.
-- ============================================================

-- 1. Add XP and level columns to profiles
alter table public.profiles
  add column if not exists xp_points integer not null default 0,
  add column if not exists level     integer not null default 1;

-- 2. XP transactions table
create table if not exists public.xp_transactions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  amount     integer     not null,
  reason     text        not null check (reason in (
               'post_created', 'first_post', 'comment_added',
               'reaction_received', 'follower_gained'
             )),
  created_at timestamptz not null default now()
);

create index if not exists idx_xp_transactions_user_id
  on public.xp_transactions(user_id);

create index if not exists idx_xp_transactions_created_at
  on public.xp_transactions(user_id, created_at desc);

alter table public.xp_transactions enable row level security;

create policy "xp_transactions_select_own"
  on public.xp_transactions for select
  to authenticated
  using (user_id = auth.uid());

-- 3. increment_xp — atomically adds XP and recalculates level
--    SECURITY DEFINER so it can update any user's profile row.
create or replace function public.increment_xp(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.xp_transactions (user_id, amount, reason)
  values (p_user_id, p_amount, p_reason);

  update public.profiles
  set
    xp_points  = xp_points + p_amount,
    level      = floor(sqrt((xp_points + p_amount)::float / 100))::int + 1,
    updated_at = now()
  where id = p_user_id;
end;
$$;

-- 4. Leaderboard: all-time XP
create or replace function public.get_leaderboard_xp(
  p_limit int default 50
)
returns table (
  id           uuid,
  username     text,
  display_name text,
  avatar_url   text,
  level        int,
  xp_points    int
)
language sql
stable
security definer
set search_path = public
as $$
  select id, username, display_name, avatar_url, level, xp_points
  from public.profiles
  order by xp_points desc
  limit p_limit;
$$;

-- 5. Leaderboard: XP earned in a time window
create or replace function public.get_leaderboard_xp_period(
  p_since timestamptz,
  p_limit int default 50
)
returns table (
  id           uuid,
  username     text,
  display_name text,
  avatar_url   text,
  level        int,
  xp_points    int,
  period_score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp_points,
    coalesce(sum(xt.amount), 0) as period_score
  from public.profiles p
  left join public.xp_transactions xt
    on xt.user_id = p.id and xt.created_at >= p_since
  group by p.id, p.username, p.display_name, p.avatar_url, p.level, p.xp_points
  having coalesce(sum(xt.amount), 0) > 0
  order by period_score desc
  limit p_limit;
$$;

-- 6. Leaderboard: most posts in a time window
create or replace function public.get_leaderboard_posts(
  p_since timestamptz default '1970-01-01',
  p_limit int default 50
)
returns table (
  id           uuid,
  username     text,
  display_name text,
  avatar_url   text,
  level        int,
  xp_points    int,
  period_score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp_points,
    count(po.id) as period_score
  from public.profiles p
  left join public.posts po
    on po.user_id = p.id and po.created_at >= p_since
  group by p.id, p.username, p.display_name, p.avatar_url, p.level, p.xp_points
  having count(po.id) > 0
  order by period_score desc
  limit p_limit;
$$;

-- 7. Leaderboard: most reactions received on posts in a time window
create or replace function public.get_leaderboard_likes(
  p_since timestamptz default '1970-01-01',
  p_limit int default 50
)
returns table (
  id           uuid,
  username     text,
  display_name text,
  avatar_url   text,
  level        int,
  xp_points    int,
  period_score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp_points,
    count(r.user_id) as period_score
  from public.profiles p
  left join public.posts po on po.user_id = p.id
  left join public.reactions r
    on r.target_id = po.id
    and r.target_type = 'post'
    and r.created_at >= p_since
  group by p.id, p.username, p.display_name, p.avatar_url, p.level, p.xp_points
  having count(r.user_id) > 0
  order by period_score desc
  limit p_limit;
$$;
