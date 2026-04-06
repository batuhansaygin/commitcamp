with seller as (
  select id
  from public.profiles
  where role in ('system_admin', 'admin')
  order by created_at asc
  limit 1
)
insert into public.products (
  seller_id,
  title,
  slug,
  description,
  long_description,
  price_cents,
  currency,
  type,
  is_published,
  is_featured,
  is_official,
  tags
)
select
  seller.id,
  p.title,
  p.slug,
  p.description,
  p.long_description,
  p.price_cents,
  'usd',
  p.type::text,
  true,
  true,
  true,
  p.tags::text[]
from seller
cross join (
  values
    ('TypeScript Complete Cheat Sheet', 'typescript-complete-cheat-sheet', 'Practical TypeScript patterns, utilities, and typing recipes.', 'A curated cheat sheet for day-to-day TypeScript engineering with examples and anti-pattern notes.', 900, 'cheatsheet', array['typescript','cheatsheet','productivity']),
    ('Next.js SaaS Starter Kit', 'nextjs-saas-starter-kit', 'Production-ready Next.js SaaS starter with auth, billing, and dashboard shell.', 'Starter architecture for launching SaaS projects quickly with clean folder structure and reusable modules.', 4900, 'template', array['nextjs','saas','starter']),
    ('System Design Interview Guide', 'system-design-interview-guide', 'Interview-focused guide for scalable architecture discussions.', 'Frameworks, tradeoffs, and mock scenarios for common interview prompts with practical answer structures.', 1900, 'course', array['system-design','interview']),
    ('DevOps and Docker Cheat Sheet', 'devops-docker-cheat-sheet', 'Commands and workflows for Docker and deployment basics.', 'Quick-reference material for daily DevOps tasks: Dockerfiles, compose, CI/CD essentials, and debugging.', 900, 'cheatsheet', array['devops','docker','cheatsheet']),
    ('Algorithm Patterns Pack', 'algorithm-patterns-pack', '50 reusable algorithm patterns with implementation notes.', 'Pattern-oriented breakdown for common coding interview categories with complexity analysis and examples.', 1400, 'snippet_pack', array['algorithms','interview','snippets'])
) as p(title, slug, description, long_description, price_cents, type, tags)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  price_cents = excluded.price_cents,
  type = excluded.type,
  is_published = true,
  is_featured = true,
  is_official = true,
  tags = excluded.tags,
  updated_at = now();
