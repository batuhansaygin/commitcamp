do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'subscriptions'
  ) then
    alter table public.subscriptions
    add column if not exists trial_end timestamptz;

    create index if not exists idx_subscriptions_trial_end
    on public.subscriptions (trial_end)
    where status = 'trialing';
  end if;
end $$;
