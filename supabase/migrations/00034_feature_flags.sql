-- Monetization feature flags
insert into public.platform_settings (key, value, description, category)
values
  ('ai_tools_enabled', 'true'::jsonb, 'AI tools enabled/disabled', 'features'),
  ('marketplace_enabled', 'false'::jsonb, 'Marketplace enabled/disabled', 'features'),
  ('stripe_enabled', 'false'::jsonb, 'Stripe billing enabled/disabled', 'features')
on conflict (key) do nothing;
