-- Migration: 0002_create_products
-- Creates the `products` table (apps catalog) in the `website`
-- schema, the corresponding updated_at trigger and RLS policies.
--
-- The catalog is independent from the customer (the same rows are visible
-- to every visitor) and is managed exclusively via the service_role key
-- (and, in the future, an Admin Panel). For this reason there are no
-- INSERT/UPDATE/DELETE policies for client roles.

-- 1. Table -------------------------------------------------------------------

create table if not exists website.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  web_app_url text not null,
  status text not null default 'available'
    check (status in ('available', 'coming_soon', 'archived')),
  stripe_product_id text unique,
  stripe_price_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table website.products is
  'Catalog of apps offered by Acme Labs. One row per product; identical for every customer.';

-- 2. updated_at trigger ------------------------------------------------------

drop trigger if exists products_set_updated_at on website.products;

create trigger products_set_updated_at
  before update on website.products
  for each row
  execute function website.set_updated_at();

-- 3. Row Level Security ------------------------------------------------------

alter table website.products enable row level security;

-- Public read access: the catalog is shown on the public Products page.
drop policy if exists products_select_all on website.products;
create policy products_select_all
  on website.products
  for select
  to anon, authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policies are defined on purpose:
-- catalog management happens exclusively via service_role.
