-- ============================================================
-- Migration: Tool history for logged-in users
-- Saves tool usage when "Save" switch is on
-- ============================================================

create table if not exists public.tool_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null,
  summary text,
  created_at timestamptz not null default now()
);

alter table public.tool_history enable row level security;

create index if not exists idx_tool_history_user_created
  on public.tool_history(user_id, created_at desc);

-- RLS: users can only access their own history
create policy "tool_history_select_own"
  on public.tool_history for select
  to authenticated
  using (user_id = auth.uid());

create policy "tool_history_insert_own"
  on public.tool_history for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "tool_history_delete_own"
  on public.tool_history for delete
  to authenticated
  using (user_id = auth.uid());
