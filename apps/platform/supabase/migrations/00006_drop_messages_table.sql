-- ============================================================
-- Migration: Drop messages table (messaging moved to Stream Chat)
-- ============================================================

drop policy if exists "messages_select_own" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_update_read" on public.messages;

drop table if exists public.messages;
