<!-- markdownlint-disable -->
# 📋 Changelog

## 0.39.0 — 2026-11-01

### Changed

- Anonimizzazione del progetto: nome pacchetto `b2b-saas-website`, rotte e funzioni da workers ad apps, dati societari e di contatto fittizi, clausole dei Terms riscritte, valori SSO, seed Frontline con ID segnaposto, logo rimosso, documenti riallineati, versione bumped a `0.39.0`.

---

## 0.38.0 — 2026-10-07

### Added

- Il token SSO include un `jti` univoco (UUID) e il claim `product` (slug del prodotto). `generateSsoToken` lo riceve dalla subscription attiva. Il controllo "già usato" arriverà lato Frontline: fino ad allora lo stesso token può essere riusato entro i 60 secondi.

### Changed

- La firma di `generateSsoToken` ora richiede anche `productSlug`.
- `docs/sso.md`, `docs/security.md`, `docs/architecture.md`, `docs/repo_structure.md`.
- `package.json` e `README.md`: versione bumped a `0.38.0`.

---

## 0.37.0 — 2026-10-07

### Added

- Al checkout Stripe il tax ID è obbligatorio quando Stripe lo supporta per il paese (`tax_id_collection.required = if_supported`). Se il cliente esiste già, il nome viene salvato con `customer_update.name = auto`.
- Webhook `customer.tax_id.created` e `customer.tax_id.updated`: se Stripe segna il numero `unverified` o `unavailable`, l'azienda viene marcata da controllare e parte una sola email di avviso. `verified` toglie il flag. `pending` non fa nulla.
- Migration `0008_add_tax_id_review_flag.sql` e `src/lib/resend/alerts.ts`.

### Changed

- `docs/stripe.md`, `docs/supabase.md`, `docs/api_endpoints.md`, `docs/observability.md`, `docs/repo_structure.md`, `docs/security.md` e la Privacy Policy. Il testo della privacy va riletto.
- `package.json` e `README.md`: versione bumped a `0.37.0`.

---

## 0.36.0 — 2026-10-06

### Added

- Registrazione: menu Paese (i 42 paesi ammessi) e controllo del formato del tax ID. Per i 23 paesi UE, e per i numeri britannici che iniziano per `XI`, il numero viene verificato su VIES prima di creare l'account. Se VIES non risponde, la registrazione si ferma.
- `src/lib/tax-id/` (paesi, normalizzazione, formati, client VIES) e `src/components/ui/select.tsx`.
- Rate limit sulla registrazione: 10 tentativi ogni 10 minuti per IP, stessa logica fail-open del form contatti.
- Migration `0007_add_tax_id_country.sql`: colonne `tax_id_country` e `tax_id_verification`. L'utente loggato non può più modificare il proprio tax ID.

### Changed

- Il tax ID in registrazione non ha più un minimo di 4 caratteri né un esempio nel campo. Si salva normalizzato, con il paese e l'esito del controllo.
- Privacy Policy (pagina e `docs/website/privacy_policy.md`): il numero IVA UE viene controllato sul servizio VIES della Commissione Europea. Va riletto.
- `docs/supabase.md`, `docs/api_endpoints.md`, `docs/repo_structure.md`, `docs/security.md`, `docs/anti_bot.md`.
- `package.json` e `README.md`: versione bumped a `0.36.0`.

### Fixed

- Un numero che VIES rifiuta con `INVALID_INPUT` mostra "This VAT number was not found in the EU VIES database." invece del messaggio di servizio temporaneamente non disponibile.
- Le voci del menu Paese in registrazione sono testo scuro su sfondo chiaro, leggibili sul tema scuro del sito.

---

## 0.35.0 — 2026-10-06

### Added

- Cloudflare Turnstile su login, registrazione, cambio password e form contatti. Login, registrazione e cambio password passano il token a Supabase (`captchaToken`). Il form contatti lo verifica sul server prima di Resend.
- Limite sul form contatti: 3 messaggi ogni 10 minuti per IP (Upstash, finestra scorrevole). Se Upstash non risponde o le variabili mancano, il messaggio passa comunque e Turnstile resta attivo.
- Campo nascosto (honeypot) sul form contatti: se è compilato, il sito risponde con un successo finto e non invia l'email.
- `src/lib/security/` (`turnstile.ts`, `rate-limit.ts`, `client-ip.ts`), `src/components/ui/turnstile-widget.tsx` e `docs/anti_bot.md`.
- CSP report-only: `https://challenges.cloudflare.com` in `script-src`, `frame-src` e `connect-src`.

### Changed

- Errore Supabase `captcha_failed` mostrato come "Verification failed. Please try again." Sul cambio password non viene più confuso con la password attuale sbagliata.
- `docs/security.md`, `docs/config.md`, `docs/repo_structure.md`, `docs/api_endpoints.md`, `docs/observability.md`, `README.md` e `.env.example` allineati alla protezione anti-bot.
- `package.json` e `README.md`: versione bumped a `0.35.0`.

---

## 0.34.1 — 2026-10-05

### Security

- `next` aggiornato da `16.3.3` a `16.3.6` per correggere la vulnerabilità RCE in `ImageResponse` di `next/og` (Node.js runtime, versioni `>= 16.2.0, < 16.3.6`) segnalata da Dependabot. Il sito non usa `next/og`, quindi non era sfruttabile, ma la dipendenza è stata comunque allineata.

### Changed

- `package.json`, `package-lock.json` e `README.md`: versione bumped a `0.34.1`.

---

## 0.34.0 — 2026-09-21

### Changed

