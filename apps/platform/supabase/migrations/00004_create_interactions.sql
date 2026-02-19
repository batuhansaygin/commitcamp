-- ============================================================
-- Migration: Create comments, reactions, bookmarks
-- Social interaction tables.
-- ============================================================

-- ── Comments (polymorphic: snippet/post, threaded) ──

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('snippet', 'post')),
  target_id   uuid not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.comments enable row level security;

create index if not exists idx_comments_target on public.comments(target_type, target_id);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_comments_parent_id on public.comments(parent_id);

create policy "comments_select_public"
  on public.comments for select
  to authenticated, anon
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (user_id = auth.uid());

-- ── Reactions (polymorphic, composite PK) ──

create table if not exists public.reactions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('snippet', 'post', 'comment')),
  target_id   uuid not null,
  kind        text not null default 'like' check (kind in ('like', 'fire', 'rocket', 'heart')),
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

alter table public.reactions enable row level security;

create index if not exists idx_reactions_target on public.reactions(target_type, target_id);

create policy "reactions_select_public"
  on public.reactions for select
  to authenticated, anon
  using (true);

create policy "reactions_insert_own"
  on public.reactions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "reactions_delete_own"
  on public.reactions for delete
  to authenticated
  using (user_id = auth.uid());

-- ── Bookmarks (composite PK) ──

create table if not exists public.bookmarks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('snippet', 'post')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own"
  on public.bookmarks for select
  to authenticated
  using (user_id = auth.uid());

create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  to authenticated
  using (user_id = auth.uid());
