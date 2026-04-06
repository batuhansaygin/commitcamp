create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text,
  long_description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  type text not null check (type in ('template', 'cheatsheet', 'course', 'snippet_pack', 'tool')),
  file_path text,
  preview_url text,
  thumbnail_url text,
  tags text[] default '{}',
  is_published boolean default false,
  is_featured boolean default false,
  is_official boolean default false,
  download_count integer default 0,
  rating_avg numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  amount_cents integer not null,
  commission_cents integer not null default 0,
  seller_payout_cents integer not null default 0,
  stripe_payment_id text,
  status text not null default 'completed' check (status in ('completed', 'refunded', 'disputed')),
  created_at timestamptz not null default now(),
  unique(buyer_id, product_id)
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(product_id, reviewer_id)
);

alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.product_reviews enable row level security;

drop policy if exists "Anyone reads published products" on public.products;
create policy "Anyone reads published products"
on public.products for select
to public
using (is_published = true);

drop policy if exists "Sellers read own products" on public.products;
create policy "Sellers read own products"
on public.products for select
to authenticated
using (auth.uid() = seller_id);

drop policy if exists "Sellers insert own products" on public.products;
create policy "Sellers insert own products"
on public.products for insert
to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Sellers update own products" on public.products;
create policy "Sellers update own products"
on public.products for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Service role full access on products" on public.products;
create policy "Service role full access on products"
on public.products for all
to service_role
using (true)
with check (true);

drop policy if exists "Users read own purchases" on public.purchases;
create policy "Users read own purchases"
on public.purchases for select
to authenticated
using (auth.uid() = buyer_id);

drop policy if exists "Sellers read own sales" on public.purchases;
create policy "Sellers read own sales"
on public.purchases for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = purchases.product_id
      and p.seller_id = auth.uid()
  )
);

drop policy if exists "Service role full access on purchases" on public.purchases;
create policy "Service role full access on purchases"
on public.purchases for all
to service_role
using (true)
with check (true);

drop policy if exists "Anyone reads reviews" on public.product_reviews;
create policy "Anyone reads reviews"
on public.product_reviews for select
to public
using (true);

drop policy if exists "Buyers write reviews" on public.product_reviews;
create policy "Buyers write reviews"
on public.product_reviews for insert
to authenticated
with check (
  auth.uid() = reviewer_id
  and exists (
    select 1
    from public.purchases pu
    where pu.product_id = product_reviews.product_id
      and pu.buyer_id = auth.uid()
      and pu.status = 'completed'
  )
);

drop policy if exists "Service role full access on reviews" on public.product_reviews;
create policy "Service role full access on reviews"
on public.product_reviews for all
to service_role
using (true)
with check (true);