- Protezione dello staging spostata dal codice a **Vercel Deployment Protection** (Vercel Authentication, Standard Protection). I webhook Stripe di staging passano con Protection Bypass for Automation (`?x-vercel-protection-bypass=<secret>` sull'URL, secret nel pannello Vercel).
- `src/proxy.ts`: rimosso il cancello a password e il bypass su `/unlock`; restano geoblocking, refresh sessione e redirect delle rotte protette/auth.
- `docs/security.md`, `docs/deploy.md`, `docs/stripe.md`, `docs/config.md`, `docs/api_endpoints.md`, `docs/architecture.md`, `docs/repo_structure.md`: allineati alla protezione Vercel.
- `src/app/(site)/privacy/page.tsx` e `docs/website/privacy_policy.md` (ITA + ENG): rimosso il cookie `staging_access`.
- `package.json` e `README.md`: versione bumped a `0.34.0`.

### Removed

- `src/app/unlock/`, `src/lib/staging/`, `tests/staging-access.test.ts`, `tests/unlock-staging-action.test.ts`.
- Variabile `STAGING_PASSWORD` (`.env.example`, `docs/config.md`, `docs/deploy.md`).
- Cookie `staging_access`.

---

## 0.33.4 — 2026-09-20

### Added

- `src/lib/auth/callback-errors.ts`: codici interni (`link_expired`, `link_invalid`, `auth_failed`) e messaggi fissi per gli errori del link di conferma email, così `/auth/callback` non riflette più testo arbitrario nell'URL.
- `tests/auth-callback-route.test.ts`, `tests/callback-errors.test.ts`, `tests/request-origin.test.ts`: copertura per il callback Auth, i codici d'errore e `getRequestOrigin`.

### Changed

- `src/lib/http/request-origin.ts`: `getRequestOrigin` è ora sincrona, non legge più Host/`X-Forwarded-Proto`, valida `NEXT_PUBLIC_SITE_URL` e la richiede in produzione (in locale fallback a `http://localhost:3000`).
- `src/lib/validations/auth.ts`: limite massimo password a 128 caratteri (`PASSWORD_MIN_LENGTH` / `PASSWORD_MAX_LENGTH`).
- `src/app/(site)/auth/login/page.tsx`: mostra i messaggi d'errore del callback di conferma email (solo i 3 codici interni noti).
- `docs/config.md`, `docs/deploy.md`, `docs/security.md`, `docs/api_endpoints.md`, `docs/supabase.md`, `docs/observability.md`, `docs/repo_structure.md`: origin fisso da env, max password, errori callback e prefisso `[authCallback]`.
- `package.json` e `README.md`: versione bumped a `0.33.4`.

### Fixed

- Origin usata per i link di conferma email e gli URL Stripe: non è più ricostruibile da un header Host falsificabile (host-header injection).
- Errori del link di conferma email (scaduto, già usato, invalido) ora visibili sulla pagina di login invece di un redirect silenzioso.

---

## 0.33.3 — 2026-09-20

### Fixed

- `src/app/unlock/actions.ts`: il controllo anti open-redirect su `next` era scritto a mano e bloccava solo i redirect verso `//host`, non il trucco equivalente `/\host` (interpretato dai browser come protocol-relative). Sostituito con `isSafeNextPath` ([`src/lib/auth/safe-redirect.ts`](src/lib/auth/safe-redirect.ts)), la stessa guardia già usata da login e `/auth/callback`, che copre tutti e 3 i casi. Aggiunto il caso di test mancante in `tests/unlock-staging-action.test.ts`.

### Changed

Review e correzione della documentazione rispetto allo stato reale del codice, in seguito ad audit completo di `docs/`:

- `docs/stripe.md`, `docs/supabase.md`: il diagramma del webhook Stripe descriveva `status = 'active'` come valore fisso; sostituito con la mappatura reale `mapStripeStatusToDbStatus` (`active`/`trialing` → `active`, `past_due`/`unpaid`/`paused` → `past_due`, `canceled`/`incomplete_expired` → `canceled`, `incomplete` di default), la persistenza di `companies.stripe_customer_id` e il comportamento su errore (upsert/update falliti → `throw` → `500` → retry Stripe).
- `docs/supabase.md`: corretto il passo 1 del flusso checkout (`getCurrentCompany()` invece di `auth.getUser()`); aggiunta la guardia anti-enumerazione mancante nel flusso di signup; riscritta la sezione "Flusso dashboard" per riflettere le 3 pagine reali (Overview, My Apps, Settings) e l'apertura delle app via token SSO invece di un link statico a `web_app_url`; rimosso il jargon "Fase N" residuo di una roadmap chiusa; sistemato il link rotto verso `dev_support/` (cartella non versionata).
- `docs/architecture.md`: rimosso il riferimento a un client Supabase browser non più esistente (rimosso in 0.33.1); aggiornata la descrizione della pagina Settings (non più un placeholder); aggiunti `lib/motion/`, `error.tsx`, `global-error.tsx`, `loading.tsx` all'albero della struttura; completata la tabella tech stack con Resend, Vitest e sonner.
- `docs/api_endpoints.md`: corretta la panoramica (copre sia Route Handler che server action, non solo le prime); documentate le 5 server action che mancavano (`signupAction`, `loginAction`, `logoutAction`, `changePasswordAction`, `unlockStagingAction`).
- `docs/deploy.md`: aggiunte le variabili `STAGING_PASSWORD` e `SSO_SHARED_SECRET`, mancanti dalla tabella delle variabili d'ambiente Vercel.
- `docs/website/privacy_policy.md`, `src/app/(site)/privacy/page.tsx`: aggiunto il cookie `sidebar_collapsed` alla tabella cookie della sezione 3.5 (ITA, ENG e pagina reale), non documentato in precedenza.
- `docs/observability.md`: aggiunti i prefissi di log mancanti (`changePasswordAction`, `openProductAppAction`, `sendContactMessageAction`, `getProductNameBySlug`), una nota sugli error boundary applicativi e il Resend Dashboard come fonte di log.
- `docs/sso.md`: chiarito perché `OpenAppButton` apre una scheda vuota in modo sincrono al click, prima ancora di conoscere l'URL firmato (per non far bloccare il popup dal browser).
- `README.md`: aggiunta la funzionalità SSO all'elenco, aggiunti i link mancanti a Privacy Policy, Terms & Conditions e Changelog.
- `docs/TEMPLATE.md`: sostituito l'esempio di test `pytest` (incoerente con lo stack Vitest del progetto) con `npm test`; aggiunta una nota che rende esplicita l'eccezione di formato già in uso per i documenti di tipo lista/albero (`repo_structure.md`, `wl_and_bl_country.md`).
- `package.json` e `README.md`: versione bumped a `0.33.3`.

---

## 0.33.2 — 2026-09-19

### Fixed

- Build Vercel rotta da `0.32.3`: TypeScript `TS18047` su `src/lib/hooks/use-focus-trap.ts` — la guardia `if (!container) return` non veniva ereditata dalla closure `handleKeyDown`. Ripetuto il null-check dentro l'handler.

### Changed

- `package.json` e `README.md`: versione bumped a `0.33.2`.

---

## 0.33.1 — 2026-09-19

### Added

- `src/lib/hooks/use-logout.ts` (`useLogout`): hook condiviso per il logout, riusato da `LogoutButton` e `CompactLogoutButton` (prima duplicavano lo stesso `useTransition` + `logoutAction`).
- `src/lib/hooks/use-drawer.ts` (`useDrawer`): hook condiviso per lo stato open/close dei drawer mobile (chiusura su cambio pagina, blocco scroll, `Escape`), riusato da `MobileNavMenu` e `DashboardSidebar`.
- `src/components/dashboard/NoAppsEmptyState.tsx` e `src/lib/dashboard/date-formatter.ts`: estratti da `dashboard/page.tsx` e `apps/page.tsx`, che duplicavano lo stesso empty state e lo stesso formattatore data.

### Changed

- `src/components/ui/spotlight-card.tsx`: esportata `SPOTLIGHT_CARD_BASE_CLASSNAME`, riusata da `BillingShortcutCard` al posto di classi Tailwind duplicate.
- `src/app/(site)/products/actions.ts`, `src/app/(dashboard)/dashboard/apps/actions.ts`, `src/app/(dashboard)/dashboard/actions.ts`, `src/app/(site)/contact/actions.ts`: i tipi di ritorno (`CheckoutResult`, `OpenProductAppResult`, `BillingPortalResult`, `ContactResult`) sono ora esportati, uniformando la convenzione già usata per `SignupActionResult`/`LoginActionResult`/`ChangePasswordResult`.
- `docs/supabase.md`, `docs/config.md`, `docs/stripe.md`, `docs/deploy.md`, `.env.example`: rimossi i riferimenti a `src/lib/supabase/client.ts` e `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, entrambi non più (o mai) usati nel codice.
- `docs/repo_structure.md`: allineata alla pulizia (hook condivisi, empty state, date formatter, rimozione `client.ts`/`fadeIn`).
- `package.json` e `README.md`: versione bumped a `0.33.1`.

### Removed

- `src/lib/supabase/client.ts`: client Supabase per il browser, mai importato da nessun componente client del progetto.
- `fadeIn` in `src/lib/motion/variants.ts`: variante Motion mai utilizzata.

---

## 0.33.0 — 2026-09-19

### Added

- `src/app/error.tsx` e `src/app/global-error.tsx`: error boundary applicativo, prima assente — mostra un messaggio con bottone "Try again" invece della pagina di errore nuda di Next.js.
- `src/app/loading.tsx`: fallback di caricamento generico durante la navigazione tra route.

### Changed

- `package.json` e `README.md`: versione bumped a `0.33.0`.
- `docs/repo_structure.md`: aggiunti `error.tsx`, `global-error.tsx` e `loading.tsx`.

---

## 0.32.3 — 2026-09-19

### Added

- `src/lib/http/request-origin.ts` (`getRequestOrigin`): helper condiviso per costruire l'origin assoluto (URL email, Stripe), riusato da `signup/actions.ts`, `products/actions.ts` e `dashboard/actions.ts` al posto di 3 implementazioni leggermente diverse.
- `src/lib/hooks/use-focus-trap.ts` (`useFocusTrap`): focus trap condiviso per i drawer mobile, con spostamento del focus all'apertura e ripristino alla chiusura.
- `supabase/migrations/0006_harden_rls_and_grants.sql`: restringe l'UPDATE su `companies` alle sole colonne `company_name`/`tax_id` (GRANT per-colonna), nasconde i prodotti `archived` ad `anon`, e restringe l'`EXECUTE` di default sulle funzioni future dello schema `website` al solo `service_role`.

### Changed

- `src/lib/dashboard/queries.ts`: `getCurrentCompany` avvolta in `cache()` di React per deduplicare le chiamate multiple nello stesso request (layout + page); rimossa la funzione ridondante `getStripeCustomerId` (il dato è già in `company.stripe_customer_id`).
- `src/lib/products/queries.ts` (`getAvailableProducts`): esclude ora i prodotti con `status = 'archived'` dal catalogo pubblico.
- Documentazione (`docs/api_endpoints.md`, `docs/supabase.md`, `docs/architecture.md`, `docs/stripe.md`, `docs/observability.md`, `docs/repo_structure.md`): allineata ai path reali con route group `(site)`/`(dashboard)` e ai comportamenti attuali (redirect post-login, fonte di verità `stripe_customer_id`, policy RLS aggiornate).
- `package.json` e `README.md`: versione bumped a `0.32.3`.

### Fixed

- `src/components/dashboard/OpenAppButton.tsx`: il popup dell'app veniva aperto dopo un `await`, perdendo il gesto utente e venendo bloccato dal browser. Ora la finestra viene aperta in modo sincrono al click e navigata una volta pronto l'URL firmato.
- `src/components/layout/MobileNavMenu.tsx` e `src/components/dashboard/DashboardSidebar.tsx`: i drawer mobile non avevano focus trap né `role="dialog"`/`aria-modal`, permettendo al Tab di uscire dal drawer verso il resto della pagina; la sidebar collassata perdeva il nome accessibile delle voci di menu (solo icona, nessun `aria-label`).

---

## 0.32.2 — 2026-09-19

### Added

- Test unitari sul blocco autenticazione/accesso, finora scoperto: `tests/login-action.test.ts`, `tests/signup-action.test.ts` (inclusa la guardia anti-enumerazione introdotta in 0.32.1), `tests/logout-action.test.ts`, `tests/change-password-action.test.ts`, `tests/unlock-staging-action.test.ts`, `tests/stripe-webhook-route.test.ts` (verifica end-to-end della propagazione errori introdotta in 0.32.1) e `tests/proxy.test.ts` (verifica end-to-end del fix sulla query string introdotto in 0.32.1).

### Changed

- `docs/repo_structure.md`: aggiunti `src/lib/auth/safe-redirect.ts` e i 7 nuovi file di test del blocco autenticazione/accesso.
- `package.json` e `README.md`: versione bumped a `0.32.2`.

---

## 0.32.1 — 2026-09-19

### Fixed

- `src/app/(site)/auth/callback/route.ts`: open redirect — il parametro `next` veniva concatenato all'origin senza validazione, permettendo redirect verso domini esterni (es. `next=@evil.com` → `https://example.com@evil.com`). Estratta la validazione già presente in `login/actions.ts` in `src/lib/auth/safe-redirect.ts` (`isSafeNextPath`), ora condivisa da entrambe le route.
- `src/lib/stripe/webhook-handlers.ts`: lo status della subscription al checkout completato era scritto hardcoded come `"active"` invece di leggere lo status reale da Stripe; gli status Stripe non presenti nell'enum del DB (`trialing`, `unpaid`, `paused`, `incomplete_expired`) causavano un fallimento silenzioso dell'update. Aggiunta la mappatura `mapStripeStatusToDbStatus` sui 4 status esistenti. Inoltre, un fallimento dell'upsert/update su Supabase veniva solo loggato mentre la route rispondeva comunque `200` a Stripe, impedendo il retry automatico: ora l'errore viene propagato (throw) e la route risponde `500`, così Stripe ritenta la consegna del webhook.
- `src/app/(site)/auth/signup/actions.ts`: se l'email risultava già registrata a un account confermato, Supabase ritornava l'utente esistente (comportamento anti-enumerazione, `identities` vuoto) senza errore; un fallimento dell'insert su `companies` avrebbe chiamato `deleteUser` su quell'account esistente invece che su un utente nuovo. Aggiunto un controllo esplicito su `identities` prima di procedere.
- `src/proxy.ts`: il cancello password di staging perdeva la query string nel redirect verso `/unlock` (es. `?code=...` del link di conferma email), rompendo la conferma email quando il cancello era attivo. Ora `next` include l'intera query string originale.

### Changed

- `package.json` e `README.md`: versione bumped a `0.32.1`.

---

## 0.32.0 — 2026-09-17

### Added

- Security header HTTP in `next.config.ts`, applicati a tutte le route: `X-Frame-Options` (`DENY`), `X-Content-Type-Options` (`nosniff`), `Referrer-Policy` (`strict-origin-when-cross-origin`), `Permissions-Policy` (camera/microphone/geolocation disabilitate). Content-Security-Policy in modalità **report-only** (`Content-Security-Policy-Report-Only`): il browser segnala le violazioni in console senza bloccare nulla, per osservare Stripe/Supabase/font/hydration Next.js prima di attivarla in enforced. In sviluppo `script-src` include `'unsafe-eval'` (HMR); `connect-src` include l'origin di `NEXT_PUBLIC_SUPABASE_URL` e il corrispondente `wss:`.
- Test unitari per i flussi di pagamento: `tests/create-checkout-session-action.test.ts`, `tests/create-billing-portal-session-action.test.ts`, `tests/webhook-handlers.test.ts` (inclusi gli scenari del blocco `incomplete` e della rete di sicurezza sul webhook).

### Changed

- Password minima di signup e cambio password portata da 32 a 16 caratteri in `src/lib/validations/auth.ts`. Placeholder aggiornati in `src/app/(site)/auth/signup/page.tsx` e `src/components/dashboard/ChangePasswordForm.tsx`.
- `src/lib/stripe/server.ts`: rimosso il cast `as any` sull'`apiVersion` pinnata `"2026-04-22.dahlia"`; sostituito con `@ts-expect-error` commentato (l'SDK tipizza solo la snapshot più recente, il pin resta intenzionale).
- Script `lint` in `package.json`: da `next lint` (rimosso in Next.js 16) a `eslint .`.
- `docs/security.md`, `docs/repo_structure.md`, `docs/stripe.md`, `docs/supabase.md`, `docs/api_endpoints.md`: aggiornati per riflettere header HTTP, checkout/webhook e requisito password.
- `package.json` e `README.md`: versione bumped a `0.32.0`.

