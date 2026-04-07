-- Speeds up daily per-tool usage counts (checkLimit).
-- Table is created in 00036; skip if migrations are applied out of order.
do $migration$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'usage_tracking'
  ) then
    execute $sql$
      create index if not exists idx_usage_tracking_user_tool_created
        on public.usage_tracking (user_id, tool, created_at desc)
    $sql$;
  end if;
end
$migration$;
