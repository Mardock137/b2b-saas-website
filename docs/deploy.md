# Deploy

Documentazione del processo di deploy del sito Acme Labs su Vercel.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Come funziona](#️-come-funziona)
- [🔧 Configurazione](#-configurazione)
- [⚠️ Note](#️-note)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Il sito è deployato su Vercel, connesso direttamente al repository GitHub. Esistono **due ambienti separati**, ciascuno legato a un branch Git:

- **Staging** → branch `staging`
- **Produzione** → branch `main`

Ogni push su uno dei due branch genera automaticamente un nuovo deploy sull'ambiente corrispondente.

Dettagli:

- **Provider:** Vercel
- **Team:** `<team>`
- **URL staging:** branch `staging` → `<project>-git-staging-<team>.vercel.app`
- **URL produzione:** `<project>.vercel.app` (dominio custom: [example.com](https://example.com))
- **Repository:** `<github-user>/b2b-saas-website` (GitHub)

---

## ⚙️ Come funziona

### Flusso di deploy

```text
Push su branch `staging` → deploy automatico su Staging
                ↓ (merge quando il sito è pronto e approvato)
Push su branch `main`    → deploy automatico su Produzione
```

Il lavoro quotidiano avviene **sempre sul branch `staging`**. Il branch `main` viene aggiornato solo tramite merge da `staging`, quando una modifica è stata testata e approvata.

Il deploy avviene in automatico senza nessuna azione manuale. Se la build fallisce, il deploy precedente rimane attivo e Vercel invia una notifica.

### Ambienti

| Ambiente   | Branch    | URL                                                |
|------------|-----------|----------------------------------------------------|
| Staging    | `staging` | `<project>-git-staging-<team>.vercel.app`          |
| Produzione | `main`    | `<project>.vercel.app` (e in futuro `example.com`) |

Ogni altro branch (es. branch di feature) genera comunque un deploy di Preview con URL temporaneo `<project>-<hash>.vercel.app`.

### Variabili d'ambiente per ambiente

Le variabili d'ambiente vanno configurate separatamente per i due ambienti in Project Settings → Environment Variables:

- **Produzione** (`main`, scope **Production**) → progetto Supabase **`prod`**, chiavi Stripe **live**, `NEXT_PUBLIC_SITE_URL` impostato sul dominio di produzione.
- **Staging** (`staging`, scope **Preview**) → progetto Supabase **`staging`** (condiviso con Frontline), chiavi Stripe **test**, `NEXT_PUBLIC_SITE_URL` impostato sull'URL di staging.

> Il meccanismo è lo stesso già usato per Stripe: la stessa variabile ha valori diversi a seconda dello scope. Le tre variabili Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) puntano quindi a due progetti diversi: `prod` sullo scope Production, `staging` sullo scope Preview. Lo sviluppo locale usa il progetto `staging` tramite il file `.env`. Entrambi i progetti sono condivisi con Frontline: le tabelle del sito vivono nello schema Postgres `website` (vedi [`docs/supabase.md`](supabase.md)), quindi non serve nessuna variabile aggiuntiva per selezionarlo — è il client Supabase del sito a puntarci esplicitamente.

### Collegamento del dominio example.com

Per collegare il dominio custom a Vercel:

1. Aggiungere il dominio su Vercel (Project Settings → Domains)
2. Aggiornare i record DNS su Cloudflare puntando a Vercel
3. Verificare il certificato SSL (automatico tramite Vercel)

---

## 🔧 Configurazione

### Variabili d'ambiente su Vercel

Le variabili d'ambiente sono configurate su Vercel in Project Settings → Environment Variables. Devono corrispondere a quelle del file `.env` locale.

| Variabile                            | Scope Production                     | Scope Preview (staging)       | Note                                                                                               |
|--------------------------------------|--------------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`           | progetto `prod`                      | progetto `staging`            | Valore diverso per scope: due progetti Supabase distinti                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | progetto `prod`                      | progetto `staging`            | Valore diverso per scope                                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`          | progetto `prod`                      | progetto `staging`            | Valore diverso per scope. Chiave segreta, mai esporla                                              |
| `NEXT_PUBLIC_SITE_URL`               | dominio di produzione (obbligatoria) | URL di staging (obbligatoria) | Origin fisso per email e Stripe; controlla anche il noindex. Obbligatoria in Production e Preview. |
| `STRIPE_SECRET_KEY`                  | chiave live                          | chiave test                   | Chiavi test per staging, live per produzione                                                       |
| `STRIPE_WEBHOOK_SECRET`              | segreto endpoint live                | segreto endpoint test         | Segreto endpoint webhook Stripe (diverso tra staging e live)                                       |
| `RESEND_API_KEY`                     | Production + Preview                 | Production + Preview          | Chiave API Resend per l'invio delle email                                                          |
| `CONTACT_RECIPIENT_EMAIL`            | Production + Preview                 | Production + Preview          | Destinatario dei messaggi del form di contatto                                                     |
| `SSO_SHARED_SECRET`                  | Production + Preview                 | Production + Preview          | Segreto per firmare il JWT SSO verso Frontline (`sso_token`, 60s)                                  |

### Deployment Protection (staging)

Lo staging è protetto da **Vercel Authentication** (scope **Standard Protection**), non da un cancello nel codice. Checklist (già eseguita; da ripetere se si rigenera il secret):

1. Vercel → progetto `<project>` → Settings → Deployment Protection: Vercel Authentication **Enabled**, scope **Standard Protection**.
2. Stessa pagina → Protection Bypass for Automation → Add secret (es. `stripe-webhook-staging`). Il valore **non** va nel codice.
3. Stripe Dashboard (modalità Test) → Developers → Webhooks → endpoint di staging: URL `https://<project>-git-staging-<team>.vercel.app/api/stripe/webhook?x-vercel-protection-bypass=<secret>`. Il `whsec_...` non cambia.
4. Se esiste un endpoint Live su `<project>.vercel.app`, stesso query param (Standard Protection copre anche quell'URL). Un endpoint sul dominio custom `example.com` non è protetto.
5. Verifica: "Send test webhook" da Stripe → `200` o `400` (firma), mai `302`/`401`. In incognito, l'URL di staging deve mostrare il login Vercel.

Rigenerare o eliminare il secret su Vercel invalida l'URL registrato su Stripe: va aggiornato di pari passo.

---

## ⚠️ Note

- Tutto lo sviluppo avviene su `staging`: `main` si aggiorna solo tramite merge da `staging`.
- **Vercel Authentication (Deployment Protection) attiva** con Standard Protection. I visitatori non loggati su Vercel vedono il login Vercel. I webhook Stripe di staging passano grazie al Protection Bypass for Automation (`?x-vercel-protection-bypass=<secret>` sull'URL dell'endpoint). Rigenerare o eliminare il secret su Vercel invalida l'URL su Stripe. Il dominio custom di produzione (`example.com`) non è coperto da Standard Protection.

---

## 📚 Riferimenti

- **Configurazione variabili:** [`docs/config.md`](config.md)
- **Vercel Dashboard:** [vercel.com](https://vercel.com)
- **Vercel docs:** [vercel.com/docs](https://vercel.com/docs)
- **Cloudflare (DNS):** [cloudflare.com](https://cloudflare.com)