### Fixed

- `src/app/(site)/products/actions.ts` (`createCheckoutSessionAction`): un nuovo checkout era bloccato solo con subscription `active`/`past_due`. Con stato `incomplete` (pagamento iniziale fallito) si poteva aprire un secondo checkout e creare una seconda subscription Stripe reale; l'upsert sul webhook sovrascriveva la riga nel DB lasciando la vecchia a fatturare in silenzio. Il blocco copre ora anche `incomplete`, con messaggio dedicato.
- `src/lib/stripe/webhook-handlers.ts` (`handleCheckoutSessionCompleted`): rete di sicurezza — se esiste già una riga per la stessa coppia `(company_id, product_id)` con uno `stripe_subscription_id` diverso, la subscription superata viene cancellata su Stripe prima dell'upsert. Un fallimento del cancel è non fatale (già cancellata/inesistente) e non blocca l'upsert.

---

## 0.31.1 — 2026-09-15

### Fixed

- `src/components/dashboard/BillingShortcutCard.tsx`: aggiunto il bagliore al passaggio del mouse, mancante rispetto alle altre due scorciatoie dell'Overview ("app", "Settings") perché è un bottone con azione propria e non un semplice link — non poteva riusare `SpotlightCard` così com'è. Estratta la logica del bagliore (gestore del movimento del mouse, layer del gradiente) da `src/components/ui/spotlight-card.tsx` in una forma riusabile, condivisa ora da entrambi. Nessun cambio a logica di click, spinner o gestione errori.
- `src/app/(dashboard)/dashboard/apps/page.tsx` (`SubscriptionCard`): il titolo del prodotto e il badge di stato potevano andare a capo a metà parola su viewport stretti (es. un nome di prodotto spezzato a metà parola), quando non c'era spazio sufficiente per stare sulla stessa riga. Il badge ora scende sotto al titolo invece di spezzarlo.
- `docs/repo_structure.md`: aggiornato per riflettere il bagliore ora presente su `BillingShortcutCard.tsx` e i nuovi export riusabili di `spotlight-card.tsx`.
- `package.json`: versione bumped a `0.31.1`.

---

## 0.31.0 — 2026-09-14

### Added

- **Restyling completo della dashboard privata** (route group `(dashboard)`: Sidebar, Overview, app, Settings), a completamento del restyling iniziato con la zona pubblica in v0.30.0 — stessa identità visiva (palette, font, componenti "vetro") ma trattamento più sobrio, pensato per un'area di uso quotidiano: niente `AuroraBackground`, bagliore al passaggio del mouse solo sulle card cliccabili che lo supportano. Nessun cambio di logica, testi o validazione (unica eccezione: il sottotitolo aggiunto a Settings riprende testo già esistente nei metadata della pagina).
- `src/app/globals.css`: nuovo token colore `--color-warning` (ambra) e `--color-warning-foreground`, per lo stato abbonamento "Past due" (prima usava un giallo Tailwind non appartenente alla palette del progetto).

### Changed

- `src/components/dashboard/DashboardSidebar.tsx`: sfondo `bg-card` (si stacca dal contenuto principale), stato di navigazione attivo con tinta `primary` (`bg-primary/10 text-primary`) invece del generico `bg-accent`, hover distinti per il toggle collassa/espandi (tinta `primary`) e per il logout (tinta `destructive`), topbar mobile e drawer con `backdrop-blur`.
- `src/app/(dashboard)/layout.tsx`: `bg-background` esplicito sul contenitore.
- `src/app/(dashboard)/dashboard/page.tsx` (Overview): card statistiche con icona in riquadro colorato, scorciatoie riscritte con `SpotlightCard`, `EmptyState`/`AttentionBanner` in stile vetro, animazioni di apparizione con `MotionStagger`/`MotionItem`.
- `src/components/dashboard/BillingShortcutCard.tsx`: stesso trattamento vetro e riquadro icona delle altre scorciatoie (il bagliore al passaggio del mouse, non replicabile con lo stesso componente perché è un bottone e non un link, resta fuori da questa versione).
- `src/components/dashboard/SubscriptionStatusBadge.tsx`: lo stato "Past due" usa ora il nuovo token `--color-warning` invece del giallo grezzo.
- `src/components/dashboard/OpenAppButton.tsx`: usa ora il componente `Button` condiviso invece di markup manuale (stesso trattamento già applicato a `ProductCtaButton` in v0.30.0).
- `src/app/(dashboard)/dashboard/apps/page.tsx`: card abbonamento in stile vetro con altezza uniforme, empty state allineato a quello dell'Overview, bottone "Open app" disabilitato convertito al componente `Button` (variante `outline`), animazioni con `MotionStagger`/`MotionItem`.
- `src/app/(dashboard)/dashboard/settings/page.tsx`: aggiunto sottotitolo "Manage your account settings." (testo già presente nei metadata, ora reso visibile per coerenza con le altre pagine della dashboard), form racchiuso in `AuthCard`.
- `src/components/dashboard/ChangePasswordForm.tsx`: rimosso il vincolo di larghezza `max-w-md` sul form, ora gestito dal contenitore `AuthCard`.
- `docs/repo_structure.md`: aggiornato per riflettere il restyling della dashboard e il nuovo token colore.
- `package.json`: versione bumped a `0.31.0`.

---

## 0.30.0 — 2026-09-13

### Added

- **Restyling completo della zona pubblica del sito** (Home, Products, Login, Registrazione, Contact, Privacy, Terms, esito Checkout, Blocked, Unlock — Navbar e Footer incluse), a parità di dark mode ma con un trattamento visivo premium: nuova palette (`docs/architecture.md`), font Space Grotesk (titoli) + DM Sans (testo) al posto di Inter, sfondi decorativi "aurora" nelle pagine principali, card in stile vetro con bagliore al passaggio del mouse, micro-animazioni con la libreria **Motion**. La dashboard privata (route group `(dashboard)`) non è stata toccata.
- `src/components/layout/AuroraBackground.tsx`: sfondo decorativo con macchie di luce blu/violetto sfocate, prop `intensity` (`default`/`subtle`), disattivato se l'utente ha impostato "riduci animazioni".
- `src/components/layout/MobileNavMenu.tsx`: menu mobile per la Navbar del sito pubblico, prima assente (su schermi piccoli nessun link di navigazione era raggiungibile) — hamburger + drawer laterale con chiusura su Escape/click fuori/cambio pagina, `inert` da chiuso; esporta anche `NavbarFrame` (fade-in iniziale, sfondo che si rafforza allo scroll).
- `src/components/ui/spotlight-card.tsx`: `SpotlightCard` (card con bagliore che segue il cursore, variante `dimmed` per i prodotti non disponibili), più `MotionStagger`/`MotionItem`, helper riutilizzabili per le animazioni di apparizione a cascata.
- `src/components/ui/auth-card.tsx`: `AuthCard`, wrapper statico "vetro" per form e pagine di conferma.
- `src/lib/motion/variants.ts`: varianti Motion condivise (`fadeInUp`, `fadeIn`, `staggerContainer`, `cardHover`, `inViewViewport`).
- `src/lib/motion/provider.tsx`: `MotionProvider`, applica `MotionConfig reducedMotion="user"` a tutta l'app.
- Dipendenza `motion`.

### Changed

- `src/app/globals.css`: nuovi token colore (sfondo `#06070A`, primary `#4C8DFF`, accento decorativo `--color-violet`, bordi in stile vetro), `--radius` portato a `0.75rem`, variabili font `--font-sans`/`--font-heading`.
- `src/app/layout.tsx`: font Space Grotesk + DM Sans al posto di Inter, avvolge l'app in `MotionProvider`.
- `src/components/ui/button.tsx`: il variant `default` (CTA primario) ha un bagliore al passaggio del mouse (rispetta "riduci animazioni"); classe `cursor-pointer` aggiunta a tutti i bottoni.
- `src/components/layout/Navbar.tsx`, `Footer.tsx`, `LogoutButton.tsx`: aggiornati ai nuovi token/font; `LogoutButton` ora usa il componente `Button` condiviso invece di markup manuale.
- `src/components/products/ProductCtaButton.tsx`: i 4 stati (non disponibile, gestisci abbonamento, iscriviti, sottoscrivi) usano ora il componente `Button` condiviso invece di markup manuale.
- Pagine aggiornate al nuovo sistema di design (nessun cambio a logica, testi o validazione): `(site)/page.tsx` (Home), `(site)/products/page.tsx`, `(site)/auth/login/page.tsx`, `(site)/auth/signup/page.tsx`, `(site)/contact/page.tsx`, `(site)/privacy/page.tsx`, `(site)/terms/page.tsx` (solo titolo), `(site)/checkout/success/page.tsx`, `(site)/checkout/cancel/page.tsx`, `blocked/page.tsx` (solo titolo), `unlock/page.tsx`.
- `docs/architecture.md`, `docs/repo_structure.md`: aggiornati per riflettere la nuova identità visiva, i nuovi componenti e la nuova dipendenza.
- `package.json`: versione bumped a `0.30.0`.

