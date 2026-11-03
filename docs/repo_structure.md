# Struttura repo

📁 b2b-saas-website/
 │
 ├── 📁 .next/                                               # Build di Next.js generata automaticamente. Non versionata.
 │
 ├── 📁 dev_support/                                         # Appunti di sviluppo (non versionato).
 │    ├── 📄 notes.md
 │    ├── 📄 to_do_list.md
 │    └── 📄 whiteboard.md
 │
 ├── 📁 docs/                                                # Documentazione operativa e tecnica.
 │    ├── 📁 website/
 │    │    ├── 📄 privacy_policy.md
 │    │    └── 📄 terms_and_conditions.md
 │    ├── 📄 anti_bot.md                                     # Protezione anti-bot: Turnstile su login, registrazione, cambio password e contatti; honeypot e rate limit (3 / 10 min per IP) sul form contatti.
 │    ├── 📄 api_endpoints.md                                # Contiene l'elenco degli endpoint API utilizzati.
 │    ├── 📄 architecture.md                                 # Architettura sistema e tech stack.
 │    ├── 📄 config.md                                       # Guida alla configurazione delle variabili d'ambiente e dei servizi.
 │    ├── 📄 deploy.md                                       # Processo di deploy su Vercel, ambienti staging/produzione e configurazione DNS.
 │    ├── 📄 observability.md                                # Sistema di logging e monitoraggio.
 │    ├── 📄 repo_structure.md                               # Struttura e spiegazione della repo.
 │    ├── 📄 security.md                                     # Postura di sicurezza accessi: geoblocking (attivo) e blocco Tor/VPN (non implementato, richiede Cloudflare).
 │    ├── 📄 sso.md                                          # Collegamento SSO tra il sito e le dashboard delle app (es. Frontline): JWT firmato, generato al click, testing e troubleshooting.
 │    ├── 📄 stripe.md                                       # Integrazione Stripe: checkout, webhook, customer portal.
 │    ├── 📄 supabase.md                                     # Schema database, autenticazione, RLS, trigger e gestione prodotti su Supabase.
 │    ├── 📄 TEMPLATE.md                                     # Template standard per la documentazione del progetto.
 │    └── 📄 wl_and_bl_country.md                            # Blacklist e whitelist dei paesi e zone geografiche in cui il sito può essere accessibile o meno.
 │
 ├── 📁 node_modules/                                        # Dipendenze npm installate localmente. Non versionata.
 │
 │    # Non c'è una cartella public/: nessun asset statico da servire (il nome del sito è solo testo).
 │
 ├── 📁 supabase/                                            # Definizione dello schema database Supabase (fonte di verità).
 │    └── 📁 migrations/                                     # Script SQL versionati da eseguire nel SQL Editor di Supabase, nello schema dedicato `website` (progetto condiviso con Frontline, che vive nello schema `frontline`).
 │         ├── 📄 0001_create_companies.sql                  # Crea lo schema `website`, la funzione trigger `set_updated_at`, la tabella `companies` e le sue RLS policy.
 │         ├── 📄 0002_create_products.sql                   # Tabella `products` (catalogo delle app, con colonne Stripe incluse), RLS pubblica in lettura e trigger.
 │         ├── 📄 0003_create_subscriptions.sql              # Tabella `subscriptions` (azienda↔prodotto, con colonne Stripe incluse), unique, indici, RLS e trigger.
 │         ├── 📄 0004_grant_website_privileges.sql          # GRANT espliciti su tutto lo schema `website` per `service_role`, `authenticated` e `anon`.
 │         ├── 📄 0005_seed_frontline.sql                # Seed idempotente del prodotto Frontline in `products`, con ID Stripe segnaposto e prezzo già impostati.
 │         ├── 📄 0006_harden_rls_and_grants.sql             # Hardening: UPDATE su `companies` limitato a `company_name`/`tax_id`, prodotti `archived` nascosti ad `anon`, EXECUTE di default solo a `service_role`.
 │         ├── 📄 0007_add_tax_id_country.sql                # Colonne `tax_id_country` e `tax_id_verification` su `companies`. UPDATE di `authenticated` ristretto a `company_name` (il tax ID non è più modificabile dal client).
 │         └── 📄 0008_add_tax_id_review_flag.sql            # Flag `tax_id_needs_review` su `companies` quando Stripe non verifica il tax ID del checkout.
 │
 ├── 📁 src/                                                 # Cartella contenente il codice sorgente.
 │    ├── 📁 app/                                            # Pagine e layout di Next.js (App Router).
 │    │    ├── 📁 (dashboard)/                                # Route group: sidebar laterale al posto di Navbar/Footer (URL invariati, area autenticata).
 │    │    │    ├── 📄 layout.tsx                             # Layout del gruppo: recupera l'azienda con `getCurrentCompany()` (redirect a `/auth/login` se assente), legge il cookie `sidebar_collapsed` con `cookies()` e lo passa come `defaultCollapsed` a `DashboardSidebar` (nessun flash visivo), monta il contenitore flex sidebar + main (`main` con padding-top responsive per non finire sotto la topbar mobile).
 │    │    │    └── 📁 dashboard/
 │    │    │         ├── 📄 actions.ts                       # Server action `createBillingPortalSessionAction`: crea Billing Portal Session Stripe per il cliente.
 │    │    │         ├── 📄 page.tsx                         # Overview: Server Component asincrono con vista riassuntiva — empty state se nessun abbonamento, banner di attenzione condizionale (past_due/incomplete), 2 card statistiche in stile vetro con icona (app attive, prossimo rinnovo) e 3 scorciatoie in stile vetro con `SpotlightCard` (My Apps, Manage billing tramite `BillingShortcutCard` se `hasBilling`, Settings), con animazioni Motion (`MotionStagger`/`MotionItem`).
 │    │    │         ├── 📁 apps/
 │    │    │         │    ├── 📄 actions.ts                  # Server action `openProductAppAction`: verifica login e abbonamento attivo, firma un JWT SSO fresco (60s) e restituisce l'URL da aprire.
 │    │    │         │    └── 📄 page.tsx                    # Pagina My Apps: Server Component asincrono con la lista reale degli abbonamenti (griglia di SubscriptionCard in stile vetro con animazione Motion, empty state). Il bottone "Open app" (attivo solo se `status = active`) è `OpenAppButton` (usa il componente `Button` condiviso): genera il token al click, non al caricamento della pagina.
 │    │    │         └── 📁 settings/
 │    │    │              ├── 📄 actions.ts                  # Server action `changePasswordAction`: verifica l'utente, riautentica con la password attuale (`signInWithPassword`, con `captchaToken`) e aggiorna la password (`updateUser`). `captcha_failed` non viene mostrato come password errata.
 │    │    │              └── 📄 page.tsx                    # Pagina Settings: sezione "Change password" in `AuthCard` che monta `ChangePasswordForm`.
 │    │    ├── 📁 (site)/                                    # Route group: pagine con Navbar e Footer. Non cambia gli URL.
 │    │    │    ├── 📄 layout.tsx                            # Layout del gruppo: Navbar + main + Footer condivisi.
 │    │    │    ├── 📄 page.tsx                              # Home page (Client Component): hero con `AuroraBackground`, value proposition a card spotlight, products preview e CTA finale, con animazioni Motion.
 │    │    │    ├── 📁 auth/                                 # Pagine e route di autenticazione.
 │    │    │    │    ├── 📁 callback/
 │    │    │    │    │    └── 📄 route.ts                    # Route handler GET: scambia il codice di conferma email per una sessione. In caso di errore reindirizza a `/auth/login?error=<codice interno>` (`link_expired` / `link_invalid` / `auth_failed`) e logga con prefisso `[authCallback]`.
 │    │    │    │    ├── 📁 login/
 │    │    │    │    │    ├── 📄 actions.ts                  # Server action `loginAction`: signInWithPassword (con `captchaToken`) + redirect alla dashboard (o al path `next`, se sicuro). `captcha_failed` → "Verification failed. Please try again."
 │    │    │    │    │    └── 📄 page.tsx                    # Pagina di login (Email, Password, widget Turnstile): `AuroraBackground` subtle, titolo in `font-heading`, form in `AuthCard`, animazioni Motion. `Suspense` intorno al form per `useSearchParams`. Mostra gli errori del callback di conferma (`?error=` con i 3 codici interni noti). Il submit resta disabilitato finché non c'è un token; il widget si resetta se l'action fallisce.
 │    │    │    │    ├── 📁 signup/
 │    │    │    │    │    ├── 📄 actions.ts                  # Server action `signupAction`: formato tax ID, rate limit, VIES se paese UE o numero `XI`, poi signUp Supabase (con `captchaToken`), INSERT su `companies` (paese e stato verifica) e cleanup in caso di errore.
 │    │    │    │    │    └── 📄 page.tsx                    # Pagina di registrazione (Company, Email, Country, Tax ID senza placeholder, Password, widget Turnstile): stesso trattamento visivo del login; lo stato "Check your inbox" usa `AuthCard`.
 │    │    │    │    └── 📄 actions.ts                       # Server action `logoutAction`: signOut + redirect alla home.
 │    │    │    ├── 📁 checkout/                             # Pagine di esito del flusso Stripe Checkout.
 │    │    │    │    ├── 📁 cancel/
 │    │    │    │    │    └── 📄 page.tsx                    # Pagina mostrata da Stripe se l'utente abbandona il checkout: `AuthCard`, titolo in `font-heading`, bottone outline "Back to Products". Nessun `AuroraBackground`.
 │    │    │    │    └── 📁 success/
 │    │    │    │         └── 📄 page.tsx                    # Server Component asincrono: legge `?product=<slug>` dall'URL, risolve il nome reale da DB via `getProductNameBySlug`, mostra un fallback generico se assente. `AuroraBackground` subtle, contenuto in `AuthCard`, bottone "Go to Dashboard".
 │    │    │    ├── 📁 contact/
 │    │    │    │    ├── 📄 actions.ts                       # Server action `sendContactMessageAction`: validazione, honeypot (successo finto), rate limit Upstash (3 / 10 min per IP, fail-open), verifica Turnstile, poi invio email via Resend (from noreply, to CONTACT_RECIPIENT_EMAIL, replyTo email cliente).
 │    │    │    │    └── 📄 page.tsx                         # Pagina Contact con form (Company, Email, Message, honeypot nascosto, widget Turnstile): `AuroraBackground` subtle, titolo in `font-heading`, form e stato "Message sent!" in `AuthCard`, animazioni Motion.
 │    │    │    ├── 📁 privacy/
 │    │    │    │    └── 📄 page.tsx                         # Pagina Privacy Policy (informativa GDPR completa, 11 sezioni + tabelle dati). Titolo in `font-heading`; resto invariato.
 │    │    │    ├── 📁 products/
 │    │    │    │    ├── 📄 actions.ts                       # Server action `createCheckoutSessionAction`: valida utente + prodotto, blocca un nuovo checkout se esiste già una subscription `active`/`past_due`/`incomplete` (messaggio dedicato se `incomplete`), crea Checkout Session Stripe riusando `company.stripe_customer_id` se presente (altrimenti `customer_email`, e Stripe crea un nuovo Customer). `success_url` include `&product=<slug>`.
 │    │    │    │    └── 📄 page.tsx                         # Server Component dinamico: carica prodotti da DB, UI adattiva per anonimo / loggato / già abbonato.
 │    │    │    └── 📁 terms/
 │    │    │         └── 📄 page.tsx                         # Pagina Terms & Conditions in inglese. Titolo in `font-heading`; resto invariato.
 │    │    ├── 📁 api/                                       # Route Handlers HTTP.
 │    │    │    └── 📁 stripe/
 │    │    │         └── 📁 webhook/
 │    │    │              └── 📄 route.ts                    # POST /api/stripe/webhook: verifica firma HMAC e sincronizza `subscriptions`.
 │    │    ├── 📁 blocked/
 │    │    │    └── 📄 page.tsx                              # Pagina statica mostrata ai visitatori geobloccati: icona ShieldX e titolo "Service Not Available" in `font-heading`. Fuori dal gruppo (site) — nessuna Navbar né Footer. Nessun `AuroraBackground` né `AuthCard`.
 │    │    ├── 📄 error.tsx                                  # Error boundary Client Component per le route sotto il layout root: logga l'errore, mostra "Something went wrong" in stile pagine di servizio (`AuthCard`, `font-heading`) con "Try again" e "Back to home".
 │    │    ├── 📄 global-error.tsx                            # Error boundary Client Component per gli errori nel root layout stesso: renderizza il proprio `<html>`/`<body>` (non può riusare `layout.tsx`) con messaggio e bottone "Try again".
 │    │    ├── 📄 globals.css                                # Stili globali e identità visiva Acme Labs (Tailwind v4): palette dark, token `--color-violet` e `--color-warning`, radius, font Space Grotesk (titoli) + DM Sans (testo).
 │    │    ├── 📄 layout.tsx                                 # Layout root: metadata (con `robots: noindex` se `NEXT_PUBLIC_SITE_URL` non è il dominio di produzione), font Space Grotesk + DM Sans, `MotionProvider`, body di base e Toaster (sonner). Nessuna Navbar né Footer (delegati a (site)/layout.tsx).
 │    │    └── 📄 loading.tsx                                # Fallback di caricamento generico (spinner `Loader2`) mostrato da Next.js durante la navigazione tra route.
 │    ├── 📁 components/                                     # Componenti React riutilizzabili.
 │    │    ├── 📁 dashboard/                                 # Componenti specifici della dashboard.
 │    │    │    ├── 📄 BillingShortcutCard.tsx               # Client Component: card cliccabile "Manage billing" per l'Overview, con lo stesso bagliore al passaggio del mouse degli altri due riquadri (riusa `SPOTLIGHT_CARD_BASE_CLASSNAME` e la logica condivisa da `spotlight-card.tsx`) — al click apre il Customer Portal Stripe, spinner al posto dell'icona durante il caricamento, messaggio di errore inline in caso di fallimento.
 │    │    │    ├── 📄 OpenAppButton.tsx                     # Client Component: bottone "Open app" — al click apre subito una scheda vuota (per non perdere il gesto utente), chiama `openProductAppAction`, mostra uno spinner durante l'attesa, naviga la scheda all'URL firmato oppure chiude e mostra un errore inline. Usa il componente `Button` condiviso.
 │    │    │    ├── 📄 ChangePasswordForm.tsx                # Client Component: form `react-hook-form` + zod a 3 campi (attuale, nuova, conferma) più widget Turnstile per il cambio password, con messaggi di errore/successo e reset di form e widget dopo l'invio.
 │    │    │    ├── 📄 DashboardSidebar.tsx                  # Client Component: sidebar desktop con il nome Acme Labs, 3 voci di navigazione (Overview, My Apps, Settings — icone lucide, active state via `usePathname`, `aria-label`/`aria-current` sulle voci, visibili anche da collassata), blocco account in fondo con nome azienda e icona Log out sulla stessa riga (stile compatto con bordo e tooltip), e toggle collassa/espandi (icone `PanelLeftClose`/`PanelLeftOpen`, stato persistito via cookie `sidebar_collapsed`) — da `w-64` a `w-16` icon-only; su mobile diventa topbar con hamburger + drawer a scomparsa (`role="dialog"`/`aria-modal`, focus trap via `useFocusTrap`, stato open/close via `useDrawer`); drawer chiuso è `inert`/`aria-hidden`; sfondo `bg-card` e stato di navigazione attivo con tinta `primary`.
 │    │    │    ├── 📄 NoAppsEmptyState.tsx               # Empty state condiviso "No apps yet" + CTA "Browse Products", usato da Overview e pagina My Apps.
 │    │    │    └── 📄 SubscriptionStatusBadge.tsx           # Badge stilizzato per i 4 stati abbonamento (active, past_due con il nuovo colore warning ambra, canceled, incomplete).
 │    │    ├── 📁 layout/                                    # Componenti di layout condivisi.
 │    │    │    ├── 📄 AuroraBackground.tsx                  # Client Component decorativo: macchie di luce blu/violetto sfocate dietro al contenuto (Home, Products, Login, Registrazione, Contact, Checkout Success). Prop `intensity` (`default` | `subtle`).
 │    │    │    ├── 📄 Footer.tsx                            # Footer minimale con copyright e link privacy/terms (bordo vetro).
 │    │    │    ├── 📄 LogoutButton.tsx                      # Client component che invoca `useLogout` (bottone `outline`).
 │    │    │    ├── 📄 MobileNavMenu.tsx                     # Client Component: menu hamburger + drawer mobile (`role="dialog"`/`aria-modal`, stato open/close via `useDrawer`, focus trap via `useFocusTrap`, `inert` da chiuso, portale su `document.body`) e `NavbarFrame` (fade-in + sfondo che si rafforza allo scroll).
 │    │    │    └── 📄 Navbar.tsx                            # Server Component asincrono: mostra CTA Login/Get Started se anonimo, link Dashboard + nome azienda + Log out se autenticato; su mobile usa `MobileNavMenu`.
 │    │    ├── 📁 products/                                  # Componenti della pagina prodotti.
 │    │    │    └── 📄 ProductCtaButton.tsx                  # Client Component con CTA adattiva: Sign up / Subscribe (Stripe) / Manage in Dashboard / Not available yet. Errori Stripe mostrati via `toast.error()`.
 │    │    └── 📁 ui/                                        # Componenti shadcn/ui.
 │    │         ├── 📄 auth-card.tsx                         # Wrapper statico "vetro" per i form e le pagine di conferma (niente hover/spotlight). Usato in Login, Registrazione, Contact, Checkout Success/Cancel e nei box di conferma.
 │    │         ├── 📄 button.tsx                            # Componente Button (varianti default, outline, ghost, ecc.). Il variant `default` ha un bagliore al hover (disattivato se l'utente ha "riduci animazioni").
 │    │         ├── 📄 form.tsx                              # Wrapper shadcn per react-hook-form (Form, FormField, FormItem, FormLabel, FormControl, FormMessage).
 │    │         ├── 📄 input.tsx                             # Componente Input.
 │    │         ├── 📄 label.tsx                             # Componente Label.
 │    │         ├── 📄 select.tsx                            # `<select>` nativo con lo stesso stile degli input e freccia a destra. Usato per il paese in registrazione.
 │    │         ├── 📄 sonner.tsx                            # Wrapper `<Toaster />` per sonner: tema dark fisso, token CSS del progetto.
 │    │         ├── 📄 spotlight-card.tsx                    # Client Component `SpotlightCard`: card con bagliore al cursore, sollevamento al hover e rispetto di "riduci animazioni". Prop `dimmed` per i prodotti non disponibili. Esporta anche `SPOTLIGHT_CARD_BASE_CLASSNAME`, `MotionStagger`/`MotionItem` per le animazioni di apparizione, e la logica del bagliore (`handleSpotlightPointerMove`, `spotlightInitialStyle`, `SpotlightGlowLayer`) riusata da `BillingShortcutCard.tsx`.
 │    │         ├── 📄 textarea.tsx                          # Componente Textarea.
 │    │         └── 📄 turnstile-widget.tsx                  # Client Component: widget Cloudflare Turnstile (tema dark). Espone `reset()` perché il token è monouso; `onToken` vale `null` finché non c'è un token valido.
 │    ├── 📁 lib/                                            # Utility e funzioni condivise.
 │    │    ├── 📁 auth/                                      # Logica condivisa di autenticazione.
 │    │    │    ├── 📄 blocked-email-domains.ts              # Lista dei domini email personali bloccati al signup.
 │    │    │    ├── 📄 callback-errors.ts                    # Codici interni del callback di conferma email (`link_expired`, `link_invalid`, `auth_failed`), type guard `isAuthCallbackErrorCode` e messaggi fissi mostrati sulla login.
 │    │    │    └── 📄 safe-redirect.ts                      # `isSafeNextPath`: accetta solo path interni, rifiuta protocol-relative (`//evil.com`) e trick con backslash. Usata da login e `/auth/callback`.
 │    │    ├── 📁 dashboard/                                 # Helper di accesso ai dati della dashboard.
 │    │    │    ├── 📄 date-formatter.ts                     # `DASHBOARD_DATE_FORMATTER`: `Intl.DateTimeFormat` en-US condiviso da Overview e pagina My Apps.
 │    │    │    ├── 📄 queries.ts                            # `getCurrentCompany` (avvolta in `cache()` di React, memo per-request) e `getSubscriptionsForCompany`. `company.stripe_customer_id` è la fonte di verità per il billing.
 │    │    │    └── 📄 sidebar-preference.ts                 # Costanti `SIDEBAR_COOKIE_NAME` (`"sidebar_collapsed"`) e `SIDEBAR_COOKIE_MAX_AGE` (1 anno) per la preferenza sidebar collassata, condivise fra server e client.
 │    │    ├── 📁 geo/                                       # Helper per il geoblocking.
 │    │    │    └── 📄 allowed-countries.ts                  # `ALLOWED_COUNTRIES` (Set di 42 codici ISO 3166-1 alpha-2) e funzione pura `isCountryAllowed(country)`.
 │    │    ├── 📁 hooks/                                     # Hook React client condivisi.
 │    │    │    ├── 📄 use-drawer.ts                         # `useDrawer`: stato open/close dei drawer mobile (chiusura su cambio pagina, blocco scroll, Escape). Usato da `MobileNavMenu` e `DashboardSidebar`.
 │    │    │    ├── 📄 use-focus-trap.ts                     # `useFocusTrap`: trap Tab/Shift+Tab nel drawer, focus sul primo elemento all'apertura, ripristino sul trigger alla chiusura.
 │    │    │    └── 📄 use-logout.ts                         # `useLogout`: `useTransition` + `logoutAction`. Usato da `LogoutButton` e `CompactLogoutButton`.
 │    │    ├── 📁 http/                                      # Helper HTTP server-only.
 │    │    │    └── 📄 request-origin.ts                     # `getRequestOrigin()`: origin assoluto da `NEXT_PUBLIC_SITE_URL` (obbligatoria in production; in locale fallback a `http://localhost:3000`). Non usa Host/`X-Forwarded-Proto`. Usato da signup, checkout e billing portal.
 │    │    ├── 📁 motion/                                    # Convenzioni condivise per le animazioni Motion.
 │    │    │    ├── 📄 provider.tsx                          # Client Component `MotionProvider`: wrappa l'app con `MotionConfig reducedMotion="user"` (rispetta "riduci animazioni" del sistema).
 │    │    │    └── 📄 variants.ts                           # Varianti riutilizzabili (`fadeInUp`, `staggerContainer`, `cardHover`) e `inViewViewport`.
 │    │    ├── 📁 products/                                  # Helper di query per il catalogo prodotti (server-only).
 │    │    │    └── 📄 queries.ts                            # `getAvailableProducts` (esclude `archived`), `getUserActiveSubscriptionSlugs` e `getProductNameBySlug`.
 │    │    ├── 📁 resend/                                    # Helper Resend lato server.
 │    │    │    ├── 📄 alerts.ts                             # `sendTaxIdReviewAlert`: email al proprietario quando un tax ID Stripe va controllato. Non lancia mai.
 │    │    │    └── 📄 server.ts                             # `getResendClient()`: singleton del client Resend inizializzato da `RESEND_API_KEY`.
 │    │    ├── 📁 security/                                  # Helper server per Turnstile e rate limit.
 │    │    │    ├── 📄 client-ip.ts                          # `getClientIp()`: primo valore di `x-forwarded-for`, altrimenti `x-real-ip`.
 │    │    │    ├── 📄 rate-limit.ts                         # `checkContactRateLimit` (3 / 10 min, prefisso `app:contact`) e `checkSignupRateLimit` (10 / 10 min, prefisso `app:signup`). Fail-open se le variabili mancano o Redis non risponde.
 │    │    │    └── 📄 turnstile.ts                          # `verifyTurnstileToken` (siteverify, fail-closed) e `isCaptchaVerificationError` per l'errore Supabase `captcha_failed`.
 │    │    ├── 📁 tax-id/                                    # Formato del tax ID e verifica VIES.
 │    │    │    ├── 📄 countries.ts                          # I 42 paesi ammessi, flag UE e prefisso VIES (`GR` → `EL`). Nomi da `Intl.DisplayNames`.
 │    │    │    ├── 📄 formats.ts                            # Regole di formato per paese. 18 paesi senza regola nazionale usano il controllo generico (4–20 caratteri alfanumerici).
 │    │    │    ├── 📄 normalize.ts                          # Maiuscolo, senza spazi/punti/trattini, prefisso paese tolto se il resto è valido.
 │    │    │    └── 📄 vies.ts                               # `checkVatNumber`: POST al REST VIES, timeout 8s, esito `valid` / `invalid` / `unavailable`.
 │    │    ├── 📁 stripe/                                    # Helper Stripe lato server.
 │    │    │    ├── 📄 server.ts                             # `getStripeServerClient()`: singleton del client Stripe con apiVersion pinnata a `"2026-04-22.dahlia"` (`@ts-expect-error` perché l'SDK tipizza solo la snapshot più recente).
 │    │    │    └── 📄 webhook-handlers.ts                   # Gestori Stripe: checkout completed, subscription updated/deleted, e `handleTaxIdChanged` per `customer.tax_id.created` / `updated`.
 │    │    ├── 📁 sso/                                       # Firma del token di accesso verso le dashboard dei prodotti.
 │    │    │    └── 📄 token.ts                              # `generateSsoToken` (JWT HS256, 60s, `jti` univoco, claim azienda e `product`) e `buildSsoOpenUrl` (appende `sso_token` a `web_app_url`).
 │    │    ├── 📁 supabase/                                  # Client Supabase per i diversi contesti.
 │    │    │    ├── 📄 admin.ts                              # Client server-only con `service_role` (bypassa RLS, solo per operazioni admin).
 │    │    │    ├── 📄 middleware.ts                         # Helper `updateSession` usato dal proxy Next.js (refresh sessione + propagazione cookie).
 │    │    │    └── 📄 server.ts                             # Client Supabase per Server Components e API Routes.
 │    │    ├── 📁 validations/                               # Schemi zod per la validazione dei form.
 │    │    │    ├── 📄 auth.ts                               # Schemi `signupSchema` (con `taxIdCountry` e formato del tax ID), `loginSchema` e `changePasswordSchema` (currentPassword, newPassword min 16 / max 128 char, confirmPassword combaciante e diversa dalla attuale). Costanti `PASSWORD_MIN_LENGTH` / `PASSWORD_MAX_LENGTH`.
 │    │    │    └── 📄 contact.ts                            # Schema `contactSchema`.
 │    │    └── 📄 utils.ts                                   # Helper `cn` per la composizione di classi Tailwind.
 │    └── 📄 proxy.ts                                        # Proxy Next.js (ex-middleware): (1) geoblocking per paese (whitelist 42 paesi, bypass in sviluppo); (2) refresh sessione Supabase e redirect rotte protette/auth. Lo staging è protetto da Vercel Authentication, non dal proxy.
 │
 ├── 📁 tests/                                               # Test automatici per tutte le funzioni e i moduli.
 │    ├── 📄 auth-callback-route.test.ts                     # Test unitari per `GET /auth/callback`: `otp_expired` → `link_expired`, errore generico / nessun param → `link_invalid`, exchange ok (`/dashboard` o `next` sicuro), `next` protocol-relative, exchange fallito → `auth_failed`, log `[authCallback]`.
 │    ├── 📄 callback-errors.test.ts                         # Test unitari per `isAuthCallbackErrorCode` (accetta i 3 codici, rifiuta null/vuoto/testo arbitrario) e messaggi non vuoti.
 │    ├── 📄 change-password-action.test.ts                  # Test unitari per `changePasswordAction`: confirm diversa, nuova uguale alla attuale, password oltre 128 char, non autenticato, token passato alla riautenticazione, `captcha_failed` distinto dalla password errata, riautenticazione fallita (niente `updateUser`), `updateUser` in errore, successo.
 │    ├── 📄 client-ip.test.ts                               # Test unitari per `getClientIp`: primo IP di `x-forwarded-for`, fallback `x-real-ip`, `unknown` se mancano entrambi.
 │    ├── 📄 contact-action.test.ts                          # Test unitari per `sendContactMessageAction`: validazione fallita, honeypot (niente invio), rate limit superato, Turnstile rifiutato, invio ok, errore Resend, env mancante.
 │    ├── 📄 create-billing-portal-session-action.test.ts    # Test unitari per `createBillingPortalSessionAction`: non autenticato, nessun `stripe_customer_id`, successo (customer + return_url), errore Stripe.
 │    ├── 📄 create-checkout-session-action.test.ts          # Test unitari per `createCheckoutSessionAction`: non autenticato, prodotto assente/non disponibile/senza price, subscription `active` o `incomplete` (nessuna chiamata Stripe), successo con metadata, errore Stripe.
 │    ├── 📄 get-product-name-by-slug.test.ts                # Test unitari per `getProductNameBySlug`: nome trovato, slug non trovato, errore Supabase.
 │    ├── 📄 is-country-allowed.test.ts                      # Test unitari per `isCountryAllowed`: whitelist, blacklist, null, undefined, lowercase, codici sconosciuti.
 │    ├── 📄 login-action.test.ts                            # Test unitari per `loginAction`: validazione fallita, token passato a `signInWithPassword`, `captcha_failed`, credenziali errate, email non confermata, errore inatteso, redirect a `/dashboard`, `next` sicuro vs protocol-relative.
 │    ├── 📄 logout-action.test.ts                           # Test unitari per `logoutAction`: signOut ok e signOut in errore — in entrambi i casi redirect a `/`.
 │    ├── 📄 open-product-app-action.test.ts                  # Test unitari per `openProductAppAction`: non autenticato, subscription assente/non attiva, successo, errore di firma.
 │    ├── 📄 proxy.test.ts                                   # Test unitari per `proxy`: geoblocking (paese bloccato/ammesso), rotte protette e auth (con/senza utente).
 │    ├── 📄 rate-limit.test.ts                              # Test unitari per `checkContactRateLimit` (3 / 10 min) e `checkSignupRateLimit` (10 / 10 min): consentito, bloccato, fail-open se Upstash lancia, skip se mancano le variabili.
 │    ├── 📄 request-origin.test.ts                          # Test unitari per `getRequestOrigin`: env valida (anche con slash finale), URL invalido, env assente in production (throw) e in test (fallback `http://localhost:3000`).
 │    ├── 📄 signup-action.test.ts                           # Test unitari per `signupAction`: validazione fallita, token passato a `signUp`, `captcha_failed`, paese non UE senza VIES, VIES `valid`/`invalid`/`unavailable`, rate limit, numero `XI`, guardia `identities`, insert con paese e stato verifica, cleanup.
 │    ├── 📄 tax-id-formats.test.ts                          # Test dei formati tax ID per ogni paese, normalizzazione, `GR`/`EL` e `XI`.
 │    ├── 📄 tax-id-review-alert.test.ts                     # Test di `sendTaxIdReviewAlert`: invio ok, errore Resend, eccezione, destinatario mancante. Nessuno di questi casi lancia.
 │    ├── 📄 sso-token.test.ts                               # Test unitari per `generateSsoToken` / `buildSsoOpenUrl`: claim (`jti` UUID, `product`), scadenza 60s, firma valida, errore se manca `SSO_SHARED_SECRET`.
 │    ├── 📄 stripe-webhook-route.test.ts                    # Test unitari per `POST /api/stripe/webhook`: secret/firma mancanti, firma invalida, eventi non gestiti, dispatch dei 5 eventi (inclusi i due sul tax ID), handler che lancia → 500 (Stripe ritenta).
 │    ├── 📄 turnstile.test.ts                               # Test unitari per `verifyTurnstileToken`: successo, token rifiutato, errore di rete, `TURNSTILE_SECRET_KEY` assente.
 │    ├── 📄 vies-client.test.ts                             # Test di `checkVatNumber`: valido, non valido, `INVALID_INPUT`, HTTP non 2xx, timeout, corpo illeggibile, `actionSucceed: false`.
 │    └── 📄 webhook-handlers.test.ts                        # Test dei handler Stripe, incluso `handleTaxIdChanged`: flag, email una sola volta, azienda assente, errore DB, email che fallisce.
 │
 ├── 📄 .env                                                 # Contiene le chiavi API e variabili d'ambiente riservate.
 ├── 📄 .env.example                                         # Contiene un esempio delle variabili d'ambiente in uso.
 ├── 📄 .gitignore                                           # Elenco dei file e delle cartelle esclusi dal controllo di versione.
 ├── 📄 CHANGELOG.md                                         # Storico versioni e modifiche del progetto.
 ├── 📄 components.json                                      # Configurazione shadcn/ui (alias, stile, base color).
 ├── 📄 eslint.config.mjs                                    # Configurazione ESLint flat (preset `eslint-config-next` core-web-vitals + typescript).
 ├── 📄 next-env.d.ts                                        # Type definitions di Next.js (auto-generato).
 ├── 📄 vitest.config.ts                                     # Configurazione Vitest: environment node, alias `@` → `src/`.
 ├── 📄 next.config.ts                                       # Configurazione di Next.js: `reactStrictMode` e security header (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` enforced; CSP in report-only, con `https://challenges.cloudflare.com` per il widget Turnstile).
 ├── 📄 package.json                                         # Dipendenze npm e script del progetto.
 ├── 📄 postcss.config.mjs                                   # Configurazione PostCSS (richiesta da Tailwind).
 ├── 📄 README.md                                            # Panoramica, istruzioni e info rapide sul progetto.
 └── 📄 tsconfig.json                                        # Configurazione TypeScript.
