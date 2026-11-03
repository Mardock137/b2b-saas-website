# Configurazione

Guida alle variabili d'ambiente del progetto Acme Labs.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Come funziona](#️-come-funziona)
- [🔧 Variabili d'ambiente](#-variabili-dambiente)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Le variabili d'ambiente contengono le chiavi API e le configurazioni sensibili del progetto. Non vengono mai committate su GitHub.

- Il file `.env` contiene i valori reali — è escluso da git tramite `.gitignore`.
- Il file `.env.example` contiene i nomi delle variabili con valori placeholder — è versionato e serve come riferimento.

---

## ⚙️ Come funziona

### Variabili pubbliche vs private

Next.js distingue due tipi di variabili:

| Prefisso            | Visibilità       | Quando usarla                                                        |
|---------------------|------------------|----------------------------------------------------------------------|
| `NEXT_PUBLIC_`      | Browser + Server | Valori che possono essere esposti al browser (URL, chiavi pubbliche) |
| *(nessun prefisso)* | Solo Server      | Chiavi segrete che non devono mai raggiungere il browser             |

---

## 🔧 Variabili d'ambiente

### App

| Variabile              | Tipo     | Descrizione                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_SITE_URL` | Pubblica | **Obbligatoria in produzione e staging** (l'app lancia un errore se manca). URL base del sito, usata come origin fisso per i link di conferma email e gli URL Stripe (anti host-header injection). In locale, se assente, fallback a `http://localhost:3000`. In staging: `https://<project>.vercel.app`. In produzione: `https://example.com`. Controlla anche il noindex: se diverso da `https://example.com`, il sito non viene indicizzato. |

### Supabase

Le chiavi si trovano su Supabase Dashboard → Project Settings → API Keys.

> Esistono **due progetti Supabase separati**: `prod` (produzione) e `staging` (staging + locale, condiviso con Frontline tramite schemi Postgres separati — vedi [`docs/supabase.md`](supabase.md)). Le chiavi qui sotto cambiano valore a seconda dell'ambiente: in locale il file `.env` usa le chiavi di `staging`; su Vercel lo scope Production usa `prod` e lo scope Preview usa `staging`. Vedi [`docs/deploy.md`](deploy.md) e [`docs/supabase.md`](supabase.md).

| Variabile                       | Tipo        | Descrizione                                                                                       |
|---------------------------------|-------------|---------------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Pubblica    | URL del progetto Supabase (es. `https://xxxx.supabase.co`)                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pubblica    | Chiave anonima per operazioni pubbliche (lettura dati pubblici, auth)                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Privata** | Chiave privilegiata che bypassa RLS. Usata solo lato server per operazioni admin. Non esporla mai |

### Stripe

Le chiavi si trovano su Stripe Dashboard → Developers → API Keys.

| Variabile                            | Tipo        | Stato                 | Descrizione                                                          |
|--------------------------------------|-------------|-----------------------|----------------------------------------------------------------------|
| `STRIPE_SECRET_KEY`                  | **Privata** | ✅ Attiva (test mode) | Chiave segreta Stripe per operazioni server-side (checkout, webhook) |
| `STRIPE_WEBHOOK_SECRET`              | **Privata** | ✅ Attiva (test mode) | Segreto per verificare l'autenticità dei webhook ricevuti da Stripe  |

### Resend

La chiave si trova su Resend Dashboard → API Keys.

| Variabile                 | Tipo        | Stato     | Descrizione                                                                                 |
|---------------------------|-------------|-----------|---------------------------------------------------------------------------------------------|
| `RESEND_API_KEY`          | **Privata** | ✅ Attiva | Chiave API per l'invio di email tramite Resend. Usata solo lato server.                     |
| `CONTACT_RECIPIENT_EMAIL` | **Privata** | ✅ Attiva | Indirizzo email destinatario dei messaggi dal form di contatto (es. `support@example.com`). |

### SSO / Frontline

| Variabile           | Tipo        | Descrizione                                                                                                                                                                 |
|---------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SSO_SHARED_SECRET` | **Privata** | Segreto condiviso con Frontline per firmare il JWT di accesso (`HS256`). Il valore deve essere identico su questo sito e su Frontline. Usata solo lato server, mai esposta. |

> Dettagli completi sul funzionamento del collegamento SSO in [`docs/sso.md`](sso.md).

### Anti-bot (Cloudflare Turnstile + Upstash)

Dettaglio di flusso, attivazione captcha su Supabase e problemi comuni in [`docs/anti_bot.md`](anti_bot.md).

| Variabile                        | Tipo        | Descrizione                                                                                                                                                                                                        |
|----------------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Pubblica    | Chiave del widget Turnstile, visibile nel browser. Su Vercel è una variabile Config (Production e Preview). In locale si possono usare le chiavi di test Cloudflare indicate in [`.env.example`](../.env.example). |
| `TURNSTILE_SECRET_KEY`           | **Privata** | Segreto per la verifica server del form contatti. Su Vercel è Sensitive. La stessa chiave va incollata su Supabase (Attack Protection) solo dopo il deploy del widget.                                             |
| `KV_REST_API_URL`                | **Privata** | URL REST del database Upstash `ratelimit`. La inietta il collegamento Upstash su Vercel. In locale, se manca, il limite sul form contatti viene saltato.                                                           |
| `KV_REST_API_TOKEN`              | **Privata** | Token di scrittura dello stesso database. Non va nel browser. Il codice usa questi due nomi (`KV_*`), non `UPSTASH_REDIS_REST_*`.                                                                                  |

---

## 📚 Riferimenti

- **File esempio:** [`.env.example`](../.env.example)
- **Supabase:** [`docs/supabase.md`](supabase.md)
- **SSO verso Frontline:** [`docs/sso.md`](sso.md)
- **Protezione anti-bot:** [`docs/anti_bot.md`](anti_bot.md)
- **Deploy e variabili su Vercel:** [`docs/deploy.md`](deploy.md)