---

## 0.29.0 — 2026-08-23

### Added

- Redirect firmato verso Frontline: il bottone "Open app" nella pagina My Apps allega un JWT (`sso_token`, HS256, 60 secondi) firmato con `SSO_SHARED_SECRET`, generato al momento del click così Frontline può riconoscere l'azienda senza un secondo login.
- `src/lib/sso/token.ts`: `generateSsoToken` e `buildSsoOpenUrl`.
- `src/app/(dashboard)/dashboard/apps/actions.ts`: server action `openProductAppAction`, firma il token al click verificando lato server che l'abbonamento sia davvero attivo per lo slug richiesto.
- `src/components/dashboard/OpenAppButton.tsx`: Client Component che invoca `openProductAppAction` e apre l'URL firmato in una nuova scheda, con stato di caricamento e messaggio di errore inline.
- `tests/sso-token.test.ts`: verifica claim, scadenza, firma e errore se manca il secret.
- `tests/open-product-app-action.test.ts`: verifica `openProductAppAction` (utente non autenticato, abbonamento assente/non attivo, successo, errore di firma).
- Dipendenza `jose`. Variabile `SSO_SHARED_SECRET` in `.env.example` e documentazione.

### Changed

- `src/app/(dashboard)/dashboard/apps/page.tsx`: non genera più il token al caricamento della pagina (rischio di link scaduto se l'utente clicca "Open app" dopo i 60 secondi di validità) — delega tutto a `OpenAppButton`, che lo richiede fresco al click.
- `package.json`: versione bumped a `0.29.0`.

---

## 0.28.0 — 2026-08-19

### Changed

- **Migrazione a schema-based multi-tenancy per prodotto su Supabase.** Il progetto Supabase del sito è stato consolidato in un'unica organizzazione condivisa con Frontline: invece di un progetto Supabase dedicato per il sito, ora si usano 2 progetti totali (`staging` e `prod`, quest'ultimo ancora da creare) ospitanti più prodotti Acme Labs, ciascuno nel proprio schema Postgres. Le tabelle del sito (`companies`, `products`, `subscriptions`) vivono ora nello schema dedicato **`website`** invece che in `public`, seguendo lo stesso pattern già usato da Frontline (schema `frontline`).
- `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`, `middleware.ts`: aggiunta l'opzione `db: { schema: "website" }` a ogni client Supabase, così tutte le query vengono indirizzate automaticamente allo schema corretto.
- `supabase/migrations/`: riscritte da zero le 9 migration originali in 5 file consolidati (`0001_create_companies.sql`, `0002_create_products.sql`, `0003_create_subscriptions.sql`, `0004_grant_website_privileges.sql`, `0005_seed_frontline.sql`), tutte basate sullo schema `website` e con le colonne Stripe già incluse nelle `create table` invece che aggiunte in migration successive.
- `docs/supabase.md`, `docs/config.md`, `docs/deploy.md`, `docs/repo_structure.md`, `docs/api_endpoints.md`: aggiornati per riflettere i nuovi nomi progetto (`staging`/`prod` invece di `website-staging`/`website-prod`) e lo schema dedicato `website`.

---

## 0.27.2 — 2026-07-13

### Fixed

- `src/app/(dashboard)/dashboard/page.tsx` (Overview): la card "Manage billing" era l'unica delle 3 scorciatoie non interamente cliccabile — usava `ShortcutCard` (icona + etichetta statica) con dentro `BillingPortalButton`, un secondo bottone con icona e scritta duplicata "Manage billing". Sostituita con il nuovo Client Component `src/components/dashboard/BillingShortcutCard.tsx`: intera card cliccabile (stesso stile di `ShortcutLink`), spinner al posto dell'icona durante il caricamento, messaggio di errore sotto la card in caso di fallimento, cursore a manina (`cursor-pointer`) al passaggio del mouse. Rimossa la funzione `ShortcutCard`, non più utilizzata.

### Changed

- `src/components/dashboard/DashboardSidebar.tsx`: rimosso il bottone "Manage billing" dal blocco account in fondo alla sidebar (sia nello stato espanso — `BillingPortalButton` — sia in quello collassato — `CompactBillingButton`, eliminata), ridondante con la card "Manage billing" già presente nell'Overview. Nome azienda e icona di Log out uniti in un'unica riga compatta (nome a sinistra, icona a destra) al posto di due blocchi separati, riusando lo stile icon-only già esistente di `CompactLogoutButton` invece del bottone `LogoutButton` a piena larghezza.
- `src/app/(dashboard)/layout.tsx`: rimosso il calcolo di `hasBilling` (`getStripeCustomerId`), non più necessario dato che la sidebar non mostra più l'azione billing; la pagina Overview continua a calcolarlo autonomamente per la propria card.
- `package.json`: versione bumped a `0.27.2`.

### Removed

- Eliminato `src/components/dashboard/BillingPortalButton.tsx`, non più utilizzato da nessuna parte dopo le modifiche sopra.

---

## 0.27.1 — 2026-07-12

### Fixed

- Le aziende con un abbonamento creato prima della migration `0008` avevano `companies.stripe_customer_id = NULL` (colonna introdotta dopo, mai popolata retroattivamente): il bottone "Manage billing" non compariva più in dashboard finché non si effettuava un nuovo acquisto. Aggiunta migration [`0009_backfill_companies_stripe_customer_id.sql`](supabase/migrations/0009_backfill_companies_stripe_customer_id.sql), una tantum e idempotente, che copia il Customer già presente su `subscriptions.stripe_customer_id` verso `companies` per le aziende ancora senza.
- `package.json`: versione bumped a `0.27.1`.

---

## 0.27.0 — 2026-07-12

### Added

- Migration [`0008_add_companies_stripe_customer_id.sql`](supabase/migrations/0008_add_companies_stripe_customer_id.sql): nuova colonna `stripe_customer_id` (nullable, unique) su `companies`, il Customer Stripe unico e condiviso da tutte le app dell'azienda.

### Changed

- `src/lib/dashboard/queries.ts`: `Company` include `stripe_customer_id`; `getCurrentCompany()` la legge nella `select`; `getStripeCustomerId(companyId)` riscritta per leggerla direttamente da `companies` invece di scansionare `subscriptions` (prima prendeva il primo Customer trovato tra gli abbonamenti, mostrando solo un sottoinsieme di app nel portale di billing se erano stati creati Customer diversi).
- `src/app/(site)/products/actions.ts` (`createCheckoutSessionAction`): se `company.stripe_customer_id` è già presente, la Checkout Session lo riusa (`customer:`) invece di lasciare che Stripe ne crei uno nuovo (`customer_email`); così ogni azienda ha un solo Customer con tutti i suoi abbonamenti.
- `src/lib/stripe/webhook-handlers.ts` (`handleCheckoutSessionCompleted`): dopo l'upsert su `subscriptions`, se `companies.stripe_customer_id` è ancora `null` per quell'azienda lo aggiorna con il Customer della sessione — il prossimo acquisto lo troverà già pronto da riusare.
- `package.json`: versione bumped a `0.27.0`.

### Nota

La colonna `subscriptions.stripe_customer_id` resta com'è (storico/audit) ma non è più la fonte di verità usata dall'app. Le aziende che hanno già un acquisto precedente a questa modifica avranno `companies.stripe_customer_id = null` finché non faranno un nuovo acquisto (nessuno script di backfill incluso in questa versione).

---

## 0.26.2 — 2026-07-11

### Fixed

- `src/components/dashboard/BillingPortalButton.tsx`: il wrapper del bottone aveva `items-end` (retaggio della v0.15.0, per un header ora inesistente), che allineava "Manage billing" a destra invece che a sinistra sia nella tile Overview (`src/app/(dashboard)/dashboard/page.tsx`, disallineata rispetto alle altre scorciatoie) sia nella sidebar espansa (`src/components/dashboard/DashboardSidebar.tsx`, disallineata rispetto a nome azienda e Log out). Cambiato in `items-start`.
- `package.json`: versione bumped a `0.26.2`.

---

## 0.26.1 — 2026-07-11

### Fixed

- `src/components/dashboard/DashboardSidebar.tsx`: il drawer mobile chiuso era ancora raggiungibile con la navigazione da tastiera (Tab) pur essendo visivamente fuori schermo (`-translate-x-full`), rendendo focusabili elementi invisibili. Aggiunti gli attributi `inert` e `aria-hidden` legati allo stato `open`, cosi che quando il drawer e chiuso il browser lo ignori completamente anche per la navigazione da tastiera.
- `package.json`: versione bumped a `0.26.1`.

---

## 0.26.0 — 2026-07-10

### Changed

- `src/app/(dashboard)/dashboard/page.tsx` (Overview): da landing minimale a vista riassuntiva. Aggiunto empty state (stesso pattern di My Apps) quando non ci sono abbonamenti; banner di attenzione condizionale (icona `AlertTriangle`) quando almeno un abbonamento è `past_due` o `incomplete`, con link "Review" verso My Apps; 2 card statistiche ("Active apps", "Next renewal"); 3 scorciatoie verso My Apps, Manage billing (gated da `hasBilling`, riusa `BillingPortalButton`) e Settings.
- `package.json`: versione bumped a `0.26.0`.

---

## 0.25.0 — 2026-07-10

### Added

