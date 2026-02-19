-- ============================================================
-- Migration: Notifications v2
-- Drops the old flat notifications table and replaces it with
-- a richer schema that supports actor, post/comment references,
-- is_read boolean, and structured notification types.
-- ============================================================

-- Remove old table (also auto-removes it from the realtime publication)
drop table if exists public.notifications cascade;

-- Notification type enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum ('like', 'comment', 'follow', 'level_up');
  end if;
end;
$$;

-- New notifications table
create table public.notifications (
  id          uuid                primary key default gen_random_uuid(),
  user_id     uuid                not null references public.profiles(id)  on delete cascade,
  actor_id    uuid                         references public.profiles(id)  on delete cascade,
  type        notification_type   not null,
  post_id     uuid                         references public.posts(id)     on delete cascade,
  comment_id  uuid                         references public.comments(id)  on delete cascade,
  message     text                not null,
  is_read     boolean             not null default false,
  created_at  timestamptz         not null default now()
);

create index idx_notifications_user_id
  on public.notifications(user_id, created_at desc);

create index idx_notifications_user_unread
  on public.notifications(user_id)
  where is_read = false;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notifications_insert_auth"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

-- Re-enable Realtime (was removed when we dropped the old table)
alter publication supabase_realtime add table public.notifications;
