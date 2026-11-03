-- Migration: 0007_add_tax_id_country
-- Signup now records which country a tax ID belongs to and how it was
-- checked (VIES for EU VAT numbers, format only otherwise).
--
-- Existing rows stay null: there is no backfill.
--
-- The authenticated role could previously UPDATE tax_id, which let a
-- signed-in company replace the number after signup and skip the checks.
-- No client code updates tax_id (only the service_role insert at signup
-- writes it), so the column grant is reduced to company_name.

-- 1. Columns --------------------------------------------------------------

alter table website.companies
  add column if not exists tax_id_country text;

alter table website.companies
  add column if not exists tax_id_verification text;

alter table website.companies
  drop constraint if exists companies_tax_id_country_format;

alter table website.companies
  add constraint companies_tax_id_country_format
  check (tax_id_country is null or tax_id_country ~ '^[A-Z]{2}$');

alter table website.companies
  drop constraint if exists companies_tax_id_verification_value;

alter table website.companies
  add constraint companies_tax_id_verification_value
  check (
    tax_id_verification is null
    or tax_id_verification in ('vies_verified', 'format_only')
  );

comment on column website.companies.tax_id_country is
  'ISO 3166-1 alpha-2 country of the tax ID, captured at signup. Null for accounts created before this column existed.';

comment on column website.companies.tax_id_verification is
  'How the tax ID was checked at signup: vies_verified (EU VIES) or format_only. Null for accounts created before this column existed.';

-- 2. companies: authenticated may update the company name only ----------

revoke update on website.companies from authenticated;
grant update (company_name) on website.companies to authenticated;