- Aggiunto `changePasswordSchema` (e tipo `ChangePasswordValues`) in `src/lib/validations/auth.ts`: `currentPassword` richiesta, `newPassword` min 32 caratteri (stessa soglia del signup), `confirmPassword` deve combaciare, `newPassword` deve essere diversa da `currentPassword`.
- Aggiunta server action `changePasswordAction` in `src/app/(dashboard)/dashboard/settings/actions.ts`: valida i dati, verifica l'utente con `getCurrentCompany()`, riautentica con `supabase.auth.signInWithPassword` usando la password attuale (errore "Current password is incorrect." se fallisce) e infine aggiorna la password con `supabase.auth.updateUser`.
- Aggiunto `src/components/dashboard/ChangePasswordForm.tsx`: Client Component con `react-hook-form` + `zodResolver`, tre campi password (attuale, nuova, conferma), messaggio di errore, messaggio di successo con reset del form.

### Changed

- `src/app/(dashboard)/dashboard/settings/page.tsx`: sostituito il placeholder "Coming soon" con la sezione "Change password" che monta `ChangePasswordForm` — prima funzionalità di scrittura della dashboard.
- `package.json`: versione bumped a `0.25.0`.

---

## 0.24.0 — 2026-07-09

### Changed

- `src/app/(dashboard)/dashboard/apps/page.tsx`: sostituito il placeholder "Coming soon" con la lista reale degli abbonamenti (griglia `SubscriptionCard`, `EmptyState`, helper `formatPeriodLabel`), spostata pari pari dall'Overview.
- `src/app/(dashboard)/dashboard/page.tsx` (Overview): ridotta a landing minimale — solo header di benvenuto con nome azienda, rimossi lista abbonamenti e bottone billing (ora altrove).
- `src/components/dashboard/DashboardSidebar.tsx`: rimossa la voce di navigazione **Billing** (restano Overview, app, Settings); aggiunta l'azione "Manage billing" nel blocco account in fondo, mostrata solo se l'azienda ha un customer Stripe (nuova prop `hasBilling`) — stato espanso: `BillingPortalButton` esistente; stato collassato: nuovo `CompactBillingButton` a sola icona `CreditCard`, speculare a `CompactLogoutButton`.
- `src/app/(dashboard)/layout.tsx`: calcola `hasBilling` con `getStripeCustomerId(company.id)` e lo passa a `DashboardSidebar`, cosi "Manage billing" appare in ogni pagina della dashboard solo a chi ha davvero un abbonamento da gestire.
- `package.json`: versione bumped a `0.24.0`.

### Removed

- Eliminata la pagina placeholder `src/app/(dashboard)/dashboard/billing/page.tsx` e la relativa voce nel menu della sidebar; nessun riferimento residuo a `/dashboard/billing`.

---

## 0.23.0 — 2026-07-09

### Added

- Aggiunto helper `src/lib/dashboard/sidebar-preference.ts`: costanti `SIDEBAR_COOKIE_NAME` (`"sidebar_collapsed"`) e `SIDEBAR_COOKIE_MAX_AGE` (1 anno), unica fonte di verità condivisa fra server e client per il cookie di preferenza sidebar.
- `src/components/dashboard/DashboardSidebar.tsx`: toggle collassa/espandi sulla sidebar desktop (icone `PanelLeftClose`/`PanelLeftOpen`), con preferenza persistita in un cookie non sensibile (scritto via `document.cookie` al click, nessuna server action necessaria). Stato collassato (`w-16`): icone centrate, etichette nascoste con `title` nativo come tooltip, blocco account/logout compatto a sola icona `LogOut` (con `title` che riporta nome azienda e "Log out"). Il drawer mobile resta sempre a piena larghezza, indipendente dallo stato collassato.

### Changed

- `src/app/(dashboard)/layout.tsx`: legge il cookie `sidebar_collapsed` con `cookies()` (`next/headers`) e passa `defaultCollapsed` a `DashboardSidebar`, cosi lo stato iniziale e corretto dal primo render (nessun flash visivo).
- `package.json`: versione bumped a `0.23.0`.

---

## 0.22.0 — 2026-07-08

### Added

- `src/components/dashboard/DashboardSidebar.tsx`: comportamento responsive/mobile. Topbar mobile (`md:hidden`, fixed, `h-14`) con logo e pulsante hamburger (icona `Menu`); drawer a scomparsa (`fixed`, `transition-transform`) con backdrop scuro, pilotato dallo stato `open`. Chiusura del drawer al tap su una voce di navigazione, al tap sul backdrop, con il tasto `Escape` e al cambio pagina (`usePathname`); blocco dello scroll del body quando il drawer è aperto. Attributi ARIA sul pulsante hamburger (`aria-label`, `aria-expanded`, `aria-controls`). Su desktop (`>= md`) nessun cambiamento: sidebar fissa `w-64` sempre aperta.

### Changed

- `src/components/dashboard/DashboardSidebar.tsx`: estratto il contenuto condiviso (voci di navigazione + blocco account/Log out) in un sotto-componente interno `SidebarContent`, riutilizzato sia dalla sidebar desktop sia dal drawer mobile.
- `src/app/(dashboard)/layout.tsx`: il `main` ha ora un padding-top responsive (`pt-14 md:pt-0`) per non finire sotto la topbar fissa su mobile.
- `package.json`: versione bumped a `0.22.0`.

---

## 0.21.0 — 2026-07-07

### Added

- Aggiunto route group `(dashboard)` con `src/app/(dashboard)/layout.tsx`: Server Component che recupera l'azienda con `getCurrentCompany()` (redirect a `/auth/login` se assente) e monta un contenitore flex sidebar + main a tutta altezza. Sostituisce, nella sola area autenticata, la Navbar/Footer pubblica con una sidebar laterale fissa. Nessun cambio di URL: `/dashboard` resta `/dashboard`.
- Aggiunto `src/components/dashboard/DashboardSidebar.tsx`: Client Component con nome del sito in testo in cima (link alla home pubblica `/`), 4 voci di navigazione con icone `lucide-react` (Overview, My Apps, Billing, Settings) ed evidenziazione della sezione attiva via `usePathname()`, blocco account (nome azienda) e pulsante Log out in fondo (riuso di `LogoutButton` / `logoutAction`).
- Aggiunte 3 pagine placeholder "Coming soon": `src/app/(dashboard)/dashboard/apps/page.tsx`, `.../billing/page.tsx`, `.../settings/page.tsx`.

### Changed

- Spostati `src/app/(site)/dashboard/page.tsx` e `actions.ts` in `src/app/(dashboard)/dashboard/` (contenuto invariato). La lista abbonamenti reale resta sulla pagina Overview.
- `src/components/dashboard/BillingPortalButton.tsx`: import di `createBillingPortalSessionAction` aggiornato da `@/app/(site)/dashboard/actions` a `@/app/(dashboard)/dashboard/actions`.
- `src/proxy.ts`: verificato (nessuna modifica) che `isProtectedPath` copra già tutte le sotto-rotte `/dashboard/*`.
- `package.json`: versione bumped a `0.21.0`.

---

## 0.20.1 — 2026-06-28

### Changed

- `src/app/(site)/page.tsx` (home): rivisti i testi della vetrina (hero, card e chiamata finale).
- `src/app/(site)/page.tsx` (home): sezione prodotti ridotta da 3 a 2 card (rimossa una "Coming Soon"); griglia da `md:grid-cols-3` a `sm:grid-cols-2 lg:max-w-4xl` per bilanciare il layout con due card.
- `src/app/(site)/contact/page.tsx`: titolo "Get in touch" → "Let's talk"; sottotitolo generalizzato, copre qualsiasi richiesta.
- `package.json`: versione bumped a `0.20.1`.

---

## 0.20.0 — 2026-06-22

### Added

- Aggiunto documento `docs/website/privacy_policy.md`: informativa privacy GDPR completa in versione bilingue (italiano + inglese), 11 sezioni con tabelle di dati raccolti, finalità e basi giuridiche, sub-responsabili, tempi di conservazione e diritti dell'interessato.
- `src/app/(site)/privacy/page.tsx`: sostituito il placeholder "Coming Soon" con il contenuto reale della privacy policy (versione inglese). Componente `DataTable` riutilizzabile con scroll orizzontale su mobile; stile coerente con la pagina Terms (`metadata`, header con data di ultimo aggiornamento, sezioni numerate).

### Changed

- `package.json`: versione bumped a `0.20.0`.
- `docs/repo_structure.md`: aggiornata la descrizione di `privacy/page.tsx` (da placeholder a informativa GDPR completa).

---

## 0.19.0 — 2026-06-20

### Added

- Aggiunto helper `src/lib/staging/access.ts`: costanti `STAGING_COOKIE_NAME` (`"staging_access"`) e `STAGING_COOKIE_MAX_AGE` (30 giorni), funzione `isStagingGateEnabled()` (legge `STAGING_PASSWORD`), funzione `computeStagingToken(password)` (digest SHA-256 — mai la password in chiaro nel cookie).
- Aggiunta pagina `src/app/unlock/page.tsx`: Server Component fuori dal gruppo `(site)` (nessuna Navbar né Footer). Legge `next` e `error` dai `searchParams`, mostra un form con un campo password che invia a `unlockStagingAction`. Messaggio di errore se `error=1`.
- Aggiunta server action `unlockStagingAction` in `src/app/unlock/actions.ts`: verifica la password rispetto a `STAGING_PASSWORD`, imposta il cookie `staging_access` (httpOnly, secure, sameSite lax, 30 giorni) e reindirizza alla destinazione originale. Redirect a `/unlock?error=1` in caso di password errata. Protezione open redirect su `next`.
- Aggiunto test `tests/staging-access.test.ts`: 8 casi Vitest — `isStagingGateEnabled` (env assente, vuoto, valorizzato), `computeStagingToken` (formato hex 64 char, deterministico, password diverse, case-sensitive), costanti cookie.

### Changed

