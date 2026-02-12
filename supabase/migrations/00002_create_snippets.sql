-- ============================================================
-- Migration: Create snippets table (code sharing)
-- ============================================================

create table if not exists public.snippets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  language    text not null,
  code        text not null,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.snippets enable row level security;

create index if not exists idx_snippets_user_id on public.snippets(user_id);
create index if not exists idx_snippets_language on public.snippets(language);
create index if not exists idx_snippets_created_at on public.snippets(created_at desc);

-- Anyone can read public snippets
create policy "snippets_select_public"
  on public.snippets for select
  to authenticated, anon
  using (is_public = true or user_id = auth.uid());

-- Users can insert their own snippets
create policy "snippets_insert_own"
  on public.snippets for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own snippets
create policy "snippets_update_own"
  on public.snippets for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own snippets
create policy "snippets_delete_own"
  on public.snippets for delete
  to authenticated
  using (user_id = auth.uid());

-- Auto-update updated_at
drop trigger if exists snippets_updated_at on public.snippets;
create trigger snippets_updated_at
  before update on public.snippets
  for each row
  execute function public.update_updated_at();
