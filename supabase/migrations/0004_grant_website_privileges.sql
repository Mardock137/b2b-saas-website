-- Migration: 0004_grant_website_privileges
-- Grants explicit privileges on the `website` schema to service_role,
-- authenticated and anon.
--
-- Background: the Supabase project was created with "Automatically expose
-- new tables" disabled, which is the secure default but also means that
-- schema/table-level GRANTs are NOT applied automatically. Without these
-- GRANTs, even the service_role client (which bypasses RLS) receives a
-- "permission denied for schema" error at the Postgres level, which is
-- enforced before RLS is evaluated.

-- Schema access -----------------------------------------------------------

grant usage on schema website to service_role, authenticated, anon;

-- service_role: full access to every table already created -----------------

grant all privileges on all tables in schema website to service_role;

-- authenticated: per-table privileges ---------------------------------------

grant select, insert, update on website.companies to authenticated;
grant select on website.products to authenticated;
grant select on website.subscriptions to authenticated;

-- anon: read-only access to the public product catalog ----------------------

grant select on website.products to anon;

-- Default privileges for tables/functions created by future migrations ------

alter default privileges in schema website
  grant all privileges on tables to service_role;

alter default privileges in schema website
  grant execute on functions to service_role, authenticated, anon;

grant execute on all functions in schema website to service_role, authenticated, anon;