- `src/proxy.ts`: aggiunto cancello staging come **primo** controllo in `proxy()`. Se `STAGING_PASSWORD` è impostata e il cookie non corrisponde al digest atteso, redirect a `/unlock?next=<pathname>`. Bypass esplicito di `/unlock` sia per il cancello che per il geoblocking. Il `pathname` ora viene estratto una volta sola in cima alla funzione.
- `src/app/layout.tsx`: aggiunto campo `robots` nei `metadata`. Se `NEXT_PUBLIC_SITE_URL` non è `https://example.com`, viene emesso `noindex, nofollow`. Quando il dominio di produzione è configurato, l'indicizzazione si riattiva automaticamente senza modifiche al codice.
- `.env.example`: aggiunta variabile `STAGING_PASSWORD=` (vuota = cancello disattivo) con sezione dedicata e commento esplicativo.
- `package.json`: versione bumped a `0.19.0`.
- `docs/security.md`: aggiunta sezione "Protezione accesso staging" (flusso, condivisione, bypass webhook, disattivazione quando il dominio di produzione è configurato, noindex). Tabella panoramica aggiornata. Aggiornati i riferimenti.
- `docs/config.md`: aggiunta variabile `STAGING_PASSWORD` con descrizione comportamento; aggiornata descrizione di `NEXT_PUBLIC_SITE_URL` (nota sul noindex).
- `docs/repo_structure.md`: aggiunti `src/app/unlock/` (page.tsx, actions.ts), `src/lib/staging/access.ts`, `tests/staging-access.test.ts`; aggiornate le descrizioni di `proxy.ts` e `layout.tsx`.

---

## 0.18.2 — 2026-06-20

### Changed

- `src/app/blocked/page.tsx`: rimosso il paragrafo descrittivo ("Acme Labs is not available in your region...") e il link `mailto:info@example.com`. La pagina ora mostra solo l'icona `ShieldX` e il titolo "Service Not Available".
- `package.json`: versione bumped a `0.18.2`.

---

## 0.18.1 — 2026-06-19

### Changed

- Introdotto route group `src/app/(site)/` con layout dedicato (`(site)/layout.tsx`) che porta Navbar, `<main>` e Footer. Le pagine pubbliche (home, auth, checkout, contact, dashboard, privacy, products, terms) sono state spostate dentro il gruppo — gli URL restano invariati.
- `src/app/layout.tsx` (root) snellito: rimossi Navbar, Footer e `<main>`; rimangono solo `<html>`, `<body>` con classi di base, font Inter, metadata e `<Toaster />`.
- `src/app/blocked/page.tsx`: la pagina `/blocked` resta fuori dal gruppo `(site)` e non mostra più Navbar e Footer. Altezza aggiornata da `min-h-[calc(100vh-8rem)]` a `min-h-screen` per il centraggio a tutta pagina.
- `package.json`: versione bumped a `0.18.1`.

---

## 0.18.0 — 2026-06-19

### Added

- Aggiunto `src/lib/geo/allowed-countries.ts`: fonte di verità unica per la whitelist di 42 paesi (Set di codici ISO 3166-1 alpha-2) e funzione pura `isCountryAllowed(country)` (default-deny: `null`/`undefined`/paese sconosciuto → `false`).
- Aggiunta pagina `src/app/blocked/page.tsx`: pagina statica in inglese con icona `ShieldX`, titolo "Service Not Available" e link contatto, mostrata ai visitatori bloccati.
- Aggiunto test `tests/is-country-allowed.test.ts`: 6 gruppi di casi Vitest — paese in whitelist (uppercase), paese non in whitelist, `null`, `undefined`, lowercase gestito, codici sconosciuti/vuoti.

### Changed

- `src/proxy.ts`: aggiunto blocco geographico all'inizio di `proxy()`, prima di `updateSession`. In produzione legge l'header `x-vercel-ip-country` (fornito da Vercel); se il paese non è nella whitelist esegue un `rewrite` a `/blocked` con status `403`. In sviluppo (`NODE_ENV === "development"`) il controllo viene saltato. Il matcher esistente esclude già `api/.*`, quindi il webhook Stripe non viene geobloccato.
- `package.json`: versione progetto bumped a `0.18.0`.

---

## 0.17.1 — 2026-06-19

### Changed

- `src/app/products/actions.ts`: `success_url` aggiornato — aggiunto `&product=${encodeURIComponent(product.slug)}` per passare lo slug del prodotto acquistato alla pagina di conferma.
- `src/app/checkout/success/page.tsx`: riscritto come Server Component asincrono. Legge `?product=<slug>` dai `searchParams`, chiama `getProductNameBySlug` per risolvere il nome reale da DB, mostra il nome nel testo se trovato, fallback generico altrimenti. Eliminato il testo hardcoded "Frontline".
- `src/lib/products/queries.ts`: aggiunto helper `getProductNameBySlug(slug)` — SELECT `name` da `products` con `.maybeSingle()`, ritorna il nome o `null` (con log in caso di errore DB).
- `docs/api_endpoints.md`: aggiornata la sezione `GET /checkout/success` (query param `product`, comportamento dinamico) e il redirect Stripe di `createCheckoutSessionAction`.
- `docs/repo_structure.md`: aggiornate le descrizioni di `checkout/success/page.tsx`, `products/queries.ts` e `products/actions.ts`; aggiunto `tests/get-product-name-by-slug.test.ts`.
- `package.json`: versione progetto bumped a `0.17.1`.

### Added

- Aggiunto test `tests/get-product-name-by-slug.test.ts`: 3 casi con client Supabase mockato (nome trovato, slug non trovato, errore DB).

---

## 0.17.0 — 2026-06-19

### Added

- Aggiunto componente `src/components/ui/sonner.tsx`: wrapper `<Toaster />` per la libreria `sonner`, tema `dark` fisso (niente `next-themes`), con token CSS del progetto (`bg-background`, `text-foreground`, `border-border`, ecc.).

### Changed

- `src/app/layout.tsx`: montato `<Toaster />` dentro `<body>` (dopo `<Footer />`), disponibile globalmente in tutte le pagine.
- `src/components/products/ProductCtaButton.tsx`: sostituito `alert(result.error)` con `toast.error(result.error)` — gli errori Stripe vengono ora mostrati come toast invece del popup di sistema nativo.
- `package.json`: aggiunta dipendenza `sonner`; versione progetto bumped a `0.17.0`.
- `docs/repo_structure.md`: aggiunto `src/components/ui/sonner.tsx`; aggiornate le descrizioni di `layout.tsx` e `ProductCtaButton.tsx`.

## 0.16.1 — 2026-06-18

### Fixed

- `package.json`: aggiunte effettivamente le devDependencies `vitest` e `@vitest/coverage-v8` (`^4.1.8`). Erano elencate nel changelog della 0.16.0 ma mancavano dal file: senza di esse `npm test` falliva perché `vitest` non veniva installato.

### Security

- `package.json`: bump della devDependency `postcss` da `^8.4.49` a `^8.5.10` e aggiunto blocco `overrides` globale (`postcss: ^8.5.10`) per forzare il postcss aggiornato in tutto l'albero delle dipendenze, incluso quello annidato in Next.js, e silenziare l'avviso `npm audit` GHSA-qx2v-qp2m-jg93 (XSS in fase di stringify CSS). La falla riguarda solo la build con sorgenti CSS non fidati e non impatta gli utenti del sito; l'override è una soluzione temporanea da rimuovere quando Next includerà nativamente `postcss >= 8.5.10` in una release stabile.

---

## 0.16.0 — 2026-06-18

### Added

- Aggiunto helper server-only `src/lib/resend/server.ts`: esporta `getResendClient()`, singleton del client `resend` con check esplicito della variabile `RESEND_API_KEY`.
- Creata server action `sendContactMessageAction` in `src/app/contact/actions.ts`: re-valida i dati lato server con `contactSchema`, invia l'email via Resend (`from: noreply@example.com`, `to: CONTACT_RECIPIENT_EMAIL`, `replyTo: email cliente`, oggetto con nome azienda), restituisce `{ success: true }` o `{ success: false, error }`.
- Aggiunto test unitario `tests/contact-action.test.ts` con 7 casi (invio ok, errore Resend, errore inatteso, validazione companyName/email/message fallita, env mancante). Client Resend interamente mockato — nessuna email reale viene inviata durante i test.
- Aggiunto `vitest.config.ts` con environment `node` e alias `@` → `src/`.

### Changed

- `src/app/contact/page.tsx`: `onSubmit` sostituito con chiamata a `sendContactMessageAction`. Aggiunti stati `isSubmitting` (bottone "Sending..." disabilitato), schermata di conferma con `CheckCircle2` in caso di successo e box destructive in caso di errore.
- `package.json`: aggiunta dipendenza `resend`; aggiunti script `test` e `test:watch`; versione progetto bumped a `0.16.0`.
- `docs/api_endpoints.md`: aggiunta sezione `sendContactMessageAction`.
- `docs/config.md`: sezione Resend aggiornata — variabili segnate come attive.
- `docs/repo_structure.md`: aggiunti `src/lib/resend/server.ts`, `src/app/contact/actions.ts`, `tests/contact-action.test.ts`, `vitest.config.ts`; aggiornata descrizione di `src/app/contact/page.tsx`.

---

## 0.15.0 — 2026-05-22

### Added

- Aggiunto helper `getStripeCustomerId(companyId)` in `src/lib/dashboard/queries.ts`: legge `stripe_customer_id` dalla prima subscription non-null dell'azienda.
- Creata server action `createBillingPortalSessionAction` in `src/app/dashboard/actions.ts`: verifica auth, recupera `stripe_customer_id`, crea Billing Portal Session Stripe con `return_url = /dashboard`.
- Creato Client Component `src/components/dashboard/BillingPortalButton.tsx`: bottone outline "Manage billing" con icona `CreditCard`, stato pending con spinner, messaggio di errore inline (no `alert()`).

### Changed

- `src/app/dashboard/page.tsx`: header aggiornato con layout flex `justify-between`; `BillingPortalButton` appare nell'header solo se l'utente ha almeno una subscription.
- `docs/api_endpoints.md`: aggiunta sezione `createBillingPortalSessionAction`.
- `docs/repo_structure.md`: aggiunti `src/app/dashboard/actions.ts`, `src/components/dashboard/BillingPortalButton.tsx`; aggiornate le descrizioni di `page.tsx` e `queries.ts`.

---

## 0.14.0 — 2026-05-22

### Added

