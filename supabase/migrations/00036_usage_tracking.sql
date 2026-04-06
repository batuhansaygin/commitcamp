create table if not exists public.usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  tokens_used integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_tracking_user_date
  on public.usage_tracking (user_id, created_at);

create index if not exists idx_usage_tracking_tool
  on public.usage_tracking (tool);

alter table public.usage_tracking enable row level security;

drop policy if exists "Users read own usage" on public.usage_tracking;
create policy "Users read own usage"
on public.usage_tracking for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Service role full access" on public.usage_tracking;
create policy "Service role full access"
on public.usage_tracking for all
to service_role
using (true)
with check (true);
