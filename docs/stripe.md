# Stripe

Documentazione dell'integrazione Stripe nel sito Acme Labs: pagamenti, abbonamenti mensili, webhook e customer portal.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Come funziona](#️-come-funziona)
- [🔧 Configurazione](#-configurazione)
- [🧪 Test in locale con Stripe CLI](#-test-in-locale-con-stripe-cli)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Stripe gestisce tutti i pagamenti e gli abbonamenti mensili ricorrenti del sito Acme Labs. Le aziende clienti acquistano un'app tramite Stripe Checkout (pagamento hosted su Stripe) e gestiscono fatture e metodi di pagamento tramite il Customer Portal di Stripe.

Dettagli account:

- **Dashboard:** [dashboard.stripe.com](https://dashboard.stripe.com)
- **Modalità attuale:** Test mode (staging). Le transazioni usano carte di test e non addebitano denaro reale.
- **API version pinnata:** `2026-04-22.dahlia` — fissata nel client per evitare breaking change automatici.

---

## ⚙️ Come funziona

### Client server

Il client Stripe è un singleton inizializzato in [`src/lib/stripe/server.ts`](../src/lib/stripe/server.ts). Marcato `import "server-only"` per impedire l'uso dal browser.

```text
getStripeServerClient()
  → controlla STRIPE_SECRET_KEY
  → istanzia Stripe con apiVersion "2026-04-22.dahlia"
  → restituisce il singleton (unica istanza per processo)
```

### Oggetti Stripe utilizzati

| Oggetto Stripe           | ID tipico   | Utilizzo nel progetto                                                                                                                                         |
|--------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Product`                | `prod_…`    | Un prodotto Acme Labs corrisponde a un Product Stripe. Salvato in `products.stripe_product_id`.                                                               |
| `Price`                  | `price_…`   | Il prezzo ricorrente mensile del prodotto. Salvato in `products.stripe_price_id`.                                                                             |
| `Customer`               | `cus_…`     | Creato da Stripe al primo checkout. Salvato in `companies.stripe_customer_id` (fonte di verità); `subscriptions.stripe_customer_id` è solo una copia storica. |
| `Subscription`           | `sub_…`     | Abbonamento attivo. Salvato in `subscriptions.stripe_subscription_id`.                                                                                        |
| `Checkout Session`       | `cs_…`      | Sessione di pagamento hosted su Stripe. Non salvata in DB.                                                                                                    |
| `Billing Portal Session` | —           | Sessione del portale self-service. Non salvata in DB.                                                                                                         |

### Flusso checkout

```text
[/products (Server Component)]
   │  l'utente clicca "Subscribe" (ProductCtaButton — Client Component)
   ▼
[createCheckoutSessionAction] (src/app/(site)/products/actions.ts)
   │  1. getCurrentCompany() — verifica che l'utente sia loggato
   │  2. SELECT su products per slug — verifica status = 'available' e stripe_price_id non null
   │  3. SELECT su subscriptions — blocca se esiste già active/past_due/incomplete
   │     (incomplete: messaggio dedicato, invita a completare il pagamento in sospeso)
   │  4. stripe.checkout.sessions.create({
   │       mode: 'subscription',
   │       line_items: [{ price: stripe_price_id, quantity: 1 }],
   │       customer: company.stripe_customer_id  (se già presente — riusa il Customer)
   │       customer_update.name: auto             (solo in quel caso: salva nome e tax ID sul Customer)
   │       customer_email: user.email            (altrimenti Stripe crea un nuovo Customer)
   │       tax_id_collection: { enabled: true, required: 'if_supported' },
   │       allow_promotion_codes: true,
   │       client_reference_id: company.id,
   │       metadata: { company_id, product_id, product_slug },
   │       subscription_data: { metadata: { company_id, product_id } },
   │     })
   │  5. return { success: true, url: session.url }
   ▼
[Redirect a Stripe Checkout (hosted)]
   │
   ├─ pagamento ok  → [GET /checkout/success?session_id=...]
   │                    └─ messaggio di conferma + CTA "Go to Dashboard"
   └─ annullato     → [GET /checkout/cancel]
                         └─ messaggio annullamento + CTA "Back to Products"
```

**Nota:** la subscription non viene scritta in DB durante il checkout. La sincronizzazione avviene via webhook (vedi sotto).

### Flusso webhook

Il webhook è il canale con cui Stripe notifica il sito degli eventi rilevanti. Gestito dalla route [`POST /api/stripe/webhook`](../src/app/api/stripe/webhook/route.ts) con gli handler in [`src/lib/stripe/webhook-handlers.ts`](../src/lib/stripe/webhook-handlers.ts).

```text
[Stripe invia evento HTTP POST]
   ▼
[POST /api/stripe/webhook]
   │  1. Controlla STRIPE_WEBHOOK_SECRET — 500 se mancante
   │  2. Legge header stripe-signature — 400 se mancante
   │  3. Legge il body raw come Buffer (necessario per la verifica HMAC)
   │  4. stripe.webhooks.constructEvent(rawBody, signature, secret)
   │     └─ firma invalida → 400
   │  5. switch event.type → delega all'handler
   ▼
checkout.session.completed
   │  se esiste già una riga (company_id, product_id) con stripe_subscription_id
   │  diverso da quello nuovo → stripe.subscriptions.cancel sulla vecchia
   │  (rete di sicurezza contro subscription orfane; fail non fatale)
   │  recupera lo status reale da stripe.subscriptions.retrieve e lo mappa
   │  sui 4 valori DB con mapStripeStatusToDbStatus (vedi tabella sotto)
   │  se il retrieve fallisce, scrive 'incomplete' per prudenza
   │  upsert su subscriptions (onConflict: company_id, product_id)
   │  popola: stripe_subscription_id, stripe_customer_id, status, current_period_end
   │  (current_period_end da items.data[0].current_period_end — API 2026-04-22.dahlia)
   │  se companies.stripe_customer_id è ancora null per questa azienda, lo
   │  aggiorna con il Customer di questa sessione (riuso al prossimo acquisto)
   ▼
customer.subscription.updated
   │  UPDATE su subscriptions WHERE stripe_subscription_id = ?
   │  aggiorna: status (mapStripeStatusToDbStatus), current_period_end
   ▼
customer.subscription.deleted
   │  UPDATE su subscriptions WHERE stripe_subscription_id = ?
   │  imposta: status = 'canceled'
   ▼
[upsert/update riuscito? → 200 { received: true }]
[upsert/update fallito?   → throw → 500 → Stripe ritenta la consegna]
```

Tutti gli handler usano il client admin Supabase (`SERVICE_ROLE_KEY`, bypassa RLS) e sono idempotenti: lo stesso evento può essere elaborato più volte senza effetti indesiderati.

**Mappatura status Stripe → DB** (`mapStripeStatusToDbStatus` in [`webhook-handlers.ts`](../src/lib/stripe/webhook-handlers.ts)), necessaria perché la colonna `subscriptions.status` accetta solo 4 valori mentre Stripe ne usa di più:

| Status Stripe                         | Status DB    |
|---------------------------------------|--------------|
| `active`, `trialing`                  | `active`     |
| `past_due`, `unpaid`, `paused`        | `past_due`   |
| `canceled`, `incomplete_expired`      | `canceled`   |
| `incomplete` (e qualsiasi altro caso) | `incomplete` |

**Nota tecnica:** dalla Stripe API `2026-04-22.dahlia` il campo `current_period_end` è stato spostato dalla radice dell'oggetto `Subscription` al livello del singolo `SubscriptionItem` (`items.data[0].current_period_end`). Il codice tiene conto di questo comportamento.

### Customer Portal

Il Customer Portal permette alle aziende di gestire in autonomia fatture, metodi di pagamento e cancellazione abbonamento, senza uscire dal flusso Stripe.

```text
[Dashboard → click "Manage billing" (BillingShortcutCard — Client Component)]
   ▼
[createBillingPortalSessionAction] (src/app/(dashboard)/dashboard/actions.ts)
   │  1. getCurrentCompany() — verifica auth
   │  2. legge company.stripe_customer_id (già caricato da getCurrentCompany)
   │     └─ nessun customer_id → errore "You don't have an active subscription to manage."
   │  3. stripe.billingPortal.sessions.create({
   │       customer: stripe_customer_id,
   │       return_url: origin + '/dashboard',
   │     })
   │  4. return { success: true, url: session.url }
   ▼
[Redirect al Customer Portal Stripe]
   │
   └─ l'utente torna a /dashboard dopo aver completato le azioni nel portale
```

Il `BillingShortcutCard` è un Client Component che mostra uno spinner al posto dell'icona durante la creazione della sessione e un messaggio di errore inline in caso di fallimento (nessun `alert()`).

---

## 🔧 Configurazione

Le variabili d'ambiente necessarie (vedi anche [`docs/config.md`](config.md)):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook endpoint su Stripe

L'endpoint webhook è configurato in Stripe Dashboard → Developers → Webhooks. **Ogni modalità Stripe ha il suo endpoint, che deve puntare all'ambiente con le chiavi corrispondenti:**

| Modalità Stripe | URL da registrare                                                                                        | Ambiente / chiavi        |
|-----------------|----------------------------------------------------------------------------------------------------------|--------------------------|
| Test (Sandbox)  | `https://<project>-git-staging-<team>.vercel.app/api/stripe/webhook?x-vercel-protection-bypass=<secret>` | Staging — chiavi test    |
| Live            | `https://<project>.vercel.app/api/stripe/webhook` (e in futuro `example.com`)                            | Produzione — chiavi live |

> ⚠️ Errore da evitare: **non** registrare l'endpoint di test sull'URL di produzione. La produzione usa le chiavi **live**, quindi rifiuterebbe gli eventi di test (HTTP 500 "Webhook secret not configured" se mancano le chiavi, oppure 400 per firma non valida). Ogni endpoint ha il suo `whsec_...`, che va inserito nello scope Vercel corretto (Preview per test, Production per live).
> ℹ️ Lo staging è protetto da Vercel Authentication (Standard Protection); il webhook passa grazie al Protection Bypass for Automation (`?x-vercel-protection-bypass=<secret>` sull'URL, secret nel pannello Vercel, mai nel codice). Se l'endpoint Live punta a `<project>.vercel.app`, serve lo stesso query param. Vedi [`docs/deploy.md`](deploy.md).

Gli eventi da abilitare su ciascun endpoint:

| Evento                           | Handler                          |
|----------------------------------|----------------------------------|
| `checkout.session.completed`     | `handleCheckoutSessionCompleted` |
| `customer.subscription.updated`  | `handleSubscriptionUpdated`      |
| `customer.subscription.deleted`  | `handleSubscriptionDeleted`      |
| `customer.tax_id.created`        | `handleTaxIdChanged`             |
| `customer.tax_id.updated`        | `handleTaxIdChanged`             |

### Customer Portal — configurazione dashboard

Il Customer Portal richiede una configurazione manuale in **Stripe Dashboard → Settings → Billing → Customer Portal** prima che il bottone "Manage billing" funzioni. Senza di essa, Stripe restituisce un errore `No configuration provided`.

Configurazione attuale (test mode):

| Sezione                    | Opzione                                                                          | Stato     |
|----------------------------|----------------------------------------------------------------------------------|-----------|
| Fatture                    | Cronologia delle fatture                                                         | Abilitato |
| Informazioni sul cliente   | Nome, indirizzo email, indirizzo di fatturazione, numero di telefono, ID fiscale | Abilitato |
| Annullamenti               | Annulla abbonamenti (al termine del periodo di fatturazione corrente)            | Abilitato |

> Quando si passerà alle chiavi live in produzione, questa configurazione andrà rifatta in Stripe Dashboard con la modalità live attiva.

Se nel portale i clienti possono modificare o togliere l'ID fiscale, un cambiamento manda di nuovo `customer.tax_id.updated` e il flag "da controllare" può riaccendersi. È il comportamento voluto.

### Tax ID al checkout

Checkout chiede un tax ID aziendale. `tax_id_collection.required` è `if_supported`: il campo è obbligatorio solo nei paesi che Stripe sa raccogliere. Checkout controlla il formato, non se il numero esiste davvero. La verifica contro i registri (VIES per l'IVA UE, e gli equivalenti per Australia e Regno Unito) arriva dopo, con gli eventi `customer.tax_id.created` e `customer.tax_id.updated`.

Paesi ammessi sul sito per cui Stripe **non** raccoglie un tax ID: Stati Uniti, Giappone, Israele, Monaco, San Marino, Groenlandia. Lì il checkout non mostra il campo. Fonte: [Collect customer tax IDs with Checkout](https://docs.stripe.com/tax/checkout/tax-ids).

Stati Stripe e cosa fa il sito:

| Stato Stripe   | Cosa fa il sito                                                              |
|----------------|------------------------------------------------------------------------------|
| `pending`      | Niente. Stripe non ha ancora finito.                                         |
| `verified`     | Se l'azienda era da controllare, toglie il flag.                             |
| `unverified`   | Segna l'azienda da controllare e manda un'email, una volta sola.             |
| `unavailable`  | Come `unverified`: Stripe non può verificare, il controllo manuale è nostro. |

Se l'evento arriva prima che `checkout.session.completed` abbia salvato `companies.stripe_customer_id`, il webhook risponde 500 e Stripe riprova. Un Customer creato a mano nella dashboard di Stripe, senza azienda nel database, continua a fallire per qualche giorno e resta nei log.

L'email parte solo la prima volta che il flag passa da spento ad acceso (`tax_id_needs_review` era `false`). Va a `CONTACT_RECIPIENT_EMAIL`, da `noreply@example.com`. Se l'invio fallisce, il flag resta e Stripe non ritenta l'email.

Numeri di prova in test mode, tipo IVA UE, ABN australiano o VAT britannica ([documentazione Stripe](https://docs.stripe.com/billing/customer/tax-ids)):

| Numero        | Esito                                      |
|---------------|--------------------------------------------|
| `000000000`   | Verifica riuscita (`verified`)             |
| `111111111`   | Verifica fallita (`unverified`)            |
| `222222222`   | Resta in attesa (`pending`)                |

Un formato qualsiasi valido, per esempio `DE123456789`, passa il controllo di formato al checkout. L'esito vero arriva dopo, via webhook.

Per togliere il flag dopo il controllo a mano, nel SQL Editor di Supabase (schema `website`):

```sql
update website.companies
set
  tax_id_needs_review = false,
  tax_id_review_reason = null,
  tax_id_review_flagged_at = null
where id = '<uuid-azienda>';
```

---

## 🧪 Test in locale con Stripe CLI

Per testare il flusso completo (checkout → webhook → dashboard) in locale è necessario usare la **Stripe CLI**, che fa da tunnel tra Stripe e il server locale.

1. Installare la Stripe CLI seguendo [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli).
2. Autenticarsi:

   ```bash
   stripe login
   ```

3. Avviare il listener che inoltra gli eventi al server locale:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. La CLI mostra un `whsec_...` temporaneo da inserire in `.env` come `STRIPE_WEBHOOK_SECRET` per i test locali.
5. Avviare il server locale con `npm run dev`.
6. Usare le **carte di test Stripe** per simulare pagamenti:
   - Carta valida: `4242 4242 4242 4242` — qualsiasi data futura, qualsiasi CVC
   - Carta con pagamento fallito: `4000 0000 0000 0002`

---

## 📚 Riferimenti

- **Client server:** [`src/lib/stripe/server.ts`](../src/lib/stripe/server.ts)
- **Webhook route:** [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts)
- **Webhook handlers:** [`src/lib/stripe/webhook-handlers.ts`](../src/lib/stripe/webhook-handlers.ts)
- **Checkout action:** [`src/app/(site)/products/actions.ts`](../src/app/(site)/products/actions.ts)
- **Billing Portal action:** [`src/app/(dashboard)/dashboard/actions.ts`](../src/app/(dashboard)/dashboard/actions.ts)
- **Endpoint API:** [`docs/api_endpoints.md`](api_endpoints.md)
- **Variabili d'ambiente:** [`docs/config.md`](config.md)
- **Stripe docs:** [stripe.com/docs](https://stripe.com/docs)
- **Stripe CLI:** [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Carte di test:** [stripe.com/docs/testing](https://stripe.com/docs/testing)