- Creato Route Handler `POST /api/stripe/webhook` (`src/app/api/stripe/webhook/route.ts`): legge il body raw come `Buffer`, verifica la firma HMAC con `STRIPE_WEBHOOK_SECRET`, fa dispatch agli handler appropriati. Risponde `200 { received: true }` in caso di successo, `400` se la firma è invalida.
- Creato `src/lib/stripe/webhook-handlers.ts` con tre gestori (tutti via client admin, idempotenti):
  - `handleCheckoutSessionCompleted`: upsert su `subscriptions` con `status = 'active'`, `stripe_subscription_id`, `stripe_customer_id` e `current_period_end` (recuperato da `stripe.subscriptions.retrieve`).
  - `handleSubscriptionUpdated`: aggiorna `status` e `current_period_end` filtrando per `stripe_subscription_id`.
  - `handleSubscriptionDeleted`: imposta `status = 'canceled'`.

### Changed

- `docs/api_endpoints.md`: aggiunta sezione `POST /api/stripe/webhook` con eventi gestiti, comportamento e note sulla firma.
- `docs/supabase.md`: aggiunto flusso webhook (Fase 6c) nella sezione "Integrazione Stripe".
- `docs/repo_structure.md`: aggiunti `src/app/api/stripe/webhook/route.ts` e `src/lib/stripe/webhook-handlers.ts`.

### Fixed

- `src/lib/stripe/webhook-handlers.ts`: corretta la lettura di `current_period_end` in `handleCheckoutSessionCompleted` e `handleSubscriptionUpdated`. Nella Stripe API `2026-04-22.dahlia` il campo è stato rimosso dalla radice della Subscription e spostato a livello di SubscriptionItem (`items.data[0].current_period_end`). Aggiunta guardia contro valori `undefined`/`NaN` in entrambi i punti.

---

## 0.13.0 — 2026-05-21

### Added

