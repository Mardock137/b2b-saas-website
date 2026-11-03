# SSO

Documentazione del collegamento SSO (Single Sign-On) tra il sito Acme Labs e le dashboard delle singole app (es. Frontline): come il sito prova l'identità dell'azienda senza far fare un secondo login al cliente.

---

## 📋 Indice

- [📄 Panoramica](#-panoramica)
- [⚙️ Come funziona](#️-come-funziona)
- [🔧 Configurazione](#-configurazione)
- [🧪 Testing](#-testing)
- [🔍 Troubleshooting](#-troubleshooting)
- [📚 Riferimenti](#-riferimenti)

---

## 📄 Panoramica

Il sito e le singole app (es. Frontline) sono applicazioni separate, ospitate su domini/piattaforme diverse. Quando un cliente clicca "Open app" nella pagina My Apps, il sito deve provare all'app di destinazione che l'utente è davvero autenticato e a nome di quale azienda, senza fargli rifare login.

La soluzione adottata è il pattern **trusted subsystem**: le due applicazioni si fidano a vicenda perché condividono un segreto che solo loro conoscono. È lo stesso meccanismo usato da piattaforme come Shopify (apertura delle app embedded), Zendesk e Discourse (JWT SSO) per collegare sistemi che si possiedono entrambi — più semplice ed economico di un OAuth2/OIDC completo, che avrebbe senso solo se un terzo soggetto non fidato fosse coinvolto.

Punti chiave:

- Token **JWT** firmato con **HS256**, tramite un **segreto condiviso** (niente chiavi pubbliche/private).
- Generato **al momento del click**, non al caricamento della pagina — vita brevissima (60 secondi).
- Nessun secondo login sull'app: il token *è* la prova d'identità.
- Se il token non si può generare o firmare, il sito non apre mai un link "a vuoto" senza prova d'identità.

---

## ⚙️ Come funziona

### Flusso

```text
[Cliente autenticato sul sito] → click "Open app" (OpenAppButton, Client Component)
   ▼
[openProductAppAction(productSlug)] (Server Action)
   │  1. getCurrentCompany() — verifica che l'utente sia loggato
   │  2. getSubscriptionsForCompany() — trova la subscription per quello slug
   │     └─ assente o non "active" → { success: false, error }
   │  3. generateSsoToken({ id, company_name }, subscription.product.slug) — firma il JWT
   │  4. buildSsoOpenUrl(web_app_url, token) — appende ?sso_token=<jwt>
   │  5. return { success: true, url }
   ▼
[OpenAppButton naviga l'URL in una nuova scheda]
   ▼
[App: GET /sso/callback?sso_token=...]
   │  verifica firma, iss, aud, scadenza, jti e product
   │  registra il jti (già usato → rifiuto; Redis giù → rifiuto, niente sessione)
   │  → valido e nuovo: apre la dashboard dell'azienda indicata in "sub"
   │  → non valido/scaduto/riusato: pagina di errore con link di ritorno al sito
```

### Perché la scheda si apre prima di conoscere l'URL

`OpenAppButton` apre subito una scheda vuota con `window.open("", "_blank")` **nello stesso gesto di click**, prima ancora di chiamare `openProductAppAction`. Questo perché i browser bloccano `window.open()` se non avviene in risposta diretta a un'interazione utente: se si aspettasse il risultato della server action (che richiede un round-trip di rete) prima di aprire la scheda, il popup verrebbe bloccato nella maggior parte dei browser. Una volta che la server action risponde, la scheda già aperta viene navigata all'URL firmato (`pending.location.href = result.url`) oppure chiusa in caso di errore.

### Perché il token si genera al click e non al caricamento pagina

Prima versione (superata): il token veniva firmato una sola volta al render della pagina My Apps (Server Component) e incollato in un `<a href>` statico. Con una durata di 60 secondi, se il cliente restava sulla pagina più di un minuto prima di cliccare, il link era già scaduto all'arrivo sull'app.

Soluzione: il token si genera **on-demand**, nell'istante esatto del click, tramite una server action — stesso pattern già usato da [`BillingShortcutCard`](../src/components/dashboard/BillingShortcutCard.tsx) per il Customer Portal Stripe.

### Formato del token

| Claim          | Valore                                                           |
|----------------|------------------------------------------------------------------|
| Algoritmo      | `HS256`                                                          |
| `sub`          | ID dell'azienda (`company.id`)                                   |
| `company_name` | Nome azienda, comodo per l'app (evita una query extra)           |
| `jti`          | UUID univoco del token (`crypto.randomUUID()`)                   |
| `product`      | Slug del prodotto (`subscription.product.slug`, es. `frontline`) |
| `iss`          | `"partner-website"`                                              |
| `aud`          | `"support-saas"`                                                 |
| `iat` / `exp`  | Emesso ora, scade dopo **60 secondi**                            |

`iss` e `aud` devono coincidere con i valori attesi dall'app di destinazione.

Il token è monouso. Frontline, dopo aver verificato firma e claim, registra il `jti` e rifiuta un secondo uso con `401`. Se Redis non è raggiungibile o mancano le sue variabili, non apre la sessione (`503`). Accettato il token, Frontline non lo riusa come sessione: ne emette una propria di 24 ore nel cookie `frontline_session` (`httpOnly`). JavaScript non può leggerlo, e il Bearer verso dashboard e documenti lo aggiunge il proxy di Frontline.

### Componenti coinvolti

| Componente                                                                                            | Ruolo                                                                                                                      |
|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| [`src/lib/sso/token.ts`](../src/lib/sso/token.ts)                                                     | `generateSsoToken` (firma il JWT), `buildSsoOpenUrl` (appende `sso_token` all'URL preservando eventuali altri query param) |
| [`src/app/(dashboard)/dashboard/apps/actions.ts`](<../src/app/(dashboard)/dashboard/apps/actions.ts>) | Server action `openProductAppAction`: verifica auth + subscription attiva, genera il token, ritorna l'URL                  |
| [`src/components/dashboard/OpenAppButton.tsx`](../src/components/dashboard/OpenAppButton.tsx)         | Client Component: bottone con stato di caricamento, chiama la action e apre l'URL in una nuova scheda                      |

---

## 🔧 Configurazione

Un'unica variabile d'ambiente, il segreto condiviso con l'app:

```env
SSO_SHARED_SECRET=un-segreto-lungo-e-casuale
```

- **Deve essere identico** su questo sito e su ogni app che lo riceve (es. Frontline).
- Mai esposto al browser: la firma avviene solo lato server.
- Vedi anche [`docs/config.md`](config.md).

---

## 🧪 Testing

### Test automatici

```bash
npm test -- sso-token open-product-app-action
```

- `tests/sso-token.test.ts`: `generateSsoToken`/`buildSsoOpenUrl` — claim corretti (`jti` UUID univoco, `product` uguale allo slug), scadenza 60s, firma valida/non valida, errore se manca `SSO_SHARED_SECRET`.
- `tests/open-product-app-action.test.ts`: `openProductAppAction` — utente non autenticato, subscription assente/non attiva, successo, errore di firma.

### Test manuale del link generato

1. Assicurarsi che `.env` locale abbia `SSO_SHARED_SECRET` impostato (qualsiasi valore, non serve ancora coincidere con quello dell'app per questo test).
2. `npm run dev` e aprire [http://localhost:3000](http://localhost:3000).
3. Avere un'azienda di test con un abbonamento **attivo** a un'app (via Stripe Checkout in test mode — carta `4242 4242 4242 4242` — con la Stripe CLI attiva per ricevere il webhook: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
4. Andare su `/dashboard/apps`, cliccare "Open app".
5. Verificare che si apra una nuova scheda con URL che termina in `?sso_token=<jwt>` (tre parti separate da punti).
6. Opzionale: incollare il token su [jwt.io](https://jwt.io) (non serve il secret per vedere il payload) e controllare `sub`, `company_name`, `jti` (UUID), `product` (slug), `iss`, `aud`, `exp` = `iat` + 60.

### Test end-to-end incrociato

Richiede coordinamento con chi lavora sull'app di destinazione:

- Stesso valore di `SSO_SHARED_SECRET` su entrambi i lati (locale o staging).
- Un'azienda di test con lo stesso `company_id` in entrambi i database.
- L'app raggiungibile all'URL configurato in `products.web_app_url`.

Poi: click reale su "Open app" dal sito → verifica che l'app apra la dashboard dell'azienda corretta.

---

## 🔍 Troubleshooting

### Problema: il bottone "Open app" resta disabilitato o mostra un errore

**Causa**: `SSO_SHARED_SECRET` assente/vuota, oppure `web_app_url` del prodotto non è un URL valido.

**Soluzione**: controllare che la variabile sia impostata nell'ambiente corretto (locale `.env` o scope Vercel). La action non genera mai un link senza prova d'identità: è un comportamento voluto, non un bug.

### Problema: l'app rifiuta il token come scaduto

**Causa**: il token dura solo 60 secondi; se il click e la verifica lato app sono troppo distanti nel tempo (rete lenta, redirect intermedi), può scadere.

**Soluzione**: il token si genera già al click (non al caricamento pagina), quindi il margine è minimo. Se il problema persiste, verificare con chi gestisce l'app che la leeway di verifica (5-10 secondi consigliati) sia configurata.

### Problema: firma rifiutata dall'app anche con token non scaduto

**Causa**: `SSO_SHARED_SECRET` diverso tra i due lati.

**Soluzione**: risincronizzare il valore della variabile su entrambi gli ambienti (stesso valore esatto, incluso su staging vs produzione se separati).

### Problema: Frontline rifiuta il token

**Causa**: il token è già stato usato, oppure mancano `jti` o `product`. Il tasto Indietro del browser sulla pagina di callback rimanda lo stesso indirizzo e produce un `401`: è normale, perché quel token è già stato consumato. Un Frontline aggiornato rifiuta anche i token emessi da un sito che non include ancora quei claim.

**Soluzione**: aprire di nuovo l'app dal sito, così viene firmato un token nuovo. Il sito va aggiornato prima di Frontline.

---

## 📚 Riferimenti

- **Codice firma token:** [`src/lib/sso/token.ts`](../src/lib/sso/token.ts)
- **Server action:** [`src/app/(dashboard)/dashboard/apps/actions.ts`](<../src/app/(dashboard)/dashboard/apps/actions.ts>)
- **UI:** [`src/components/dashboard/OpenAppButton.tsx`](../src/components/dashboard/OpenAppButton.tsx)
- **Test:** [`tests/sso-token.test.ts`](../tests/sso-token.test.ts), [`tests/open-product-app-action.test.ts`](../tests/open-product-app-action.test.ts)
- **Endpoint API:** [`docs/api_endpoints.md`](api_endpoints.md)
- **Sicurezza degli accessi:** [`docs/security.md`](security.md)
- **Variabili d'ambiente:** [`docs/config.md`](config.md)
- **Stripe (per creare abbonamenti di test):** [`docs/stripe.md`](stripe.md)
