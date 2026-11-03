-- Migration: 0001_create_companies
-- Creates the dedicated `website` schema, the `set_updated_at` trigger
-- function, the `companies` table linked to Supabase Auth users, and the
-- RLS policies that enforce per-tenant isolation.
--
-- Background: the Supabase project hosts multiple products, each
-- living in its own Postgres schema (e.g. `frontline`). The website's
-- tables live in the `website` schema, keeping `public` empty.

-- 1. Schema ---------------------------------------------------------------

create schema if not exists website;

-- 2. updated_at trigger function ------------------------------------------

create or replace function website.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Table -----------------------------------------------------------------

create table if not exists website.companies (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null,
  tax_id text not null,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table website.companies is
  'Customer company profile. One row per Supabase Auth user; the primary key matches auth.users.id.';

comment on column website.companies.stripe_customer_id is
  'Stripe Customer ID shared by every app subscribed by this company. Source of truth for billing.';

drop trigger if exists companies_set_updated_at on website.companies;

create trigger companies_set_updated_at
  before update on website.companies
  for each row
  execute function website.set_updated_at();

-- 4. Row Level Security ------------------------------------------------------

alter table website.companies enable row level security;

drop policy if exists companies_select_own on website.companies;
create policy companies_select_own
  on website.companies
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists companies_insert_own on website.companies;
create policy companies_insert_own
  on website.companies
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists companies_update_own on website.companies;
create policy companies_update_own
  on website.companies
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No DELETE policy is defined on purpose:
-- deletions happen via cascade from auth.users or from server-side
-- operations using the service_role key (which bypasses RLS).
