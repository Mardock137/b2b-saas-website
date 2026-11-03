# Endpoint API

Elenco delle route HTTP esposte dal sito Acme Labs (Route Handlers e server actions raggiungibili via URL).

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Endpoint](#️-endpoint)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Il sito è costruito con Next.js App Router. La maggior parte della logica avviene tramite **server actions** invocate dai form, che non hanno un URL pubblico stabile (ma sono comunque raggiungibili dal client, quindi documentate come superficie applicativa). Le **Route Handler** (`route.ts`), invece, sono raggiungibili come endpoint HTTP veri e propri. Questo documento copre entrambe le categorie.

---

## ⚙️ Endpoint

### Server action `signupAction`

Server action invocata dal form di registrazione.

| Campo           | Valore                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Codice sorgente | [`src/app/(site)/auth/signup/actions.ts`](../src/app/(site)/auth/signup/actions.ts)                                                                                                                                                                                                                                                                                                                                                                                             |
| Parametri       | `values: SignupValues` — `{ companyName, email, taxIdCountry, taxId, password }`. `taxIdCountry` è uno dei 42 paesi ammessi. Il tax ID è normalizzato e il formato dipende dal paese (niente più minimo di 4 caratteri). Password min 16 / max 128. `captchaToken: string` — token Turnstile, passato a Supabase in `options.captchaToken`.                                                                                                                                     |
| Comportamento   | Rivalida i dati, applica il rate limit di registrazione (10 / 10 min per IP), verifica su VIES le partite IVA UE e i numeri britannici che iniziano per `XI`, poi chiama `supabase.auth.signUp` (redirect verso `/auth/callback`, con il token captcha). Guardia anti-enumerazione se `identities` è vuoto. INSERT su `companies` col client admin (`tax_id` normalizzato, `tax_id_country`, `tax_id_verification`). Se l'INSERT fallisce, elimina l'utente Auth appena creato. |
| Errori          | `{ success: false, error }` per validazione fallita, troppi tentativi, partita IVA non trovata su VIES, VIES non disponibile, captcha rifiutato (`Verification failed. Please try again.`), email già registrata, o errore Supabase.                                                                                                                                                                                                                                            |

---

### Server action `loginAction`

Server action invocata dal form di login.

| Campo           | Valore                                                                                                                                                                                                           |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                                                              |
| Codice sorgente | [`src/app/(site)/auth/login/actions.ts`](../src/app/(site)/auth/login/actions.ts)                                                                                                                                |
| Parametri       | `values: LoginValues` — `{ email, password }`. `captchaToken: string` — token Turnstile, passato a `signInWithPassword` in `options.captchaToken`. `next?: string` — path di destinazione post-login, opzionale. |
| Comportamento   | Rivalida i dati, chiama `supabase.auth.signInWithPassword` con il token captcha. Al successo, redirect a `next` se è un path sicuro (`isSafeNextPath`), altrimenti a `/dashboard`.                               |
| Errori          | Messaggi dedicati per captcha rifiutato (`Verification failed. Please try again.`), credenziali invalide ed email non confermata; messaggio generico per altri errori (loggati con `console.error`).             |

---

### Server action `logoutAction`

Server action invocata dal bottone "Log out" (Navbar e sidebar dashboard).

| Campo           | Valore                                                                                                                                                             |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                |
| Codice sorgente | [`src/app/(site)/auth/actions.ts`](../src/app/(site)/auth/actions.ts)                                                                                              |
| Parametri       | Nessuno                                                                                                                                                            |
| Comportamento   | `supabase.auth.signOut()`, poi `revalidatePath("/", "layout")` e redirect a `/`. Un eventuale errore di sign-out viene solo loggato: il redirect avviene comunque. |

---

### `GET /auth/callback`

Handler invocato da Supabase Auth dopo che l'utente clicca sul link di conferma ricevuto via email.

| Campo            | Valore                                                                                                                                                                                                                                                                                                              |
|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Metodo           | `GET`                                                                                                                                                                                                                                                                                                               |
| Codice sorgente  | [`src/app/(site)/auth/callback/route.ts`](../src/app/(site)/auth/callback/route.ts)                                                                                                                                                                                                                                 |
| Query params     | `code` (opzionale): codice one-time emesso da Supabase. `next` (opzionale): path di redirect post-login (default `/dashboard`, validato con `isSafeNextPath`). In caso di link scaduto/invalido Supabase manda `error`, `error_code` (es. `otp_expired`) e `error_description` al posto di `code`.                  |
| Comportamento    | Se `code` è presente, scambia il codice per una sessione (`supabase.auth.exchangeCodeForSession`), imposta i cookie e reindirizza a `next`. Se manca `code` o lo scambio fallisce, reindirizza a `/auth/login?error=<codice interno>`. L'errore completo è sempre loggato con prefisso `[authCallback]`.            |
| Errori           | Codici interni fissi, mai il messaggio grezzo di Supabase: `link_expired` (`error_code=otp_expired` o scambio fallito con "expired"), `link_invalid` (`error`/`error_code` senza `code`, o nessun parametro), `auth_failed` (scambio fallito per altro motivo). La pagina di login mostra solo i tre messaggi noti. |

---

### `POST /api/stripe/webhook`

Endpoint ricevuto da Stripe ad ogni evento del ciclo di vita delle subscription. Verifica la firma HMAC e sincronizza la tabella `subscriptions`.

| Campo            | Valore                                                                                                                                                                                                                                                                                                                                                       |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Metodo           | `POST`                                                                                                                                                                                                                                                                                                                                                       |
| Codice sorgente  | [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts)                                                                                                                                                                                                                                                                              |
| Autenticazione   | Firma HMAC `stripe-signature` verificata con `STRIPE_WEBHOOK_SECRET`                                                                                                                                                                                                                                                                                         |
| Eventi gestiti   | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.tax_id.created`, `customer.tax_id.updated`                                                                                                                                                                                                         |
| Comportamento    | Verifica firma → dispatch all'handler. Gli eventi di abbonamento aggiornano `website.subscriptions`. Gli eventi sul tax ID segnano l'azienda "da controllare" se Stripe non verifica il numero, e mandano un'email. Risponde `200 { received: true }` in caso di successo. Se l'azienda non è ancora collegata al Customer, risponde `500` e Stripe ritenta. |
| Errori           | `400` per firma mancante o non valida. `500` per errori di configurazione o handler.                                                                                                                                                                                                                                                                         |
| Esclusione proxy | La route è esclusa automaticamente dal `matcher` del proxy (`api/.*` è già escluso).                                                                                                                                                                                                                                                                         |

---

### Server action `createBillingPortalSessionAction`

Server action invocata da `BillingShortcutCard` per aprire il Customer Portal di Stripe.

| Campo           | Valore                                                                                                                                                                                                     |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                                                        |
| Codice sorgente | [`src/app/(dashboard)/dashboard/actions.ts`](../src/app/(dashboard)/dashboard/actions.ts)                                                                                                                  |
| Parametri       | Nessuno (legge l'utente dalla sessione)                                                                                                                                                                    |
| Comportamento   | Verifica auth, legge `stripe_customer_id` da `auth.company` (già caricato da `getCurrentCompany`, nessun query extra), crea Billing Portal Session Stripe e restituisce `{ success: true, url }` o errore. |
| Return URL      | `/dashboard` — il cliente torna alla dashboard dopo aver completato le azioni nel portal.                                                                                                                  |

---

### Server action `createCheckoutSessionAction`

Server action invocata da `ProductCtaButton` per avviare il flusso di acquisto Stripe Checkout.

| Campo           | Valore                                                                                                                                                                                                                                                                                                                                                                                                                       |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                                                                                                                                                                                                                                                                          |
| Codice sorgente | [`src/app/(site)/products/actions.ts`](../src/app/(site)/products/actions.ts)                                                                                                                                                                                                                                                                                                                                                |
| Parametri       | `productSlug: string`                                                                                                                                                                                                                                                                                                                                                                                                        |
| Comportamento   | Verifica auth, recupera product da DB, blocca se esiste già una subscription `active`/`past_due`/`incomplete` (messaggio dedicato se `incomplete`), crea Checkout Session Stripe. Il tax ID è obbligatorio al checkout quando Stripe lo supporta per il paese (`tax_id_collection.required = if_supported`). Se l'azienda ha già un Customer Stripe, la sessione lo riusa e salva il nome con `customer_update.name = auto`. |
| Redirect Stripe | Success → `/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=<slug>`. Cancel → `/checkout/cancel`.                                                                                                                                                                                                                                                                                                                  |

---

### `GET /checkout/success`

Pagina mostrata da Stripe dopo un pagamento completato.

| Campo            | Valore                                                                                                                                                                                                 |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Metodo           | `GET` (navigazione browser)                                                                                                                                                                            |
| Codice sorgente  | [`src/app/(site)/checkout/success/page.tsx`](../src/app/(site)/checkout/success/page.tsx)                                                                                                              |
| Query params     | `session_id` (passato da Stripe, non letto dalla pagina). `product` (slug del prodotto acquistato, passato da `createCheckoutSessionAction` nel `success_url`).                                        |
| Comportamento    | Server Component asincrono. Se `product` è presente chiama `getProductNameBySlug` e mostra il nome reale nel testo. Fallback generico se lo slug è assente o non trovato in DB. CTA "Go to Dashboard". |

---

### `GET /checkout/cancel`

Pagina mostrata da Stripe se l'utente abbandona il checkout.

| Campo            | Valore                                                                                  |
|------------------|-----------------------------------------------------------------------------------------|
| Metodo           | `GET` (navigazione browser)                                                             |
| Codice sorgente  | [`src/app/(site)/checkout/cancel/page.tsx`](../src/app/(site)/checkout/cancel/page.tsx) |
| Comportamento    | Informa che nessun addebito è avvenuto. CTA "Back to Products".                         |

---

### Server action `sendContactMessageAction`

Server action invocata dal form di contatto per inviare un'email tramite Resend.

| Campo           | Valore                                                                                                                                                                                                                                                                                                                  |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                                                                                                                                                                     |
| Codice sorgente | [`src/app/(site)/contact/actions.ts`](../src/app/(site)/contact/actions.ts)                                                                                                                                                                                                                                             |
| Parametri       | `values: ContactValues` — oggetto `{ companyName, email, message }` validato con `contactSchema`. `captchaToken: string` e `honeypot: string` restano fuori dallo schema.                                                                                                                                               |
| Comportamento   | Re-valida i dati, poi: honeypot compilato → successo finto senza invio; rate limit (3 / 10 min per IP, fail-open); verifica Turnstile (fail-closed); invio email via Resend (`from: noreply@example.com`, `to: CONTACT_RECIPIENT_EMAIL`, `replyTo: email del cliente`). Dettaglio in [`docs/anti_bot.md`](anti_bot.md). |
| Variabili env   | `RESEND_API_KEY`, `CONTACT_RECIPIENT_EMAIL`, `TURNSTILE_SECRET_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`                                                                                                                                                                                                             |

---

### Server action `changePasswordAction`

Server action invocata dal form "Change password" nella pagina Settings della dashboard.

| Campo           | Valore                                                                                                                                                                                                                                                                                                   |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                                                                                                                                                                      |
| Codice sorgente | [`src/app/(dashboard)/dashboard/settings/actions.ts`](../src/app/(dashboard)/dashboard/settings/actions.ts)                                                                                                                                                                                              |
| Parametri       | `values: ChangePasswordValues` — `{ currentPassword, newPassword, confirmPassword }` validato con `changePasswordSchema` (`newPassword` min 16 / max 128 caratteri). `captchaToken: string` — token Turnstile, passato alla riautenticazione.                                                            |
| Comportamento   | Verifica auth (`getCurrentCompany`), riautentica l'utente con la password attuale (`signInWithPassword` + `captchaToken`) — errore "Current password is incorrect." se la password non torna, "Verification failed. Please try again." se fallisce il captcha — poi aggiorna la password (`updateUser`). |
| Errori          | `{ success: false, error }` per validazione fallita, captcha rifiutato, password attuale errata, o errore Supabase.                                                                                                                                                                                      |

---

### Redirect firmato verso Frontline (`sso_token`)

Non è un endpoint ricevuto dal sito: è un URL **generato al click** su "Open app" tramite la server action `openProductAppAction`, che allega un JWT firmato (`sso_token`) a `web_app_url`. Documentazione completa (flusso, claim, testing, troubleshooting) in [`docs/sso.md`](sso.md).

| Campo           | Valore                                                                                                                                                |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| Tipo            | Server Action (non ha URL pubblico)                                                                                                                   |
| Codice sorgente | [`src/app/(dashboard)/dashboard/apps/actions.ts`](../src/app/(dashboard)/dashboard/apps/actions.ts) (`openProductAppAction`)                          |
| Parametri       | `productSlug: string`                                                                                                                                 |
| Comportamento   | Verifica login e abbonamento `active` per quello slug, firma il JWT, restituisce `{ success: true, url }`. Il bottone apre l'URL in una nuova scheda. |

---

## 📚 Riferimenti

- **Codice route handler:** [`src/app/(site)/auth/callback/route.ts`](../src/app/(site)/auth/callback/route.ts)
- **Server action di signup:** [`src/app/(site)/auth/signup/actions.ts`](../src/app/(site)/auth/signup/actions.ts)
- **Server action di login:** [`src/app/(site)/auth/login/actions.ts`](../src/app/(site)/auth/login/actions.ts)
- **Server action di logout:** [`src/app/(site)/auth/actions.ts`](../src/app/(site)/auth/actions.ts)
- **Server action checkout:** [`src/app/(site)/products/actions.ts`](../src/app/(site)/products/actions.ts)
- **Server action contatto:** [`src/app/(site)/contact/actions.ts`](../src/app/(site)/contact/actions.ts)
- **Server action cambio password:** [`src/app/(dashboard)/dashboard/settings/actions.ts`](../src/app/(dashboard)/dashboard/settings/actions.ts)
- **SSO verso Frontline:** [`docs/sso.md`](sso.md)
- **Documentazione Supabase:** [`docs/supabase.md`](supabase.md)
