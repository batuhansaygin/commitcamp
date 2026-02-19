-- ============================================================
-- Migration: Realtime for posts/snippets + notifications table
-- ============================================================

-- Enable Realtime for feed tables (so new posts/snippets appear live)
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.snippets;

-- Notifications table (for in-app live badge: new comment, follow, etc.)
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read_at on public.notifications(user_id, read_at) where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_insert_service"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime for notifications
alter publication supabase_realtime add table public.notifications;
