-- Migration: 0008_add_tax_id_review_flag
-- Checkout now collects a tax ID on Stripe. When Stripe marks that number
-- unverified or unavailable, the company is flagged for a manual check.
--
-- Existing rows stay unflagged (default false). No backfill.
-- authenticated still updates company_name only (migration 0007). These
-- columns are written by the service_role webhook handler.

-- 1. Columns --------------------------------------------------------------

alter table website.companies
  add column if not exists tax_id_needs_review boolean not null default false;

alter table website.companies
  add column if not exists tax_id_review_reason text;

alter table website.companies
  add column if not exists tax_id_review_flagged_at timestamptz;

alter table website.companies
  drop constraint if exists companies_tax_id_review_reason_value;

alter table website.companies
  add constraint companies_tax_id_review_reason_value
  check (
    tax_id_review_reason is null
    or tax_id_review_reason in ('stripe_unverified', 'stripe_unavailable')
  );

comment on column website.companies.tax_id_needs_review is
  'True when Stripe reported the checkout tax ID as unverified or unavailable and a person still has to check it.';

comment on column website.companies.tax_id_review_reason is
  'Why the company was flagged: stripe_unverified or stripe_unavailable. Null when not flagged.';

comment on column website.companies.tax_id_review_flagged_at is
  'When the company was last flagged for a tax ID review. Null when not flagged.';
