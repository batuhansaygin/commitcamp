-- ============================================================
-- Migration: Create follows and messages tables
-- ============================================================

-- ── Follows (composite PK, self-follow check) ──

create table if not exists public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

alter table public.follows enable row level security;

create index if not exists idx_follows_following on public.follows(following_id);

-- Anyone can see follow relationships
create policy "follows_select_public"
  on public.follows for select
  to authenticated
  using (true);

-- Users can follow others
create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

-- Users can unfollow
create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

-- ── Messages (DM) ──

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create index if not exists idx_messages_sender on public.messages(sender_id, created_at desc);
create index if not exists idx_messages_receiver on public.messages(receiver_id, created_at desc);

-- Users can only see their own messages (sent or received)
create policy "messages_select_own"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Users can send messages
create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

-- Receiver can mark as read (update read_at)
create policy "messages_update_read"
  on public.messages for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());
