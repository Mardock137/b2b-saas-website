# Sicurezza degli accessi

Postura di sicurezza per il controllo degli accessi al sito Acme Labs: quali misure sono attive e quali non sono implementate, con motivazioni e piano di attivazione.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [🛡️ Security header HTTP](#️-security-header-http)
- [🔑 Protezione accesso staging](#-protezione-accesso-staging)
- [🪪 Trust tra sito e Frontline](#-trust-tra-sito-e-frontline)
- [⚙️ Come funziona il geoblocking](#️-come-funziona-il-geoblocking)
- [🔧 Attivazione con Cloudflare](#-attivazione-con-cloudflare)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Il sito limita gli accessi a un insieme ristretto di visitatori (aziende dei paesi autorizzati). Le misure di controllo accessi e il loro stato:

| Misura                                                | Stato                          | Dove                                                                                                                                                    |
|-------------------------------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| Protezione staging (Vercel Authentication)            | ✅ Attivo                      | Vercel → Settings → Deployment Protection (fuori dal codice)                                                                                            |
| Origin fisso da env (anti host-header injection)      | ✅ Attivo                      | `src/lib/http/request-origin.ts` (`NEXT_PUBLIC_SITE_URL`)                                                                                               |
| Trust JWT sito → Frontline                            | ✅ Attivo                      | `src/lib/sso/token.ts` (ingresso monouso con `jti`, `product` verificato, fail-closed) + bottone "Open app". La sessione dopo l'ingresso è su Frontline |
| Geoblocking per paese                                 | ✅ Attivo                      | `src/proxy.ts` + `src/lib/geo/allowed-countries.ts`                                                                                                     |
| Noindex (staging)                                     | ✅ Attivo                      | `src/app/layout.tsx` (pilotato da `NEXT_PUBLIC_SITE_URL`)                                                                                               |
| Security header HTTP                                  | ✅ Attivo (CSP in report-only) | `next.config.ts`                                                                                                                                        |
| Anti-bot (Turnstile + limite sul form contatti)       | ✅ Attivo                      | [`docs/anti_bot.md`](anti_bot.md)                                                                                                                       |
| Verifica tax ID (formato + VIES) e limite signup      | ✅ Attivo                      | `src/lib/tax-id/` + [`docs/anti_bot.md`](anti_bot.md)                                                                                                   |
| Tax ID al checkout e avviso se Stripe non lo verifica | ✅ Attivo                      | [`docs/stripe.md`](stripe.md)                                                                                                                           |
| Blocco Tor                                            | Non implementato               | Richiede Cloudflare davanti a Vercel                                                                                                                    |
| Blocco VPN                                            | Non implementato               | Richiede Cloudflare davanti a Vercel (affidabilità limitata)                                                                                            |

Il geoblocking per paese è documentato in dettaglio in [`wl_and_bl_country.md`](wl_and_bl_country.md). La protezione anti-bot (Turnstile e limite sui messaggi di contatto) è in [`anti_bot.md`](anti_bot.md). Il trust JWT verso Frontline è nella sezione dedicata più sotto. I security header HTTP sono nella sezione successiva. Questo documento copre anche la strategia per Tor e VPN.

---

## 🛡️ Security header HTTP

Applicati a tutte le route da `next.config.ts` (`headers()` con `source: "/:path*"`).

Quattro header sono **enforced** (il browser li rispetta subito). Non hanno una variante report-only e non rompono il sito:

| Header                   | Valore                                     | Perché                                                             |
|--------------------------|--------------------------------------------|--------------------------------------------------------------------|
| `X-Frame-Options`        | `DENY`                                     | Il sito non deve mai finire in un iframe di terzi.                 |
| `X-Content-Type-Options` | `nosniff`                                  | Impedisce al browser di indovinare il MIME type.                   |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`          | Verso siti terzi non parte l'URL completo (query string comprese). |
| `Permissions-Policy`     | `camera=(), microphone=(), geolocation=()` | Il sito non usa queste API: restano spente.                        |

La **Content-Security-Policy** è in modalità **report-only** (`Content-Security-Policy-Report-Only`): il browser segnala le violazioni in console DevTools ma **non blocca** nulla. Scelta voluta: una CSP troppo stretta può rompere script/stili/richieste (Stripe, Supabase, font, hydration Next.js). Si osserva prima, si attiva dopo.

Policy attuale (direttive principali):

- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com` — in sviluppo aggiunge anche `'unsafe-eval'` (HMR di Next.js). `'unsafe-inline'` serve agli script di bootstrap/hydration di Next.js (un sistema di nonce è un miglioramento futuro). L'origine Cloudflare serve allo script del widget Turnstile.
- `style-src 'self' 'unsafe-inline'` — serve all'effetto bagliore di `SpotlightCard` (proprietà CSS impostate da JS).
- `img-src 'self' data:`
- `font-src 'self'` — i font Google (`Space Grotesk`, `DM Sans`) sono scaricati in build da `next/font` e serviti da `/_next/static`.
- `connect-src 'self'` più l'origin di `NEXT_PUBLIC_SUPABASE_URL` (e il corrispondente `wss:` per un eventuale uso client/realtime) e `https://challenges.cloudflare.com` (verifica del widget Turnstile).
- `frame-src https://challenges.cloudflare.com` — l'iframe del widget Turnstile. `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

Non c'è un endpoint `report-uri` / `report-to`: le violazioni si vedono solo in console. L'attivazione enforced (togliere `-Report-Only`) resta **fuori scope** finché non c'è un periodo di osservazione senza violazioni inattese.

---

## 🔑 Protezione accesso staging

### Come funziona la Vercel Authentication

Lo staging non è più protetto da un cancello nel codice: la protezione sta su **Vercel Deployment Protection**, con **Vercel Authentication** attiva e scope **Standard Protection**.

Standard Protection copre tutti gli URL del progetto **tranne** i domini di produzione custom. In pratica:

- `<project>-git-staging-<team>.vercel.app` (branch `staging`) è protetto.
- `<project>.vercel.app` (branch `main`) è protetto: non è un dominio custom.
- Un dominio custom di produzione, come `example.com`, **non** è coperto da Standard Protection. Su quel dominio non c'è nulla da disattivare.

Chi può entrare: i membri del team Vercel, dopo il login Vercel. Per condividere l'accesso con qualcuno che non è nel team si usano i **link condivisibili** di Vercel (Settings → Deployment Protection), non una password nel codice.

La frase vecchia «il piano Vercel free non permette di proteggere il dominio di staging» non è più vera: Vercel Authentication è disponibile su tutti i piani, Hobby compreso.

### Webhook Stripe: Protection Bypass for Automation

Con la protezione accesa, una richiesta senza login Vercel viene fermata (HTTP 302 verso il login). I webhook Stripe non possono fare quel login, quindi l'URL dell'endpoint di test su Stripe include il query param ufficiale:

```text
https://<project>-git-staging-<team>.vercel.app/api/stripe/webhook?x-vercel-protection-bypass=<secret>
```

Il secret si genera nel pannello Vercel (Settings → Deployment Protection → Protection Bypass for Automation). **Non va nel codice né nel repo.** Se si rigenera o si elimina il secret su Vercel, l'URL registrato su Stripe smette di funzionare finché non lo si aggiorna.

La verifica della firma HMAC del webhook (`STRIPE_WEBHOOK_SECRET`) resta identica: il bypass serve solo a superare il login Vercel, non sostituisce il controllo Stripe.

### Dominio custom

Il dominio custom di produzione non è coperto da Standard Protection. L'indicizzazione dipende da `NEXT_PUBLIC_SITE_URL`, sotto.

### Noindex

Se `NEXT_PUBLIC_SITE_URL` non è `https://example.com`, i metadata del layout root includono `robots: { index: false, follow: false }`. L'indicizzazione si riattiva quando `NEXT_PUBLIC_SITE_URL` è `https://example.com`.

---

## 🪪 Trust tra sito e Frontline

Il sito e Frontline sono due applicazioni separate. Il cliente non fa login di nuovo su Frontline: il sito gli passa una prova d'identità firmata al click su "Open app" (pattern **trusted subsystem**, JWT con segreto condiviso `SSO_SHARED_SECRET`). Il token è monouso: porta un `jti` univoco e il claim `product`. Frontline verifica che `product` sia `frontline`, segna il `jti` come usato e, se quel controllo non è disponibile, rifiuta il login (fail-closed).

Quel JWT dura 60 secondi e serve solo a entrare. Subito dopo, Frontline emette una sessione propria di 24 ore, firmata con un segreto che non condivide con questo sito. La salva nel cookie `frontline_session` con `httpOnly`: JavaScript non può leggerlo. Dashboard e documenti non mandano il token dal browser; un proxy di Frontline lo legge lato server e lo allega come `Authorization: Bearer`. La chat pubblica non usa questa sessione.

Documentazione completa (flusso, formato token, configurazione, testing, troubleshooting) in [`docs/sso.md`](sso.md).

---

## ⚙️ Come funziona il geoblocking

### Modello di minaccia: Tor e VPN come scappatoia al geoblocking

Il geoblocking per paese si basa sull'header `x-vercel-ip-country`, che Vercel calcola dalla posizione *fisica* dell'IP del visitatore. Il problema:

- Un nodo di uscita **Tor** o un server **VPN** situato in un paese in whitelist (es. Germania) fa apparire il visitatore come proveniente da quel paese.
- Di conseguenza un utente in un paese in blacklist può instradare il traffico tramite Tor/VPN con uscita in un paese consentito e **aggirare il geoblocking**.

Bloccare Tor e VPN serve esattamente a chiudere questa scappatoia.

### Perché non è implementato

- **Lista volatile**: gli IP dei nodi di uscita Tor cambiano di continuo (centinaia/migliaia al giorno). Mantenerla a mano nel codice è fragile e oneroso.
- **Cloudflare lo fa meglio**: Cloudflare mantiene il rilevamento di Tor (e lo scoring per VPN/proxy) ed espone segnali pronti all'uso, a zero manutenzione per noi.

---

## 🔧 Attivazione con Cloudflare

Da eseguire se il sito viene messo dietro Cloudflare (vedi lo step DNS in [`deploy.md`](deploy.md)).

### Tor

- Cloudflare etichetta il traffico proveniente dalla rete Tor con il codice paese speciale `cf-ipcountry: T1`.
- La **decisione** di bloccare resta nel codice (`src/proxy.ts`), accanto al geoblocking, così la logica è versionata, testabile e con un'unica fonte di verità. A Cloudflare si delega solo il **rilevamento**.
- In pratica: bloccare la richiesta quando il codice paese è `T1`.

### VPN

- Cloudflare offre lo scoring di minaccia e regole gestite per identificare VPN/proxy/anonymizer.
- **Affidabilità limitata**: il rilevamento delle VPN non è preciso e comporta **falsi positivi** (rischio di bloccare clienti legittimi). Va valutato al momento se attivarlo e con quale soglia, accettando consapevolmente il compromesso.

### Nota di interazione critica

Con Cloudflare davanti a Vercel, la fonte del paese del visitatore può spostarsi da `x-vercel-ip-country` (Vercel) a `cf-ipcountry` (Cloudflare). Al momento dell'attivazione va quindi **rivalutato anche il geoblocking per paese già esistente**, per assicurarsi che continui a leggere il paese dalla fonte corretta.

---

## 📚 Riferimenti

- **Deployment Protection (Vercel Authentication):** [vercel.com/docs/deployment-protection](https://vercel.com/docs/deployment-protection)
- **Protection Bypass for Automation:** [vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- **Security header HTTP**: [`next.config.ts`](../next.config.ts)
- **Trust SSO verso Frontline**: [`docs/sso.md`](sso.md)
- **Codice geoblocking**: [`src/proxy.ts`](../src/proxy.ts), [`src/lib/geo/allowed-countries.ts`](../src/lib/geo/allowed-countries.ts)
- **Protezione anti-bot**: [`docs/anti_bot.md`](anti_bot.md)
- **Configurazione variabili**: [`docs/config.md`](config.md)
- **Liste paesi**: [`docs/wl_and_bl_country.md`](wl_and_bl_country.md)
- **Deploy e DNS Cloudflare**: [`docs/deploy.md`](deploy.md)
- **Risorse esterne**:
  - [Cloudflare — Tor support / `T1` country code](https://developers.cloudflare.com/network/onion-routing/)
  - [Cloudflare — WAF managed rules](https://developers.cloudflare.com/waf/managed-rules/)
