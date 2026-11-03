# Observability - Sistema di Logging

Panoramica del sistema di logging e monitoraggio del sito Acme Labs.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Fonti di log](#️-fonti-di-log)
- [🔧 Pattern di logging nel codice](#-pattern-di-logging-nel-codice)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Il sito non utilizza tool di logging esterni. I log vengono raccolti automaticamente dai tre servizi già integrati nel progetto: Vercel, Stripe e Supabase. Questa configurazione è sufficiente per la fase di staging e per i primi mesi di produzione.

---

## ⚙️ Fonti di log

### Vercel — Function Logs

Ogni chiamata alle API Routes e alle Server Actions Next.js genera un log in Vercel. Tutti i `console.log` e `console.error` eseguiti lato server finiscono qui automaticamente.

- **Dove:** Vercel Dashboard → progetto `<project>` → Functions → Logs
- **Cosa contiene:** invocazioni delle server actions, errori del webhook Stripe, errori di query Supabase, eccezioni non gestite
- **Retention:** 1 giorno sul piano gratuito

### Stripe Dashboard — Events

Stripe registra ogni evento del ciclo di vita degli abbonamenti e ogni chiamata API ricevuta.

- **Dove:** [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Events
- **Cosa contiene:** eventi webhook (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`), stato della consegna (riuscita/fallita), payload completo dell'evento, tentativi di retry automatici
- **Filtro modalità:** ricordati di attivare "Test mode" in Stripe per vedere gli eventi dello staging

### Supabase Dashboard — Logs

Supabase espone i log delle query al database e del sistema di autenticazione.

- **Dove:** [Supabase Dashboard](https://supabase.com) → progetto B2B SaaS Website → Logs
- **Sezioni disponibili:** API Logs (query al DB), Auth Logs (registrazioni, login, token refresh), Edge Function Logs (se applicabile)

### Resend Dashboard — Emails

Resend registra ogni invio email tentato dal form di contatto (`sendContactMessageAction`).

- **Dove:** [Resend Dashboard](https://resend.com) → Emails
- **Cosa contiene:** stato di consegna di ogni email (inviata, in bounce, fallita), destinatario, oggetto — utile per verificare se un messaggio di contatto è effettivamente arrivato

---

## 🔧 Pattern di logging nel codice

Tutti i `console.error` e `console.log` nel codice usano un prefisso tra parentesi quadre per identificare l'origine del messaggio:

```txt
[nomeModulo] messaggio descrittivo
```

Esempi presenti nel codice:

| Prefisso                                | File                                                |
|-----------------------------------------|-----------------------------------------------------|
| `[signupAction]`                        | `src/app/(site)/auth/signup/actions.ts`             |
| `[loginAction]`                         | `src/app/(site)/auth/login/actions.ts`              |
| `[logoutAction]`                        | `src/app/(site)/auth/actions.ts`                    |
| `[authCallback]`                        | `src/app/(site)/auth/callback/route.ts`             |
| `[getCurrentCompany]`                   | `src/lib/dashboard/queries.ts`                      |
| `[getSubscriptionsForCompany]`          | `src/lib/dashboard/queries.ts`                      |
| `[getAvailableProducts]`                | `src/lib/products/queries.ts`                       |
| `[getUserActiveSubscriptionSlugs]`      | `src/lib/products/queries.ts`                       |
| `[createCheckoutSessionAction]`         | `src/app/(site)/products/actions.ts`                |
| `[createBillingPortalSessionAction]`    | `src/app/(dashboard)/dashboard/actions.ts`          |
| `[changePasswordAction]`                | `src/app/(dashboard)/dashboard/settings/actions.ts` |
| `[openProductAppAction]`                | `src/app/(dashboard)/dashboard/apps/actions.ts`     |
| `[sendContactMessageAction]`            | `src/app/(site)/contact/actions.ts`                 |
| `[verifyTurnstileToken]`                | `src/lib/security/turnstile.ts`                     |
| `[checkContactRateLimit]`               | `src/lib/security/rate-limit.ts`                    |
| `[checkSignupRateLimit]`                | `src/lib/security/rate-limit.ts`                    |
| `[checkVatNumber]`                      | `src/lib/tax-id/vies.ts`                            |
| `[webhook] customer.tax_id.*`           | `src/lib/stripe/webhook-handlers.ts`                |
| `[sendTaxIdReviewAlert]`                | `src/lib/resend/alerts.ts`                          |
| `[getProductNameBySlug]`                | `src/lib/products/queries.ts`                       |
| `[webhook]`                             | `src/app/api/stripe/webhook/route.ts`               |
| `[webhook] checkout.session.completed`  | `src/lib/stripe/webhook-handlers.ts`                |
| `[webhook] customer.subscription.*`     | `src/lib/stripe/webhook-handlers.ts`                |

Gli error boundary applicativi (`src/app/error.tsx`, `src/app/global-error.tsx`) loggano anch'essi via `console.error`, ma senza un prefisso strutturato: catturano errori imprevisti nel rendering React e non hanno un "modulo" specifico a cui associarli.

Questa convenzione rende facile filtrare i log in Vercel cercando il prefisso specifico.

---

## 📚 Riferimenti

- **Vercel Logs:** [vercel.com/docs/observability/logs](https://vercel.com/docs/observability/logs)
- **Stripe Events:** [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Supabase Logs:** [supabase.com/docs/guides/platform/logs](https://supabase.com/docs/guides/platform/logs)
