-- Migration: 0005_seed_frontline
-- Seeds the catalog with the first product, Frontline, with placeholder
-- Stripe references and its monthly price. Idempotent: re-running the
-- migration will not duplicate or overwrite the row.

insert into website.products (
  slug,
  name,
  description,
  monthly_price_cents,
  currency,
  web_app_url,
  status,
  stripe_product_id,
  stripe_price_id
)
values (
  'frontline',
  'Frontline',
  'Multi-tenant customer support platform. Each company manages its own setup through a dedicated admin dashboard.',
  10000,
  'EUR',
  'https://frontline.example.com',
  'available',
  'prod_EXAMPLE',
  'price_EXAMPLE'
)
on conflict (slug) do nothing;
