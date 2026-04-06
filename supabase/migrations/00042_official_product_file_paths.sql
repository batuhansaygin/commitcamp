-- Canonical storage paths under bucket `product-files` (upload via scripts/upload-official-marketplace-files.mjs after deploy).
update public.products p
set
  file_path = v.path,
  updated_at = now()
from (
  values
    ('typescript-complete-cheat-sheet', 'official/typescript-complete-cheat-sheet/cheatsheet.md'),
    ('nextjs-saas-starter-kit', 'official/nextjs-saas-starter-kit/starter.zip'),
    ('system-design-interview-guide', 'official/system-design-interview-guide/guide.md'),
    ('devops-docker-cheat-sheet', 'official/devops-docker-cheat-sheet/cheatsheet.md'),
    ('algorithm-patterns-pack', 'official/algorithm-patterns-pack/patterns.md')
) as v(slug, path)
where p.slug = v.slug;
