-- Migration: 0003_create_subscriptions
-- Creates the `subscriptions` table in the `website` schema, linking
-- companies to products, with the unique constraint, supporting indexes,
-- RLS policies and updated_at trigger.
--
-- Subscriptions are created/updated exclusively by the Stripe webhook
-- using the service_role key.

-- 1. Table -------------------------------------------------------------------

create table if not exists website.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references website.companies (id) on delete cascade,
  product_id uuid not null references website.products (id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_company_product_unique
    unique (company_id, product_id)
);

comment on table website.subscriptions is
  'Active subscriptions of a company to a product. One row per (company, product) pair.';

comment on column website.subscriptions.stripe_customer_id is
  'Historical copy of the Stripe Customer ID at purchase time, kept for audit only. The app reads website.companies.stripe_customer_id for billing.';

-- 2. Indexes -----------------------------------------------------------------

create index if not exists subscriptions_company_id_idx
  on website.subscriptions (company_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on website.subscriptions (stripe_customer_id);

-- 3. updated_at trigger ------------------------------------------------------

drop trigger if exists subscriptions_set_updated_at on website.subscriptions;

create trigger subscriptions_set_updated_at
  before update on website.subscriptions
  for each row
  execute function website.set_updated_at();

-- 4. Row Level Security ------------------------------------------------------

alter table website.subscriptions enable row level security;

-- Each company can read only its own subscriptions.
drop policy if exists subscriptions_select_own on website.subscriptions;
create policy subscriptions_select_own
  on website.subscriptions
  for select
  to authenticated
  using (company_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies are defined on purpose:
-- subscription lifecycle is managed exclusively by service_role
-- (Stripe webhook).
