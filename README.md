# B2B SaaS Website

Sito aziendale e piattaforma B2B SaaS di **Acme Labs, Inc.** per la vendita di app software in abbonamento.

- **Versione:** `0.39.0`
- **URL produzione (target):** [example.com](https://example.com)

---

## 🚦 Stato del progetto

Il sito ha **due ambienti separati** su Vercel, ciascuno legato a un branch Git:

- **Staging** (branch `staging`) — ambiente di test, dove avviene tutto lo sviluppo.
- **Produzione** (branch `main`) — attiva su `<project>.vercel.app`.

---

## 📋 Indice

- [🚦 Stato del progetto](#-stato-del-progetto)
- [📄 Panoramica](#-panoramica)
- [✨ Funzionalità](#-funzionalità)
- [🧱 Stack tecnologico](#-stack-tecnologico)
- [🚀 Avvio rapido](#-avvio-rapido)
- [📚 Documentazione](#-documentazione)

---

## 📄 Panoramica

Acme Labs è un'azienda specializzata nella vendita di app software in abbonamento (modello B2B).

Questo sito è la vetrina ed e-commerce ufficiale dell'azienda. Permette alle aziende clienti di registrarsi — l'accesso è riservato alle aziende munite di partita IVA / tax ID — acquistare app tramite abbonamento mensile a prezzo fisso, e gestirle da una dashboard dedicata che fa da ponte verso le singole web app dei prodotti.

Il sito è interamente in **lingua inglese**.

---

## ✨ Funzionalità

- **Landing page** istituzionale per presentare Acme Labs e i suoi prodotti.
- **E-commerce** integrato per l'acquisto delle app con prezzi fissi mensili (checkout e abbonamenti gestiti via Stripe).
- **Dashboard** clienti per gestire le app sottoscritte, vedere lo stato dell'abbonamento e accedere alle web app dei prodotti.
- **Autenticazione** aziendale per registrazione e login (solo email aziendali, tax ID obbligatorio).
- **Accesso SSO** alle web app dei prodotti acquistati: al click su "Open app" viene generato un token firmato che evita un secondo login.
- **Form di contatto** con invio email tramite Resend.
- **Protezione anti-bot**: Cloudflare Turnstile su login, registrazione, cambio password e form contatti. Il form contatti ha anche un limite di 3 messaggi ogni 10 minuti per IP.
- **Geoblocking** per paese: accesso consentito solo ai 42 paesi in whitelist; tutti gli altri ricevono una pagina di blocco dedicata (`/blocked`). Il controllo avviene via header `x-vercel-ip-country` nel proxy Next.js.

---

## 🧱 Stack tecnologico

| Ambito          | Tecnologia                                   |
|-----------------|----------------------------------------------|
| Framework       | Next.js 16 (App Router)                      |
| UI              | React 19, Tailwind CSS v4, shadcn/ui         |
| Linguaggio      | TypeScript                                   |
| Database + Auth | Supabase (PostgreSQL)                        |
| Pagamenti       | Stripe (abbonamenti mensili)                 |
| Email           | Resend                                       |
| Anti-bot        | Cloudflare Turnstile, Upstash Redis          |
| Hosting         | Vercel                                       |
| Test            | Vitest                                       |

---

## 🚀 Avvio rapido

Requisiti: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Il sito sarà raggiungibile su [http://localhost:3000](http://localhost:3000).

### Script disponibili

| Comando              | Descrizione                                    |
|----------------------|------------------------------------------------|
| `npm run dev`        | Avvia il server di sviluppo con hot reload.    |
| `npm run build`      | Crea la build di produzione.                   |
| `npm run start`      | Avvia il server di produzione (dopo `build`).  |
| `npm run lint`       | Esegue ESLint sul progetto.                    |
| `npm test`           | Esegue i test con Vitest.                      |
| `npm run test:watch` | Esegue i test in modalità watch.               |

---

## 📚 Documentazione

La documentazione completa si trova nella cartella [`docs/`](docs):

- [Architettura e tech stack](docs/architecture.md)
- [Struttura della repo](docs/repo_structure.md)
- [Endpoint API](docs/api_endpoints.md)
- [Configurazione](docs/config.md)
- [Deploy](docs/deploy.md)
- [Supabase](docs/supabase.md)
- [Stripe](docs/stripe.md)
- [Observability](docs/observability.md)
- [Sicurezza degli accessi](docs/security.md)
- [Protezione anti-bot](docs/anti_bot.md)
- [SSO verso Frontline](docs/sso.md)
- [Whitelist e blacklist paesi](docs/wl_and_bl_country.md)
- [Privacy Policy](docs/website/privacy_policy.md)
- [Terms & Conditions](docs/website/terms_and_conditions.md)
- [Changelog](CHANGELOG.md)