- Aggiunto helper server-only `src/lib/stripe/server.ts`: esporta `getStripeServerClient()`, singleton del client `stripe` con `apiVersion` pinnata a `2026-04-22.dahlia` e check esplicito della variabile `STRIPE_SECRET_KEY`.
- Creato `src/lib/products/queries.ts` (server-only) con due helper: `getAvailableProducts()` (select pubblica su `products` con i nuovi campi Stripe) e `getUserActiveSubscriptionSlugs(companyId)` (slug dei prodotti con subscription `active`/`past_due` per l'azienda).
- Creata server action `createCheckoutSessionAction(productSlug)` in `src/app/products/actions.ts`: verifica auth + product + assenza subscription attiva, crea Checkout Session Stripe (`mode: 'subscription'`, `metadata` con `company_id`/`product_id`/`product_slug` per il webhook), restituisce `{ success: true, url }` o messaggio di errore.
- Creato Client Component `src/components/products/ProductCtaButton.tsx` con CTA adattiva: "Sign up to subscribe" (anonimo), "Subscribe" con `useTransition` + redirect Stripe (loggato, non abbonato), "Manage in Dashboard" (già abbonato), "Not available yet" (coming_soon/archived).
- Create pagine `/checkout/success` e `/checkout/cancel` per gli esiti del flusso Stripe Checkout.

### Changed

- `src/app/products/page.tsx`: riscritto come Server Component asincrono (`force-dynamic`). Carica prodotti da DB, mostra il prezzo reale formattato, rimuove i placeholder hard-coded — i prodotti `coming_soon` si gestiscono ora tramite righe in DB. Integra `ProductCtaButton`.
- `package.json`: aggiunta dipendenza `stripe ^22.1.1`; versione progetto bumped a `0.13.0`.
- `docs/supabase.md`: aggiunto flusso checkout (Fase 6b) nella sezione "Integrazione Stripe".
- `docs/api_endpoints.md`: aggiunti `createCheckoutSessionAction`, `GET /checkout/success` e `GET /checkout/cancel`.
- `docs/repo_structure.md`: aggiunti tutti i nuovi file e cartelle.
- `docs/config.md`: intestazione colonna Stripe aggiornata da Fase 6a a Fase 6b (stato invariato).

---

## 0.12.0 — 2026-05-21

### Added

- Aggiunta migration `supabase/migrations/0006_add_stripe_columns.sql`: nuove colonne nullable `stripe_product_id` (text, unique) e `stripe_price_id` (text, unique) su `public.products`; nuova colonna nullable `stripe_customer_id` (text) su `public.subscriptions` con indice `subscriptions_stripe_customer_id_idx` per velocizzare il lookup dal webhook.
- Aggiunta una migration di update sul seed di Frontline: valori Stripe segnaposto nel seed, con `monthly_price_cents = 10000` (100 EUR).

### Changed

- `docs/supabase.md`: aggiunte le nuove colonne Stripe alle tabelle `products` e `subscriptions`; aggiunto indice `subscriptions_stripe_customer_id_idx`; aggiunta sezione "Integrazione Stripe" che documenta il legame `products ↔ Stripe products/prices` e `subscriptions ↔ Stripe customers/subscriptions`.
- `docs/repo_structure.md`: aggiunte le due nuove migration nella cartella `supabase/migrations/`.
- `docs/config.md`: sezione Stripe aggiornata con lo stato corrente delle variabili — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` e `STRIPE_SECRET_KEY` attive in test mode; `STRIPE_WEBHOOK_SECRET` resta vuota fino a Fase 6c.

---

## 0.11.0 — 2026-05-20

### Added

- Creata pagina `/dashboard` (`src/app/dashboard/page.tsx`) come Server Component asincrono: header personalizzato con `Welcome, {company_name}`, sezione "Your apps" con empty state (icona, titolo, CTA "Browse Products") e griglia responsive di card per gli abbonamenti (nome prodotto, descrizione, badge stato, data di rinnovo/scadenza formattata in inglese, bottone `Open app` verso `web_app_url` abilitato solo se `status = 'active'`).
- Creati helper server-only in `src/lib/dashboard/queries.ts`: `getCurrentCompany()` (combina `auth.getUser()` con select su `companies`) e `getSubscriptionsForCompany(companyId)` (join su `products` e normalizzazione del relation tipato come array da Supabase).
- Creato componente `src/components/dashboard/SubscriptionStatusBadge.tsx`: badge colorato per i 4 stati abbonamento (`active`, `past_due`, `canceled`, `incomplete`) con label e classi coerenti con il tema.

### Changed

- Redirect post-auth aggiornati da `/` a `/dashboard`: `loginAction` (default quando `next` non è valorizzato), route handler `/auth/callback` (default di `next`) e `proxy.ts` (utenti loggati che tentano di accedere a `/auth/login` o `/auth/signup`). Logout invariato (continua a riportare alla home).
- `src/components/layout/Navbar.tsx`: aggiunto link `Dashboard` nel ramo utente loggato, accanto al nome azienda e al bottone Log out.
- `docs/supabase.md`: aggiornati i diagrammi dei flussi di registrazione e login per riflettere il redirect a `/dashboard`. Aggiunta sezione "Flusso dashboard" con descrizione degli helper server-only e del rendering condizionale (empty state vs lista).

---

## 0.10.0 — 2026-05-19

### Added

- Aggiunta migration `supabase/migrations/0003_create_products.sql`: tabella `public.products` (catalogo delle app) con `slug` unique, `monthly_price_cents` (centesimi, check `>= 0`), `currency` ISO 4217, `web_app_url`, `status` in (`available`, `coming_soon`, `archived`), trigger `products_set_updated_at`, RLS abilitata con policy pubblica `products_select_all` per `anon` e `authenticated`, GRANT espliciti (`service_role` full, `anon`/`authenticated` solo SELECT).
- Aggiunta migration `supabase/migrations/0004_create_subscriptions.sql`: tabella `public.subscriptions` con FK `company_id` (cascade) e `product_id` (restrict), `status` allineato a Stripe (`active`, `past_due`, `canceled`, `incomplete`), `stripe_subscription_id` unique nullable, unique constraint `(company_id, product_id)`, indice `subscriptions_company_id_idx`, trigger `subscriptions_set_updated_at`, RLS con policy `subscriptions_select_own` (`company_id = auth.uid()`), GRANT espliciti (`service_role` full, `authenticated` solo SELECT, `anon` revocato).
- Aggiunta migration `supabase/migrations/0005_seed_frontline.sql`: seed idempotente del prodotto `frontline` con `status = 'available'`, `monthly_price_cents = 0` come placeholder e `web_app_url = https://frontline.example.com` (`on conflict (slug) do nothing`).

### Changed

- `docs/supabase.md`: tabella riassuntiva dello schema aggiornata con `products` e `subscriptions` (stato "Disponibile", Fase 5a). Aggiunte sezioni dedicate per ogni nuova tabella (colonne, vincoli, trigger, indice, unique). Aggiornato l'elenco delle RLS policy attive con `products_select_all` e `subscriptions_select_own`.
- `docs/repo_structure.md`: aggiunte le tre nuove migration nella cartella `supabase/migrations/`.

---

## 0.9.1 — 2026-05-19

### Changed

- Migrazione da `middleware.ts` a `proxy.ts` per allinearsi alla nuova file convention di Next.js 16 (la convention `middleware` è deprecata). Rinominati il file (`src/middleware.ts` → `src/proxy.ts`) e la funzione esportata (`middleware()` → `proxy()`) tramite codemod ufficiale `@next/codemod middleware-to-proxy`. Aggiornati `docs/supabase.md` e `docs/repo_structure.md` per riflettere il nuovo nome.

---

## 0.9.0 — 2026-05-19

### Added

- Creato helper `updateSession` in `src/lib/supabase/middleware.ts`: inizializza un `createServerClient` di `@supabase/ssr` con i cookie della request, chiama `supabase.auth.getUser()` per refreshare il token di sessione e propaga i cookie aggiornati nella `NextResponse`.
- Creato middleware Next.js in `src/middleware.ts`: invoca `updateSession`, protegge le rotte in `PROTECTED_PATHS` (attualmente `/dashboard`) reindirizzando a `/auth/login?next=<pathname>` gli utenti anonimi, e reindirizza a `/` gli utenti già loggati che tentano di accedere a `/auth/login` o `/auth/signup`. `matcher` configurato per escludere asset statici e route API.

### Changed

- `src/app/auth/login/actions.ts`: `loginAction` ora accetta un parametro opzionale `next` e, se è un path interno sicuro (inizia con `/`, non `//` né `/\`), lo usa come destinazione del redirect post-login (default invariato a `/`).
- `src/app/auth/login/page.tsx`: legge `next` dai search params via `useSearchParams()` e lo passa a `loginAction`. Wrappato in `Suspense` come richiesto da Next.js per `useSearchParams`.
- `docs/supabase.md`: aggiunta sezione "Middleware e protezione rotte" con descrizione dell'ordine middleware → server component, elenco delle rotte protette e funzionamento del parametro `next` per il deep linking post-login.

---

## 0.8.0 — 2026-05-19

### Added

- Creata server action `loginAction` in `src/app/auth/login/actions.ts`: validazione server-side con `loginSchema`, `signInWithPassword` con messaggi user-friendly per credenziali invalide ed email non confermata, redirect a `/` in caso di successo.
- Creata server action `logoutAction` in `src/app/auth/actions.ts`: `signOut` + `revalidatePath` + redirect a `/`.
- Creato client component `src/components/layout/LogoutButton.tsx` che invoca `logoutAction` tramite `useTransition` e gestisce lo stato di pending.

### Changed

- `src/app/auth/login/page.tsx`: ora invoca `loginAction`, gestisce stato di submit (`isSubmitting`) e mostra gli errori in un box destructive sopra il bottone (stesso pattern del Signup).
- `src/components/layout/Navbar.tsx`: trasformato in Server Component asincrono. Recupera la sessione tramite `supabase.auth.getUser()` e, se autenticato, legge `companies.company_name`. Mostra dinamicamente i CTA Login/Get Started (anonimo) oppure nome azienda + Log out (autenticato).
- `docs/supabase.md`: aggiunte sezioni "Flusso di login" e "Flusso di logout" con diagrammi testuali, e descrizione della Navbar adattiva.

---

## 0.7.0 — 2026-05-19

### Added

- Aggiunta lista di domini email personali bloccati in `src/lib/auth/blocked-email-domains.ts` (gmail.com, yahoo.com, outlook.com, icloud.com, proton.me, ecc.) con helper `isBlockedEmailDomain`.
- Aggiunto client Supabase `service_role` in `src/lib/supabase/admin.ts`, marcato `import "server-only"` per impedire l'import dal browser.
- Creata server action `signupAction` in `src/app/auth/signup/actions.ts`: validazione server-side, `supabase.auth.signUp` con `emailRedirectTo` verso `/auth/callback`, INSERT su `companies` e cleanup dell'utente Auth in caso di errore.
- Creato Route Handler `GET /auth/callback` (`src/app/auth/callback/route.ts`): scambia il codice di conferma email per una sessione valida e reindirizza alla home (errori → `/auth/login?error=…`).
- Aggiunta documentazione degli endpoint API in `docs/api_endpoints.md`.

### Changed

- `signupSchema` (`src/lib/validations/auth.ts`): aggiunto `refine` che blocca le email con dominio personale gratuito (messaggio: `Please use your company email address`).
- `src/app/auth/signup/page.tsx`: ora invoca `signupAction`, gestisce stato di submit (`isSubmitting`), mostra errori sopra il bottone e sostituisce il form con un messaggio "Check your inbox" in caso di successo.
- `docs/supabase.md`: aggiunta sezione "Flusso di registrazione" con diagramma testuale, descrizione del client admin, dei domini bloccati e della configurazione URL/Provider lato Supabase.
- `src/app/auth/signup/page.tsx`: miglioramenti UX al form di registrazione — campo email rinominato in "Company email", aggiunto testo di aiuto che indica che le email personali non sono accettate, e validazione attivata in modalità `onBlur` (gli errori appaiono appena si lascia il campo, non solo al submit).

### Fixed

- `src/app/auth/signup/actions.ts`: l'INSERT iniziale sulla tabella `companies` ora usa il client admin (`SERVICE_ROLE_KEY`) invece del client server. Necessario perché subito dopo `supabase.auth.signUp` l'utente non ha ancora confermato l'email, quindi non esiste una sessione attiva e la policy RLS `companies_insert_own` rifiutava l'INSERT (`auth.uid()` era `NULL`). Documentata la motivazione in `docs/supabase.md`.
- Aggiunta migration `supabase/migrations/0002_grant_companies_privileges.sql` con GRANT espliciti su `public.companies` per `service_role` (tutti i privilegi) e `authenticated` (SELECT, INSERT, UPDATE). Il progetto Supabase era stato creato con "Automatically expose new tables" disabilitato, impedendo al `service_role` di scrivere sulla tabella nonostante l'assenza di RLS block (errore Postgres `42501`). Aggiunta spiegazione in `docs/supabase.md`.
- `src/app/auth/signup/actions.ts`: aggiunti `console.error` su `signUpError` e `insertError` per rendere visibili gli errori reali nel terminale di sviluppo.

---

## 0.6.0 — 2026-05-18

### Added

- Creata cartella `supabase/migrations/` come fonte di verità per lo schema del database.
- Aggiunta migration `supabase/migrations/0001_create_companies.sql` con:
  - Tabella `public.companies` (`id` uuid PK collegata a `auth.users` con cascade, `company_name`, `tax_id`, `created_at`, `updated_at`).
  - Funzione `public.set_updated_at()` e trigger `companies_set_updated_at` per aggiornare automaticamente `updated_at` ad ogni `UPDATE`.
  - RLS abilitato e policy `companies_select_own`, `companies_insert_own`, `companies_update_own` (tutte basate su `auth.uid() = id`) per garantire l'isolamento dei dati per tenant.

### Changed

- `docs/supabase.md`: aggiunta documentazione dettagliata della tabella `companies` (schema, vincoli, trigger, policy RLS) e della procedura per applicare le migration nel SQL Editor di Supabase.

---

## 0.5.0 — 2026-05-18

### Added

- Aggiunte dipendenze `react-hook-form`, `zod` e `@hookform/resolvers` per la gestione e validazione dei form.
- Installati componenti shadcn/ui in `src/components/ui/`: `Button`, `Input`, `Label`, `Textarea`, `Form`.
- Aggiunti schemi di validazione zod: `signupSchema` e `loginSchema` in `src/lib/validations/auth.ts`, `contactSchema` in `src/lib/validations/contact.ts`.

### Changed

- Estesa la palette in `src/app/globals.css` con tutti i token semantici di shadcn (`--color-primary`, `--color-secondary`, `--color-card`, `--color-popover`, `--color-destructive`, `--color-input`, `--color-ring`, ecc.) mantenendo l'identità visiva del sito (blu `#4A8FFF` come `primary`, sfondi neri, testo grigio chiaro).
- Refactor di Signup, Login e Contact: ora sono Client Components che usano `react-hook-form` + `zodResolver` con i componenti shadcn `Form`, `FormField`, `Input`, `Textarea`, `Button`. Validazione client-side attiva, submit temporaneo via `console.log` (la logica di auth e invio email arriverà nelle Fasi 4c, 4d e 7).
- Sostituita la classe Tailwind `accent` (brand blu del sito) con `primary` in tutte le pagine e componenti esistenti (`Navbar`, Home, Products, Terms, Privacy) per allinearsi alle convenzioni semantiche di shadcn. Il token `accent` ora rappresenta lo sfondo neutro per gli hover, come da standard shadcn.

---

## 0.4.0 — 2026-05-18

### Added

- Creati componenti condivisi `Navbar` e `Footer` in `src/components/layout/` (logo, link di navigazione, CTA Login/Get Started, copyright, link privacy/terms).
- Aggiunta Home page (`src/app/page.tsx`) con 4 sezioni: hero, value proposition (3 card), products preview e CTA finale.
- Aggiunta pagina Products (`src/app/products/page.tsx`) con card Frontline e 2 placeholder "Coming Soon".
- Aggiunta pagina Contact (`src/app/contact/page.tsx`) con form (Company, Email, Message) — solo UI, senza invio.
- Aggiunte pagine di autenticazione (`src/app/auth/signup/page.tsx` e `src/app/auth/login/page.tsx`) — solo UI, senza logica auth.
- Aggiunta pagina Terms & Conditions (`src/app/terms/page.tsx`) con i termini contrattuali in inglese.
- Aggiunta pagina Privacy Policy (`src/app/privacy/page.tsx`) come placeholder "Coming Soon".

### Changed

- Aggiornato il requisito minimo della password nella pagina Signup da 8 a 32 caratteri, in linea con quanto previsto in Fase 4.
- `src/app/layout.tsx`: integrati `Navbar` e `Footer`, corretto `lang="en"` e aggiornati metadata (title e description in inglese).

---

## 0.3.0 — 2026-05-18

### Added

- Aggiunte dipendenze `@supabase/supabase-js` e `@supabase/ssr` per l'integrazione con Supabase.
- Creato client Supabase per il browser in `src/lib/supabase/client.ts`.
- Creato client Supabase per il server in `src/lib/supabase/server.ts` con gestione dei cookie tramite `next/headers`.

---

## 0.2.0 — 2026-05-17

### Added

- Inizializzato progetto Next.js 16.2.6 con React 19.2.6, TypeScript 6 e Tailwind CSS v4.3.0.
- Aggiunti file di configurazione: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`.
- Creata struttura cartelle in `src/`: `app/`, `components/layout/`, `components/ui/`, `lib/`.
- Aggiunto helper `cn` in `src/lib/utils.ts` per la composizione di classi Tailwind.
- Configurata identità visiva del sito in `src/app/globals.css` (background nero, accent blu `#4A8FFF`, foreground `#C8C8C8`, dark theme permanente, font Inter).
- Creato layout root con metadata, font Inter e classe `dark` globale.
- Creata pagina placeholder "Coming Soon" con nome del sito in testo centrato.
- Aggiornate tutte le dipendenze alle ultime versioni stabili (Next.js 16.2.6, React 19.2.6, Tailwind CSS 4.3.0, TypeScript 6.0.3, lucide-react 1.16.0).

---

## 0.1.0 — 2026-05-17

### Added

- Setup progetto iniziale.
