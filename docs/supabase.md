# Supabase

Documentazione del progetto Supabase utilizzato dal sito Acme Labs: database PostgreSQL e autenticazione utenti.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Come funziona](#️-come-funziona)
- [🔧 Configurazione](#-configurazione)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Supabase funge da database e sistema di autenticazione per il sito Acme Labs. Gestisce la registrazione e il login delle aziende clienti, i dati degli abbonamenti e i prodotti acquistati.

### Un'unica organizzazione, un progetto per ambiente, uno schema per prodotto

Per tenere i dati di test isolati da quelli reali esistono **due progetti Supabase distinti** (uno per ambiente), entrambi nella stessa organizzazione:

| Progetto  | Ambienti che lo usano                        | Contenuto        |
|-----------|----------------------------------------------|------------------|
| `staging` | Staging (branch `staging`) + sviluppo locale | Dati di test.    |
| `prod`    | Produzione (branch `main`)                   | Solo dati reali. |

A differenza dell'assetto iniziale, ogni progetto Supabase è **condiviso tra più prodotti** (il sito, Frontline, futuri prodotti): ognuno vive in un proprio **schema Postgres dedicato** all'interno dello stesso database, invece che in un progetto separato. Le tabelle del sito vivono nello schema **`website`**, quelle di Frontline nello schema **`frontline`**; lo schema `public` resta vuoto. Questo permette, in futuro, di collegare i dati tra prodotti con semplici foreign key cross-schema (es. una `companies` condivisa), cosa impossibile quando i prodotti vivevano su progetti Supabase distinti.

- **Region:** Europa — eu-west-1 (Irlanda) per entrambi.
- **Piano:** Free per entrambi.
- **Dashboard:** [supabase.com](https://supabase.com) → seleziona il progetto corrispondente.

Il collegamento di ciascun ambiente al progetto giusto avviene tramite le variabili d'ambiente su Vercel (scope `Production` vs `Preview`); vedi [`docs/deploy.md`](deploy.md). Il client Supabase del sito ([`src/lib/supabase/`](../src/lib/supabase/)) punta esplicitamente allo schema `website` tramite l'opzione `db: { schema: "website" }`, passata a ogni `createClient`/`createServerClient`.

---

## ⚙️ Come funziona

### Client nel codice

Il progetto utilizza due client Supabase separati, più l'helper del proxy per il refresh sessione. Questa separazione è richiesta da Next.js App Router, che esegue codice sia nel browser che nel server. Tutti e due i client (più l'helper del proxy) passano l'opzione `db: { schema: "website" }` in fase di creazione, così ogni query (`.from("companies")`, ecc.) viene automaticamente indirizzata allo schema `website` invece che a `public`.

| File                         | Contesto              | Descrizione                                                                                                                                                                               |
|------------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/lib/supabase/server.ts` | Server                | Usato nelle API Routes e nei Server Components. Gestisce i cookie di sessione lato server                                                                                                 |
| `src/lib/supabase/admin.ts`  | Server (privilegiato) | Usa la `SUPABASE_SERVICE_ROLE_KEY`, bypassa RLS. Marcato `import "server-only"`, usato esclusivamente per operazioni admin (es. cleanup utente Auth se l'INSERT su `companies` fallisce). |

### Schema database

Tutte le tabelle del sito vivono nello schema dedicato **`website`** (non `public`, condiviso con altri prodotti nello stesso progetto Supabase — vedi sezione precedente):

| Tabella         | Descrizione                                                                         |
|-----------------|-------------------------------------------------------------------------------------|
| `companies`     | Aziende registrate: collegate ad `auth.users`, ragione sociale e tax ID.            |
| `products`      | Catalogo delle app in vendita: slug, nome, descrizione, prezzo, URL web app, stato. |
| `subscriptions` | Abbonamenti azienda↔prodotto: stato, periodo corrente, riferimento Stripe.          |

#### Tabella `companies`

Definita nella migration [`supabase/migrations/0001_create_companies.sql`](../supabase/migrations/0001_create_companies.sql), che crea anche lo schema `website` e la funzione trigger `website.set_updated_at()`.

| Colonna                   | Tipo          | Vincoli                                              | Descrizione                                                                                                                                                                                          |
|---------------------------|---------------|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                      | `uuid`        | PK, FK → `auth.users(id)` `on delete cascade`        | Coincide con l'ID utente Supabase Auth.                                                                                                                                                              |
| `company_name`            | `text`        | not null                                             | Ragione sociale dell'azienda.                                                                                                                                                                        |
| `tax_id`                  | `text`        | not null                                             | Identificativo fiscale normalizzato (maiuscolo, senza spazi né prefisso paese). Il formato dipende dal paese scelto in registrazione.                                                                |
| `tax_id_country`          | `text`        | nullable, check 2 lettere maiuscole                  | Paese ISO del tax ID, scelto in registrazione (migration [`0007_add_tax_id_country.sql`](../supabase/migrations/0007_add_tax_id_country.sql)). `null` sulle righe precedenti.                        |
| `tax_id_verification`     | `text`        | nullable, `vies_verified` o `format_only`            | Come è stato controllato il numero in registrazione: VIES (paesi UE e Irlanda del Nord `XI`) oppure solo formato. `null` sulle righe precedenti.                                                     |
| `tax_id_needs_review`     | `boolean`     | not null, default `false`                            | Vero quando Stripe ha segnato il tax ID del checkout come non verificato o non verificabile (migration [`0008_add_tax_id_review_flag.sql`](../supabase/migrations/0008_add_tax_id_review_flag.sql)). |
| `tax_id_review_reason`    | `text`        | nullable, `stripe_unverified` o `stripe_unavailable` | Motivo del flag. `null` se l'azienda non è da controllare.                                                                                                                                           |
| `tax_id_review_flagged_at`| `timestamptz` | nullable                                             | Momento in cui l'azienda è stata segnata da controllare.                                                                                                                                             |
| `stripe_customer_id`      | `text`        | nullable, unique                                     | ID del Customer Stripe **unico e condiviso** da tutti le app dell'azienda (es. `cus_…`) — fonte di verità per il billing (vedi sezione "Integrazione Stripe").                                       |
| `created_at`              | `timestamptz` | not null, default `now()`                            | Timestamp di creazione.                                                                                                                                                                              |
| `updated_at`              | `timestamptz` | not null, default `now()`, aggiornato dal trigger    | Aggiornato automaticamente ad ogni `UPDATE`.                                                                                                                                                         |

Trigger:

- `companies_set_updated_at` — funzione `website.set_updated_at()` chiamata `before update` per riportare `updated_at = now()`.

#### Tabella `products`

Definita nella migration [`supabase/migrations/0002_create_products.sql`](../supabase/migrations/0002_create_products.sql). Catalogo pubblico, identico per tutti i clienti, gestito esclusivamente via `service_role`.

| Colonna               | Tipo          | Vincoli                                                                                  | Descrizione                                                                          |
|-----------------------|---------------|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| `id`                  | `uuid`        | PK, default `gen_random_uuid()`                                                          | Identificatore interno.                                                              |
| `slug`                | `text`        | not null, unique                                                                         | Slug stabile leggibile (es. `frontline`).                                            |
| `name`                | `text`        | not null                                                                                 | Nome commerciale del prodotto.                                                       |
| `description`         | `text`        | not null                                                                                 | Descrizione breve mostrata sul sito.                                                 |
| `monthly_price_cents` | `integer`     | not null, check `>= 0`                                                                   | Prezzo mensile in centesimi (best practice anti floating-point).                     |
| `currency`            | `text`        | not null, default `'EUR'`, check ISO 4217 (3 lettere maiuscole)                          | Valuta del prezzo.                                                                   |
| `web_app_url`         | `text`        | not null                                                                                 | URL fisso della web app del prodotto, uguale per tutti i clienti che lo acquistano.  |
| `status`              | `text`        | not null, default `'available'`, check in (`available`, `coming_soon`, `archived`)       | Stato di vendita del prodotto.                                                       |
| `stripe_product_id`   | `text`        | nullable, unique                                                                         | ID dell'oggetto Product su Stripe (es. `prod_…`).                                    |
| `stripe_price_id`     | `text`        | nullable, unique                                                                         | ID del Price ricorrente mensile su Stripe (es. `price_…`).                           |
| `created_at`          | `timestamptz` | not null, default `now()`                                                                | Timestamp di creazione.                                                              |
| `updated_at`          | `timestamptz` | not null, default `now()`, aggiornato dal trigger                                        | Aggiornato automaticamente ad ogni `UPDATE`.                                         |

Trigger:

- `products_set_updated_at` — riusa `website.set_updated_at()`.

Il seed iniziale (riga `frontline`, con ID Stripe segnaposto e prezzo mensile di 100 EUR) è applicato dalla migration [`0005_seed_frontline.sql`](../supabase/migrations/0005_seed_frontline.sql), idempotente grazie a `on conflict (slug) do nothing`.

> ⚠️ Gli ID Stripe del seed sono segnaposto (`prod_EXAMPLE`, `price_EXAMPLE`) e vanno sostituiti con quelli reali dell'account Stripe usato, altrimenti il checkout in produzione fallisce pur avendo le chiavi live corrette.

#### Tabella `subscriptions`

Definita nella migration [`supabase/migrations/0003_create_subscriptions.sql`](../supabase/migrations/0003_create_subscriptions.sql). Rappresenta l'abbonamento di un'azienda a un prodotto.

| Colonna                  | Tipo          | Vincoli                                                                                 | Descrizione                                                                            |
|--------------------------|---------------|-----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `id`                     | `uuid`        | PK, default `gen_random_uuid()`                                                         | Identificatore interno.                                                                |
| `company_id`             | `uuid`        | not null, FK → `website.companies(id)` `on delete cascade`                              | Azienda titolare dell'abbonamento.                                                     |
| `product_id`             | `uuid`        | not null, FK → `website.products(id)` `on delete restrict`                              | Prodotto sottoscritto. `restrict` evita di cancellare prodotti ancora venduti.         |
| `status`                 | `text`        | not null, default `'active'`, check in (`active`, `past_due`, `canceled`, `incomplete`) | Stato dell'abbonamento (sincronizzato dal webhook Stripe, vedi "Integrazione Stripe"). |
| `current_period_end`     | `timestamptz` | nullable                                                                                | Data di rinnovo o scadenza (popolata dal webhook Stripe).                              |
| `stripe_subscription_id` | `text`        | nullable, unique                                                                        | Riferimento all'oggetto subscription di Stripe.                                        |
| `stripe_customer_id`     | `text`        | nullable                                                                                | ID del Customer Stripe dell'azienda (es. `cus_…`).                                     |
| `created_at`             | `timestamptz` | not null, default `now()`                                                               | Timestamp di creazione.                                                                |
| `updated_at`             | `timestamptz` | not null, default `now()`, aggiornato dal trigger                                       | Aggiornato automaticamente ad ogni `UPDATE`.                                           |

Vincolo aggiuntivo: `unique (company_id, product_id)` — un'azienda non può avere più di un abbonamento per lo stesso prodotto.

Indici:

- `subscriptions_company_id_idx` su `company_id` per velocizzare la query principale della dashboard (`select ... where company_id = ?`).
- `subscriptions_stripe_customer_id_idx` su `stripe_customer_id` per velocizzare il lookup dal webhook Stripe.

Trigger:

- `subscriptions_set_updated_at` — riusa `website.set_updated_at()`.

Gli abbonamenti vengono creati/aggiornati esclusivamente dal webhook Stripe via `service_role`. Nel frattempo, per testing manuale, l'inserimento avviene direttamente nel SQL Editor.

### Migrations

La cartella [`supabase/migrations/`](../supabase/migrations/) è la **fonte di verità dello schema**: ogni modifica al database (tabelle, trigger, policy, funzioni) deve essere prima scritta come file SQL numerato (`NNNN_descrizione.sql`) e poi eseguita manualmente nel **SQL Editor** della dashboard Supabase.

Procedura standard per applicare una migration:

1. Accedere alla dashboard Supabase del progetto Supabase (`staging` o `prod`).
2. Aprire la sezione **SQL Editor**.
3. Incollare il contenuto del file `.sql` corrispondente.
4. Eseguire la query con **Run**.
5. Verificare in **Table Editor** che la struttura attesa sia presente (selezionare lo schema `website` dal menù a tendina in alto).

> ⚠️ **Exposed schemas**: la prima volta che si crea lo schema `website` su un progetto, va aggiunto in **Settings → API → Exposed schemas** (accanto a `public`, `frontline`, `graphql_public`). Senza questo passo il client Supabase del sito non riesce a leggere/scrivere le tabelle (stesso requisito documentato per Frontline negli appunti locali non versionati in `dev_support/`).

#### Nota sui permessi schema (GRANT)

Il progetto Supabase è stato creato con l'opzione **"Automatically expose new tables"** disabilitata (scelta corretta per la sicurezza). Questo comporta che i permessi a livello di schema/tabella Postgres **non vengono applicati automaticamente** per uno schema custom come `website` (a differenza di `public`): senza un GRANT esplicito, anche il client `service_role` riceve un errore `permission denied` (codice Postgres `42501`), che viene valutato prima delle RLS policy.

Per questo motivo la migration [`0004_grant_website_privileges.sql`](../supabase/migrations/0004_grant_website_privileges.sql) concede esplicitamente, su tutto lo schema `website`:

- `service_role` → tutti i privilegi su tutte le tabelle (incluse quelle create da migration future, tramite `alter default privileges`)
- `authenticated` → SELECT, INSERT su `companies`; UPDATE limitato alla sola colonna `company_name` (GRANT per-colonna: la 0006 concedeva anche `tax_id`, la [`0007_add_tax_id_country.sql`](../supabase/migrations/0007_add_tax_id_country.sql) lo toglie). SELECT su `products` e `subscriptions` (DELETE escluso ovunque, come da strategia RLS)
- `anon` → SELECT solo su `products` (catalogo pubblico, esclusi gli `archived` via policy RLS)
- `EXECUTE` sulle funzioni dello schema: solo `service_role` (la 0006 revoca EXECUTE da `authenticated`/`anon` e restringe i default privileges futuri, per evitare che una funzione `SECURITY DEFINER` finisca eseguibile da client)

Ogni nuova tabella aggiunta allo schema `website` con permessi diversi dal default dovrà includere i GRANT corrispondenti nella propria migration.

### Integrazione Stripe

Le tabelle `products` e `subscriptions` contengono colonne di legame agli oggetti corrispondenti su Stripe. Questo permette di correlare i dati interni con gli eventi del webhook Stripe senza query aggiuntive.

| Tabella         | Colonna Supabase         | Oggetto Stripe           | Note                                                                                                                                                                     |
|-----------------|--------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `products`      | `stripe_product_id`      | `Product` (`prod_…`)     | Un prodotto Acme Labs corrisponde a un Product Stripe.                                                                                                                   |
| `products`      | `stripe_price_id`        | `Price` (`price_…`)      | Il Price ricorrente mensile associato al prodotto.                                                                                                                       |
| `companies`     | `stripe_customer_id`     | `Customer` (`cus_…`)     | **Fonte di verità** per il billing: un solo Customer per azienda, condiviso da tutti le app acquistati. Popolato al primo checkout, riusato ad ogni acquisto successivo. |
| `subscriptions` | `stripe_customer_id`     | `Customer` (`cus_…`)     | Colonna storica: copia del Customer al momento dell'acquisto, mantenuta solo per audit/storico — l'app non la legge più per il billing.                                  |
| `subscriptions` | `stripe_subscription_id` | `Subscription` (`sub_…`) | L'abbonamento attivo su Stripe.                                                                                                                                          |

Le colonne Stripe sono nullable: le righe create prima dell'integrazione (es. abbonamenti di test inseriti a mano) rimangono valide. Il webhook Stripe è responsabile di popolarle/aggiornarle tramite `service_role`.

#### Flusso checkout

```text
[/products (Server Component)]
   │  l'utente clicca "Subscribe" (ProductCtaButton — Client Component)
   ▼
[createCheckoutSessionAction] (server action: src/app/(site)/products/actions.ts)
   │  1. getCurrentCompany() — verifica che l'utente sia loggato
   │  2. SELECT su products per slug — verifica status = 'available' e stripe_price_id non null
   │  3. SELECT su subscriptions — blocca se esiste già active/past_due/incomplete
   │     (incomplete: messaggio dedicato, invita a completare il pagamento in sospeso)
   │  4. stripe.checkout.sessions.create({ mode: 'subscription', metadata, ... })
   │     ├─ se companies.stripe_customer_id esiste già → customer: <id esistente> (riusa il Customer)
   │     ├─ altrimenti → customer_email: user.email (Stripe crea un nuovo Customer, salvato dal webhook)
   │     └─ metadata contiene company_id, product_id, product_slug (usati dal webhook)
   │  5. return { success: true, url: session.url }
   ▼
[Redirect a Stripe Checkout (hosted)]
   │
   ├─ pagamento ok  → [GET /checkout/success?session_id=...]
   │                    └─ messaggio conferma + CTA "Go to Dashboard"
   └─ annullato     → [GET /checkout/cancel]
                         └─ messaggio annullamento + CTA "Back to Products"
```

**Nota:** la subscription **non viene ancora scritta in DB** al ritorno da Stripe Checkout. La sincronizzazione avviene nel webhook Stripe. La pagina `/checkout/success` informa l'utente di attendere la conferma.

#### Flusso webhook

```text
[Stripe invia evento]
   ▼
[POST /api/stripe/webhook] (route handler: src/app/api/stripe/webhook/route.ts)
   │  1. Legge il body raw (arrayBuffer) — necessario per la verifica HMAC
   │  2. Legge l'header stripe-signature
   │  3. stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
   │     └─ firma invalida → 400
   │  4. switch event.type → delega al gestore (src/lib/stripe/webhook-handlers.ts)
   ▼
checkout.session.completed
   │  se esiste già una riga (company_id, product_id) con stripe_subscription_id
   │  diverso da quello nuovo → stripe.subscriptions.cancel sulla vecchia
   │  (rete di sicurezza contro subscription orfane; fail non fatale)
   │  recupera lo status reale da stripe.subscriptions.retrieve e lo mappa sui
   │  4 valori DB con mapStripeStatusToDbStatus (dettagli in docs/stripe.md)
   │  se il retrieve fallisce, scrive 'incomplete' per prudenza
   │  upsert su subscriptions (onConflict: company_id,product_id)
   │  popola stripe_subscription_id, stripe_customer_id, current_period_end, status
   │  → subscription appare nella pagina My Apps della dashboard
   │  se companies.stripe_customer_id è ancora null per quell'azienda, lo aggiorna con
   │  il Customer di questa sessione — così il prossimo acquisto lo riuserà
   ▼
customer.subscription.updated
   │  UPDATE su subscriptions WHERE stripe_subscription_id = ?
   │  aggiorna status (mapStripeStatusToDbStatus) e current_period_end
   ▼
customer.subscription.deleted
   │  UPDATE su subscriptions WHERE stripe_subscription_id = ?
   │  status = 'canceled'
   ▼
[upsert/update riuscito? → 200 { received: true }]
[upsert/update fallito?   → throw → 500 → Stripe ritenta la consegna]
```

Tutti gli handler usano il client admin (`SERVICE_ROLE_KEY`, bypassa RLS) e sono idempotenti: lo stesso evento può essere elaborato più volte senza effetti indesiderati. Mappatura completa degli status e dettaglio del comportamento di errore in [`docs/stripe.md`](stripe.md).

### Autenticazione

Supabase Auth gestisce registrazione, login e sessioni. Il token di sessione viene salvato in un cookie HTTP-only e refreshato automaticamente dal proxy Next.js ([`src/proxy.ts`](../src/proxy.ts), vedi sezione "Middleware e protezione rotte").

#### Flusso di registrazione

```text
[Signup form]
   │  submit (react-hook-form + zod client-side)
   ▼
[signupAction] (server action: src/app/(site)/auth/signup/actions.ts)
   │  1. signupSchema.safeParse() — paese tra i 42 ammessi e formato del tax ID
   │  2. rate limit: 10 tentativi / 10 minuti per IP (fail-open se Upstash non risponde)
   │  3. se il paese è UE, o il numero britannico inizia per XI: verifica VIES
   │     (timeout 8s). Numero non trovato o servizio giù → stop, niente signUp
   │  4. supabase.auth.signUp({ email, password, emailRedirectTo: <origin>/auth/callback, captchaToken })
   │  5. guardia anti-enumerazione: se identities è vuoto (email già registrata a un
   │     account confermato, comportamento standard di Supabase) → errore generico,
   │     nessun INSERT/deleteUser su un account altrui
   │  6. INSERT INTO website.companies (id, company_name, tax_id, tax_id_country,
   │     tax_id_verification) — usando il client admin
   │     └─ se fallisce: admin.auth.admin.deleteUser(userId) per evitare stati inconsistenti
   ▼
[Conferma email inviata da Supabase] (SMTP default, limite 4/h)
   │  l'utente clicca il link
   ▼
[GET /auth/callback] (src/app/(site)/auth/callback/route.ts)
   │  se il link è scaduto/già usato (error_code=otp_expired) o invalido
   │     (error/error_code senza `code`, o `code` assente)
   │     → redirect a /auth/login?error=link_expired|link_invalid
   │        (codici interni; la pagina login mostra un messaggio fisso)
   │  se lo scambio della sessione fallisce
   │     → redirect a /auth/login?error=link_expired|auth_failed
   │  se `code` è presente e valido:
   │     supabase.auth.exchangeCodeForSession(code)
   │     → cookie di sessione impostati
   ▼
[Redirect a /dashboard]
```

#### Flusso di login

```text
[Login form]
   │  submit (react-hook-form + zod client-side)
   ▼
[loginAction] (server action: src/app/(site)/auth/login/actions.ts)
   │  1. loginSchema.safeParse() — difesa in profondità lato server
   │  2. supabase.auth.signInWithPassword({ email, password })
   │     ├─ invalid_credentials  → "Invalid email or password."
   │     ├─ email_not_confirmed  → "Please confirm your email before logging in."
   │     └─ altri errori         → "Unable to log in. Please try again." (+ console.error)
   │  3. revalidatePath("/", "layout") + redirect("/dashboard") (oppure al path sicuro `next` se valorizzato)
   ▼
[Dashboard con sessione attiva e Navbar aggiornata]
```

#### Flusso di logout

```text
[Navbar → click "Log out"] (client component LogoutButton, useTransition)
   │
   ▼
[logoutAction] (server action: src/app/(site)/auth/actions.ts)
   │  1. supabase.auth.signOut() — pulisce i cookie di sessione
   │  2. revalidatePath("/", "layout") + redirect("/")
   ▼
[Home senza sessione, Navbar mostra nuovamente "Login" e "Get Started"]
```

La Navbar è un Server Component asincrono (`src/components/layout/Navbar.tsx`) che ad ogni render chiama `supabase.auth.getUser()`. Se l'utente è autenticato, recupera anche `companies.company_name` per mostrarlo accanto al pulsante "Log out". Il rendering condizionale dei CTA (Login/Get Started vs nome azienda/Log out) è interamente lato server, quindi sempre coerente con lo stato reale della sessione.

##### Perché l'INSERT su `companies` usa il client admin

Quando `Confirm email` è abilitato (impostazione attuale), subito dopo `supabase.auth.signUp` l'utente esiste in `auth.users` ma **non ha ancora una sessione attiva**: deve prima cliccare il link di conferma ricevuto via email. Di conseguenza, `auth.uid()` ritorna `NULL` e la policy `companies_insert_own` (`auth.uid() = id`) rifiuta l'INSERT.

Per risolvere, l'INSERT viene eseguito tramite [`createAdminClient`](../src/lib/supabase/admin.ts) (`SERVICE_ROLE_KEY`), che bypassa RLS. L'operazione resta sicura perché:

- avviene esclusivamente lato server, dentro una server action;
- i dati sono già stati validati con `signupSchema`;
- l'`id` inserito è quello restituito da `supabase.auth.signUp`, quindi non manipolabile dall'utente.

Tutte le altre operazioni su `companies` (SELECT, UPDATE) continuano ad usare il client server con session cookie e rispettano le RLS policy.

#### Domini email bloccati al signup

Per assicurarsi che si registrino solo clienti business, lo `signupSchema` rifiuta tramite `refine` le email con dominio personale gratuito. La lista è centralizzata in [`src/lib/auth/blocked-email-domains.ts`](../src/lib/auth/blocked-email-domains.ts) (gmail.com, yahoo.com, outlook.com, icloud.com, proton.me, ecc.) ed è usata sia client-side (validazione immediata nel form) sia lato server (server action `signupAction`).

Messaggio di errore mostrato all'utente: `Please use your company email address`.

#### Configurazione URL su Supabase

In **Authentication → URL Configuration** della dashboard. Essendoci due progetti separati, ognuno ha i propri URL coerenti con l'ambiente che serve:

**Progetto `prod`** (produzione):

- **Site URL:** `https://<project>.vercel.app`. Con il dominio custom, `https://example.com`.
- **Redirect URLs:** `https://<project>.vercel.app/auth/callback`.

**Progetto `staging`** (staging + locale, condiviso con Frontline):

- **Site URL:** `https://<project>-git-staging-<team>.vercel.app`.
- **Redirect URLs:** `https://<project>-git-staging-<team>.vercel.app/auth/callback` e `http://localhost:3000/auth/callback` (il `localhost` serve allo sviluppo locale, che usa il progetto di staging).

In **Authentication → Providers** (su entrambi i progetti) il provider `Email` deve essere abilitato con `Confirm email` attivo. SMTP default di Supabase (limite 4 email/ora).

> ⚠️ Con clienti reali l'SMTP default (4 email/ora) non basta: il progetto di produzione va configurato con un SMTP vero (es. Resend, già usato per il form contatti).

### Middleware e protezione rotte

Il proxy Next.js ([`src/proxy.ts`](../src/proxy.ts)) viene eseguito prima di ogni request che corrisponde al `matcher` configurato (escludendo asset statici e API routes). In Next.js 16 la file convention `middleware` è stata rinominata in `proxy` (stessa funzionalità, nome più descrittivo). Il proxy si appoggia all'helper [`updateSession`](../src/lib/supabase/middleware.ts) che:

1. Inizializza un `createServerClient` di `@supabase/ssr` con i cookie della request.
2. Chiama `supabase.auth.getUser()` — questa chiamata refresha il token se sta per scadere e aggiorna i cookie di sessione.
3. Restituisce una `NextResponse` con i cookie propagati e l'oggetto `user` per le decisioni di redirect.

Subito dopo, i Server Components che chiamano `supabase.auth.getUser()` (ad esempio la `Navbar`) leggono cookie già freschi e ricevono lo stato di sessione corretto.

#### Rotte protette e flusso di redirect

| Caso                                                         | Comportamento                                                                       |
|--------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Path in `PROTECTED_PATHS` (oggi `/dashboard`) + utente `null`| Redirect a `/auth/login?next=<pathname>` (preserva la destinazione richiesta).      |
| Path in `/auth/login` o `/auth/signup` + utente loggato      | Redirect a `/dashboard` (inutile mostrare i form di auth a chi è già autenticato).  |
| Tutti gli altri casi                                         | La request prosegue normalmente, con i cookie di sessione aggiornati nella response.|

#### Parametro `next` per il deep linking post-login

`loginAction` ([`src/app/(site)/auth/login/actions.ts`](../src/app/(site)/auth/login/actions.ts)) accetta un parametro opzionale `next`. Se è un path interno sicuro (inizia con `/`, non `//` né `/\`), il redirect post-login punta lì invece che a `/dashboard`. La pagina di login ([`src/app/(site)/auth/login/page.tsx`](../src/app/(site)/auth/login/page.tsx)) legge `next` dai search params via `useSearchParams()` e lo passa alla server action. In questo modo un utente anonimo che apre `/dashboard/qualcosa` viene rimandato al login e, dopo l'autenticazione, torna esattamente alla rotta richiesta.

### Flusso dashboard

L'area autenticata vive sotto il route group [`(dashboard)`](../src/app/(dashboard)/), protetto dal proxy ([`src/proxy.ts`](../src/proxy.ts)): un utente non loggato che richiede una qualsiasi sotto-rotta viene rediretto su `/auth/login?next=<path richiesto>`. È divisa in 3 pagine distinte:

| Pagina                                                                                             | Contenuto                                                                                                                                                                                                                         |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Overview** ([`dashboard/page.tsx`](../src/app/(dashboard)/dashboard/page.tsx))                   | Empty state se nessun abbonamento; banner di attenzione se almeno un abbonamento è `past_due`/`incomplete`; 2 card statistiche (app attive, prossimo rinnovo); 3 scorciatoie (My Apps, Manage billing se `hasBilling`, Settings). |
| **My Apps** ([`dashboard/apps/page.tsx`](../src/app/(dashboard)/dashboard/apps/page.tsx))          | Griglia reale degli abbonamenti (nome prodotto, descrizione, badge stato, periodo formattato) e bottone "Open app".                                                                                                               |
| **Settings** ([`dashboard/settings/page.tsx`](../src/app/(dashboard)/dashboard/settings/page.tsx)) | Form di cambio password (`ChangePasswordForm` + `changePasswordAction`).                                                                                                                                                          |

Tutto l'accesso ai dati passa per gli helper centralizzati in [`src/lib/dashboard/queries.ts`](../src/lib/dashboard/queries.ts) (marcati `import "server-only"`):

| Helper                           | Query                                                                                                                               | Uso                                                          |
|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| `getCurrentCompany()`            | `auth.getUser()` + `select id, company_name, tax_id, stripe_customer_id from companies where id = user.id`.                         | Identifica l'azienda corrente, usata da tutte e 3 le pagine. |
| `getSubscriptionsForCompany(id)` | `select status, current_period_end, products(slug, name, description, web_app_url, status) from subscriptions where company_id = ?`.| Popola Overview (statistiche) e la pagina My Apps (griglia). |

Entrambe le query rispettano le RLS policy `companies_select_own` e `subscriptions_select_own`: l'azienda autenticata vede solo il proprio record e i propri abbonamenti, anche se le query non filtrano esplicitamente per `auth.uid()` (è il database a garantirlo).

Nella pagina My Apps:

- Lista vuota → empty state condiviso con icona, titolo "No apps yet" e CTA "Browse Products" verso `/products`.
- Lista non vuota → griglia di card con nome prodotto, descrizione, badge dello status (`active`, `past_due`, `canceled`, `incomplete`) tramite [`SubscriptionStatusBadge`](../src/components/dashboard/SubscriptionStatusBadge.tsx), periodo formattato in inglese (es. `Renews on May 20, 2026`) e bottone `Open app` abilitato solo se `status = 'active'`.

**Importante:** il bottone `Open app` **non** è un link statico a `web_app_url`. Al click, `OpenAppButton` invoca la server action `openProductAppAction`, che verifica di nuovo lato server che l'abbonamento sia `active` e firma un JWT SSO fresco (60 secondi) da allegare all'URL della web app di destinazione — vedi [`docs/sso.md`](sso.md) per il flusso completo.

### Row Level Security (RLS)

RLS è abilitato su tutte le tabelle che contengono dati delle aziende. Le policy seguono il principio dell'isolamento per tenant: ogni azienda accede esclusivamente ai propri record.

Policy attualmente attive:

| Tabella         | Nome                            | Operazione | Ruolo                  | Condizione               | Note                                                                                                                                                          |
|-----------------|---------------------------------|------------|------------------------|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `companies`     | `companies_select_own`          | `SELECT`   | `authenticated`        | `auth.uid() = id`        | Ogni azienda legge solo il proprio record.                                                                                                                    |
| `companies`     | `companies_insert_own`          | `INSERT`   | `authenticated`        | `auth.uid() = id`        | Non utilizzata dal codice applicativo attuale (il signup usa il client admin); mantenuta per eventuali scritture dirette da client autenticato.               |
| `companies`     | `companies_update_own`          | `UPDATE`   | `authenticated`        | `auth.uid() = id`        | Aggiornamento limitato alla colonna `company_name` (GRANT per-colonna, migration 0007). `tax_id`, paese e stato di verifica non sono modificabili dal client. |
| `products`      | `products_select_public`        | `SELECT`   | `anon`                 | `status <> 'archived'`   | Catalogo pubblico: i visitatori non loggati non vedono i prodotti archiviati (né i loro ID Stripe).                                                           |
| `products`      | `products_select_authenticated` | `SELECT`   | `authenticated`        | `true`                   | Un'azienda autenticata può ancora risolvere il join `subscriptions → products` anche se il prodotto è stato archiviato.                                       |
| `subscriptions` | `subscriptions_select_own`      | `SELECT`   | `authenticated`        | `company_id = auth.uid()`| Ogni azienda legge solo i propri abbonamenti.                                                                                                                 |

Nessuna policy `INSERT`/`UPDATE`/`DELETE` lato client su `products` e `subscriptions`: la gestione del catalogo e del ciclo di vita degli abbonamenti avviene esclusivamente via `service_role` (webhook Stripe; un eventuale Admin Panel interno non fa parte di questo sito).

Nessuna policy `DELETE` lato cliente su `companies`: la cancellazione avviene tramite cascade da `auth.users` o da operazioni server-side con `service_role` (bypassa RLS).

---

## 🔧 Configurazione

Le variabili d'ambiente necessarie (vedi anche `docs/config.md`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Le chiavi si trovano su Supabase Dashboard → Project Settings → API Keys. **Attenzione:** ogni ambiente usa le chiavi del proprio progetto — quelle di `prod` in produzione, quelle di `staging` in staging e in locale. Vedi la mappatura per scope su Vercel in [`docs/deploy.md`](deploy.md).

---

## 📚 Riferimenti

- **Client server:** [`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts)
- **Configurazione variabili:** [`docs/config.md`](config.md)
- **Supabase docs:** [supabase.com/docs](https://supabase.com/docs)
- **Supabase SSR per Next.js:** [supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
