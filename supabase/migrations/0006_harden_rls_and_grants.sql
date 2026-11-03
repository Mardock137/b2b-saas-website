-- Migration: 0006_harden_rls_and_grants
-- Hardening deciso durante il refactoring di sicurezza (Blocco 3):
-- 1. companies: nessun client deve poter aggiornare le colonne tecniche
--    Stripe tramite il client autenticato — solo company_name e tax_id
--    sono modificabili dall'azienda stessa. Postgres non supporta
--    restrizioni per-colonna dentro una singola policy RLS "with check";
--    la strada corretta è il GRANT per-colonna.
-- 2. products: anon (visitatori non loggati sul sito pubblico) non deve
--    vedere le righe con status = 'archived' (evita di esporre
--    stripe_product_id/stripe_price_id di prodotti ritirati dal
--    catalogo). authenticated resta invariato: un'azienda con un
--    abbonamento storico a un prodotto ormai archiviato deve poter
--    ancora risolvere il join subscriptions -> products nella dashboard.
-- 3. GRANT EXECUTE di default: la migration 0004 concedeva EXECUTE su
--    tutte le funzioni presenti e future dello schema a service_role,
--    authenticated e anon. Nessuna funzione oggi ne ha bisogno da
--    client; si restringe a service_role per evitare che una futura
--    funzione SECURITY DEFINER finisca eseguibile da anon per errore.

-- 1. companies: restrizione UPDATE per colonna --------------------------------

revoke update on website.companies from authenticated;
grant update (company_name, tax_id) on website.companies to authenticated;

-- 2. products: anon non vede i prodotti archiviati ----------------------------

drop policy if exists products_select_all on website.products;

create policy products_select_public
  on website.products
  for select
  to anon
  using (status <> 'archived');

create policy products_select_authenticated
  on website.products
  for select
  to authenticated
  using (true);

-- 3. EXECUTE di default ristretto a service_role ------------------------------

revoke execute on all functions in schema website from authenticated, anon;

alter default privileges in schema website
  revoke execute on functions from authenticated, anon;

alter default privileges in schema website
  grant execute on functions to service_role;
