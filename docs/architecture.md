# Architettura

Panoramica dell'architettura tecnica del sito Acme Labs e dello stack utilizzato.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Come funziona](#️-come-funziona)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Il sito `example.com` è una piattaforma B2B SaaS che funge da vetrina ed e-commerce per le app di Acme Labs. Le aziende clienti si registrano sul sito, acquistano un'app tramite abbonamento mensile e accedono al servizio acquistato tramite un redirect verso la dashboard del singolo prodotto.

Punti chiave:

- Frontend e backend leggero unificati in un singolo progetto Next.js (App Router).
- Rendering ibrido: pagine statiche per marketing, server components per dashboard e contenuti dinamici.
- Identità visiva fissa in dark theme premium (sfondo quasi nero `#06070A`, accent blu `#4C8DFF`, accento decorativo violetto per gli sfondi "aurora"), con font Space Grotesk (titoli) + DM Sans (testo) e micro-animazioni Motion.
- Nessuna gestione dei servizi venduti dentro questa repo: il sito si occupa solo di vetrina, registrazione, checkout e redirect verso le dashboard dei prodotti.

---

## ⚙️ Come funziona

### Tech stack

| Categoria          | Tecnologia                                             |
| ------------------ | -------------------------------------------------------|
| Framework          | Next.js 16 (App Router, React Server Components)       |
| Linguaggio         | TypeScript 6                                           |
| UI runtime         | React 19                                               |
| Styling            | Tailwind CSS v4                                        |
| Componenti UI      | shadcn/ui (stile "new-york", base color neutral)       |
| Form & validazione | react-hook-form + zod (`@hookform/resolvers`)          |
| Backend / Auth     | Supabase (`@supabase/supabase-js`, `@supabase/ssr`)    |
| Pagamenti          | Stripe (`stripe ^22`, API `2026-04-22.dahlia`)         |
| JWT SSO            | jose (HS256 verso Frontline)                           |
| Email              | Resend                                                 |
| Icone              | lucide-react                                           |
| Font               | Space Grotesk (titoli) + DM Sans (testo), Google Fonts |
| Animazioni         | Motion (ex Framer Motion)                              |
| Notifiche toast    | sonner                                                 |
| Linting            | ESLint 9 (preset `next/core-web-vitals`)               |
| Test               | Vitest                                                 |
| Hosting            | Vercel                                                 |

### Struttura del codice

Il codice sorgente vive in `src/` ed è organizzato per responsabilità:

```text
src/
├── app/
│   ├── (site)/       # Route group: Navbar + Footer (URL invariati)
│   │   ├── layout.tsx
│   │   ├── page.tsx  # Home
│   │   ├── auth/
│   │   ├── checkout/
│   │   ├── contact/
│   │   ├── privacy/
│   │   ├── products/
│   │   └── terms/
│   ├── (dashboard)/  # Route group: sidebar al posto di Navbar/Footer (area autenticata, URL invariati)
│   │   ├── layout.tsx
│   │   └── dashboard/  # Overview (statistiche + scorciatoie), apps (lista abbonamenti, Open app via SSO), settings (cambio password)
│   ├── api/          # Route Handlers (webhook Stripe, ecc.)
│   ├── blocked/      # Pagina geoblocking — fuori dal gruppo, senza Navbar/Footer
│   ├── globals.css
│   ├── layout.tsx       # Root: html/body/font/metadata/Toaster
│   ├── error.tsx        # Error boundary per le route sotto il layout root
│   ├── global-error.tsx # Error boundary per errori nel root layout stesso
│   └── loading.tsx      # Fallback di caricamento generico durante la navigazione
├── components/
│   ├── dashboard/    # Componenti specifici della dashboard
│   ├── layout/       # Componenti di layout (navbar, footer, ecc.)
│   ├── products/     # Componenti della pagina prodotti
│   └── ui/           # Componenti shadcn/ui
└── lib/
    ├── auth/         # Helper di autenticazione (es. lista domini bloccati, isSafeNextPath)
    ├── dashboard/    # Query server-only per la dashboard
    ├── geo/          # Geoblocking (whitelist 42 paesi, isCountryAllowed)
    ├── hooks/        # Hook client condivisi (es. useFocusTrap per i drawer mobile)
    ├── http/         # Helper HTTP server-only (es. getRequestOrigin)
    ├── motion/       # Provider e varianti Motion condivise
    ├── products/     # Query server-only per il catalogo prodotti
    ├── resend/       # Client Resend per il form di contatto
    ├── stripe/       # Client Stripe e webhook handlers
    ├── supabase/     # Client Supabase per server e admin (nessun client browser)
    ├── sso/          # Firma JWT di accesso verso Frontline
    ├── validations/  # Schemi zod per la validazione dei form
    └── utils.ts      # Helper `cn` per le classi Tailwind
```

Per la struttura completa della repo vedi [`repo_structure.md`](repo_structure.md).

### Flusso utente (visione d'insieme)

```text
[Visitatore] → [Geoblocking (proxy)] → [Sito marketing] → [Registrazione] → [Checkout] → [Redirect firmato SSO] → [Dashboard prodotto]
```

Il proxy Next.js (`src/proxy.ts`) è il primo punto di ingresso. L'ordine reale dei controlli è: (1) geoblocking per paese (in produzione legge l'header `x-vercel-ip-country` iniettato da Vercel e blocca con `403 rewrite → /blocked` i visitatori da paesi non in whitelist); (2) refresh sessione Supabase e redirect delle rotte protette/auth. Lo staging è protetto a livello piattaforma da Vercel Authentication, non dal proxy.

Il sito Acme Labs si ferma al checkout e alla dashboard account: una volta completato l'acquisto, il cliente apre l'app da "Open app". Al click il server firma un JWT fresco e univoco (`sso_token`, 60 secondi, con `jti` e slug del prodotto) così Frontline può riconoscere l'azienda senza un secondo login. Dettagli in [`docs/sso.md`](sso.md).

---

## 📚 Riferimenti

- **Struttura repo**: [`docs/repo_structure.md`](repo_structure.md)
- **Configurazione**: [`docs/config.md`](config.md)
- **Deploy**: [`docs/deploy.md`](deploy.md)
- **Sicurezza accessi:** [`docs/security.md`](security.md)
- **SSO verso Frontline:** [`docs/sso.md`](sso.md)
- **Stripe:** [`docs/stripe.md`](stripe.md)
- **Risorse esterne**:
  - [Next.js docs](https://nextjs.org/docs)
  - [Tailwind CSS v4](https://tailwindcss.com/docs)
  - [shadcn/ui](https://ui.shadcn.com)
  - [Stripe docs](https://stripe.com/docs)
