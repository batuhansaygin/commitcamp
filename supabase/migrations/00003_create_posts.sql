-- ============================================================
-- Migration: Create posts table (forum / discussions)
-- ============================================================

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null,
  type        text not null default 'discussion'
              check (type in ('discussion', 'question', 'showcase')),
  tags        text[] not null default '{}',
  is_solved   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.posts enable row level security;

create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_type on public.posts(type);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_tags on public.posts using gin(tags);

-- Anyone can read posts
create policy "posts_select_public"
  on public.posts for select
  to authenticated, anon
  using (true);

-- Authenticated users can create posts
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own posts
create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own posts
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (user_id = auth.uid());

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.update_updated_at();
