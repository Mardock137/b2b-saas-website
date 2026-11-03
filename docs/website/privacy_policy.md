# Privacy Policy

**Last updated / Ultimo aggiornamento:** November 1, 2026

Testo di esempio. Questa pagina è un modello e non descrive un'azienda o un servizio reali.

Sample text. This page is a template and does not describe a real company or service.

---

## Informativa sulla Privacy (ITA)

### 1. Chi siamo

**Acme Labs, Inc.** ("Acme Labs", "noi", "nostro") è una società con numero di registrazione 00-0000000, che gestisce il sito web **example.com** e fornisce software aziendale ("App") tramite abbonamento B2B.

Per qualsiasi questione relativa alla privacy puoi contattarci a:

**Email:** <support@example.com>

Acme Labs è il **titolare del trattamento** dei dati personali descritti in questa informativa, ovvero stabiliamo come e perché i tuoi dati vengono trattati.

### 2. Ambito di applicazione

Questa informativa si applica ai dati personali che raccogliamo quando:

- Visiti **example.com**
- Crei un account e registri la tua azienda
- Acquisti o gestisci un abbonamento
- Usi la dashboard cliente
- Ci contatti tramite il modulo di contatto

Questa informativa **non** copre i dati personali trattati per conto dei nostri clienti all'interno dei servizi App stessi (es. i dati trattati da Frontline per conto della tua azienda).

### 3. Quali dati raccogliamo e perché

#### 3.1 Registrazione dell'account

Quando crei un account, raccogliamo:

| Dato                                 | Finalità                                                                                                                                                                                                                                           | Base giuridica                               |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| Nome azienda                         | Identificare la tua organizzazione                                                                                                                                                                                                                 | Esecuzione del contratto (Art. 6(1)(b) GDPR) |
| Email aziendale                      | Autenticazione, comunicazioni di servizio                                                                                                                                                                                                          | Esecuzione del contratto (Art. 6(1)(b) GDPR) |
| Codice fiscale / Partita IVA e paese | Verifica identità aziendale, fatturazione, obblighi di legge. Per i numeri IVA dell'UE il numero viene controllato sul servizio VIES della Commissione Europea. Salviamo solo l'esito del controllo, non il nome o l'indirizzo restituiti da VIES. | Obbligo legale (Art. 6(1)(c) GDPR)           |
| Password (con hash)                  | Sicurezza dell'account — mai salvata in chiaro                                                                                                                                                                                                     | Esecuzione del contratto (Art. 6(1)(b) GDPR) |

Accettiamo solo **email aziendali**. I domini email personali (es. gmail.com, yahoo.com) sono bloccati in fase di registrazione.

Per le partite IVA dei paesi dell'Unione Europea (e per i numeri dell'Irlanda del Nord, prefisso `XI`) inviamo il numero al servizio **VIES** della Commissione Europea, al solo scopo di verificare che risulti registrato. Non conserviamo il nome o l'indirizzo che VIES può restituire. La base giuridica è la stessa del tax ID: obbligo legale (Art. 6(1)(c) GDPR). VIES è un servizio pubblico dell'Unione, con sede nel SEE.

#### 3.2 Abbonamento e fatturazione

Quando acquisti un abbonamento:

| Dato                                    | Finalità                                                        | Base giuridica                               |
|-----------------------------------------|-----------------------------------------------------------------|----------------------------------------------|
| Stripe Customer ID                      | Collegare il tuo account al profilo di fatturazione Stripe      | Esecuzione del contratto (Art. 6(1)(b) GDPR) |
| Stato abbonamento e prodotti acquistati | Garantire l'accesso ai servizi acquistati, gestire la dashboard | Esecuzione del contratto (Art. 6(1)(b) GDPR) |

**Non** memorizziamo alcun dato delle carte di pagamento. Tutte le informazioni di pagamento sono raccolte e trattate direttamente da **Stripe**. Noi conserviamo solo un ID di riferimento. Al checkout Stripe chiede anche un tax ID aziendale, quando lo supporta per il paese del cliente, e lo conserva sul cliente Stripe.

#### 3.3 Modulo di contatto

Quando invii un messaggio tramite il modulo di contatto, raccogliamo:

| Dato                    | Finalità                      | Base giuridica                          |
|-------------------------|-------------------------------|-----------------------------------------|
| Nome azienda            | Identificare il mittente      | Legittimo interesse (Art. 6(1)(f) GDPR) |
| Indirizzo email         | Rispondere al tuo messaggio   | Legittimo interesse (Art. 6(1)(f) GDPR) |
| Contenuto del messaggio | Rispondere alla tua richiesta | Legittimo interesse (Art. 6(1)(f) GDPR) |

#### 3.4 Indirizzo IP e posizione geografica

Quando visiti example.com, trattiamo il tuo indirizzo IP esclusivamente per determinare il tuo paese di provenienza. Questo è necessario per applicare le nostre **restrizioni geografiche di accesso**: il servizio è disponibile solo in un insieme definito di paesi. I visitatori provenienti da paesi non autorizzati vengono reindirizzati a una pagina di blocco e nessun dato di account viene raccolto da loro.

| Dato                        | Finalità                                      | Base giuridica                          |
|-----------------------------|-----------------------------------------------|-----------------------------------------|
| Indirizzo IP / codice paese | Controllo geografico di accesso (geoblocking) | Legittimo interesse (Art. 6(1)(f) GDPR) |

Questo controllo del paese è effettuato in tempo reale dalla nostra infrastruttura di hosting e non viene salvato nel nostro database.

#### 3.5 Dati di sessione e cookie

Usiamo **cookie di sessione** strettamente necessari per l'autenticazione. Questi cookie sono impostati dalla nostra infrastruttura di autenticazione (Supabase) e servono a mantenerti connesso. Non usiamo cookie pubblicitari, pixel di tracciamento o script di analisi di alcun tipo.

| Cookie                                      | Finalità                                                                            | Durata                                        |
|---------------------------------------------|-------------------------------------------------------------------------------------|-----------------------------------------------|
| Cookie di sessione Supabase                 | Mantenere la sessione autenticata                                                   | Fino al logout o alla scadenza della sessione |
| `sidebar_collapsed`                         | Ricordare se la barra laterale della dashboard è collassata (nessun dato personale) | 1 anno                                        |

Poiché questi cookie sono strettamente necessari al funzionamento del servizio, non richiediamo un banner di consenso separato per essi.

### 4. Per quanto tempo conserviamo i dati

| Categoria di dati                                  | Periodo di conservazione                                            |
|----------------------------------------------------|---------------------------------------------------------------------|
| Dati account (nome azienda, email, codice fiscale) | Fino alla richiesta di cancellazione, o 3 anni dall'ultima attività |
| Dati abbonamento                                   | 7 anni dalla fine dell'abbonamento (obbligo fiscale e legale)       |
| Messaggi del modulo di contatto                    | 2 anni dalla ricezione                                              |
| Indirizzo IP / codice paese (geoblocking)          | Non conservato — trattato solo in tempo reale                       |
| Cookie di sessione                                 | Fino al logout o alla scadenza naturale                             |

### 5. Con chi condividiamo i tuoi dati

Non vendiamo, affittiamo o scambiamo i tuoi dati personali. Li condividiamo solo con i seguenti **sub-responsabili del trattamento**, che forniscono l'infrastruttura tecnica su cui si basa il servizio:

| Sub-responsabile   | Ruolo                                  | Sede     | Garanzia GDPR                        |
|--------------------|----------------------------------------|----------|--------------------------------------|
| **Supabase, Inc.** | Database e autenticazione              | USA / UE | Clausole Contrattuali Standard (SCC) |
| **Stripe, Inc.**   | Elaborazione pagamenti e fatturazione  | USA / UE | Clausole Contrattuali Standard (SCC) |
| **Resend, Inc.**   | Invio email transazionali              | USA      | Clausole Contrattuali Standard (SCC) |
| **Vercel, Inc.**   | Hosting del sito e infrastruttura edge | USA / UE | Clausole Contrattuali Standard (SCC) |

Ciascuno di questi fornitori è vincolato da accordi sul trattamento dei dati conformi al GDPR. I trasferimenti di dati al di fuori dello Spazio Economico Europeo (SEE) sono protetti dalle Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea.

Potremmo inoltre divulgare dati personali se richiesto dalla legge applicabile, da un ordine del tribunale o da un'autorità governativa.

### 6. Trasferimenti internazionali di dati

La nostra infrastruttura è situata, dove possibile, all'interno del SEE. Tuttavia, alcuni sub-responsabili (Supabase, Stripe, Resend, Vercel) hanno sede negli Stati Uniti. Tutti i trasferimenti verso questi fornitori avvengono in base alle Clausole Contrattuali Standard (SCC), come richiesto dal Capo V del GDPR.

### 7. I tuoi diritti secondo il GDPR

In qualità di interessato ai sensi del GDPR, hai i seguenti diritti:

- **Diritto di accesso** — Richiedere una copia dei dati personali che deteniamo su di te.
- **Diritto di rettifica** — Chiederci di correggere dati inesatti o incompleti.
- **Diritto alla cancellazione** — Chiederci di cancellare i tuoi dati ("diritto all'oblio"), fatti salvi i nostri obblighi legali di conservazione.
- **Diritto di limitazione** — Chiederci di sospendere temporaneamente il trattamento mentre una richiesta è in fase di risoluzione.
- **Diritto alla portabilità** — Ricevere i tuoi dati in un formato strutturato e leggibile da dispositivo automatico.
- **Diritto di opposizione** — Opporti al trattamento basato sul legittimo interesse.

Per esercitare uno qualsiasi di questi diritti, invia una richiesta a **<support@example.com>**. Risponderemo entro **un mese di calendario** dalla ricezione della richiesta, come previsto dall'Art. 12 del GDPR.

#### 7.1 Diritto di reclamo

Se ritieni che abbiamo trattato i tuoi dati in modo illecito, hai il diritto di presentare reclamo all'autorità di controllo competente del tuo paese di residenza all'interno del SEE.

### 8. Sicurezza dei dati

Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati personali, tra cui:

- Password salvate esclusivamente come valori con hash (mai in chiaro)
- Crittografia HTTPS per tutti i dati in transito
- Controlli di accesso basati sui ruoli sul database (Supabase Row Level Security)
- Chiavi service-role mai esposte al browser
- Cookie firmati e HTTP-only per la gestione delle sessioni

### 9. Minori

Il nostro servizio è destinato esclusivamente ad aziende registrate. Non raccogliamo consapevolmente dati personali di persone di età inferiore ai 18 anni. Se ritieni che un minore abbia inviato dati tramite la nostra piattaforma, contattaci a <support@example.com> e li cancelleremo immediatamente.

### 10. Modifiche a questa informativa

Ci riserviamo il diritto di aggiornare questa informativa sulla privacy in qualsiasi momento. Quando lo faremo, aggiorneremo la data di "Ultimo aggiornamento" in cima alla pagina. L'uso continuato del servizio dopo la pubblicazione dell'informativa aggiornata costituisce accettazione delle modifiche. Per modifiche sostanziali, informeremo gli utenti registrati via email.

### 11. Contatti

Per qualsiasi domanda, richiesta o dubbio relativo a questa informativa sulla privacy o al trattamento dei tuoi dati personali:

**Acme Labs, Inc.**
123 Example Street, Suite 100, Springfield, 00000, United States
**Email:** <support@example.com>
**Sito web:** [example.com](https://example.com)

---

## Privacy Policy (ENG)

### 1. Who We Are

**Acme Labs, Inc.** ("Acme Labs", "we", "us", or "our") is a company with registration number 00-0000000, operating the website **example.com** and providing business software ("Apps") on a B2B subscription basis.

For any privacy-related matter, you can contact us at:

**Email:** <support@example.com>

We are the **data controller** for the personal data described in this policy, meaning we determine how and why your data is processed.

### 2. Scope of This Policy

This policy applies to personal data we collect when you:

- Visit **example.com**
- Create an account and register your company
- Purchase or manage a subscription
- Use the customer dashboard
- Contact us via the contact form

This policy does **not** cover personal data processed on behalf of our customers within the App services themselves (e.g., data processed by Frontline on behalf of your company).

### 3. What Data We Collect and Why

#### 3.1 Account Registration

When you create an account, we collect:

| Data                                      | Purpose                                                                                                                                                                                                 | Legal Basis                              |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| Company name                              | Identify your organisation                                                                                                                                                                              | Contract performance (Art. 6(1)(b) GDPR) |
| Business email address                    | Authentication, service communications                                                                                                                                                                  | Contract performance (Art. 6(1)(b) GDPR) |
| Tax ID / VAT number and country           | Verify business identity, invoicing, legal compliance. EU VAT numbers are checked with the European Commission's VIES service. We store the check result only, not the name or address VIES may return. | Legal obligation (Art. 6(1)(c) GDPR)     |
| Password (hashed)                         | Account security — never stored in plain text                                                                                                                                                           | Contract performance (Art. 6(1)(b) GDPR) |

We only accept **business email addresses**. Personal email domains (e.g., gmail.com, yahoo.com) are blocked at registration.

For VAT numbers of European Union countries (and Northern Ireland numbers with the `XI` prefix) we send the number to the European Commission's **VIES** service, only to check that it is registered. We do not keep the name or address VIES may return. The legal basis is the same as for the tax ID: legal obligation (Art. 6(1)(c) GDPR). VIES is a public EU service, located in the EEA.

#### 3.2 Subscription and Billing

When you purchase a subscription:

| Data                                         | Purpose                                                   | Legal Basis                              |
|----------------------------------------------|-----------------------------------------------------------|------------------------------------------|
| Stripe Customer ID                           | Link your account to your Stripe billing profile          | Contract performance (Art. 6(1)(b) GDPR) |
| Subscription status and product(s) purchased | Grant access to purchased services, manage your dashboard | Contract performance (Art. 6(1)(b) GDPR) |

We do **not** store any payment card data. All payment information is collected and processed directly by **Stripe**. We only store a reference ID. At checkout, Stripe also asks for a business tax ID when it supports one for the customer's country, and stores that number on the Stripe customer.

#### 3.3 Contact Form

When you submit a message via our contact form, we collect:

| Data            | Purpose                 | Legal Basis                             |
|-----------------|-------------------------|-----------------------------------------|
| Company name    | Identify the sender     | Legitimate interest (Art. 6(1)(f) GDPR) |
| Email address   | Reply to your message   | Legitimate interest (Art. 6(1)(f) GDPR) |
| Message content | Respond to your enquiry | Legitimate interest (Art. 6(1)(f) GDPR) |

#### 3.4 IP Address and Geographic Location

When you visit example.com, we process your IP address solely to determine your country of origin. This is required to enforce our **geographic access restrictions**: the service is available only in a defined set of countries. Visitors from non-authorised countries are redirected to a blocked-access page and no account data is collected from them.

| Data                      | Purpose                                 | Legal Basis                             |
|---------------------------|-----------------------------------------|-----------------------------------------|
| IP address / country code | Geographic access control (geoblocking) | Legitimate interest (Art. 6(1)(f) GDPR) |

This country check is performed in real time by our hosting infrastructure and is not stored in our database.

#### 3.5 Session Data and Cookies

We use **session cookies** strictly necessary for authentication. These cookies are set by our authentication infrastructure (Supabase) and are required to keep you logged in. We do not use advertising cookies, tracking pixels, or analytics scripts of any kind.

| Cookie                                      | Purpose                                                                | Duration                       |
|---------------------------------------------|------------------------------------------------------------------------|--------------------------------|
| Supabase auth session cookie                | Maintain your authenticated session                                    | Until logout or session expiry |
| `sidebar_collapsed`                         | Remember whether the dashboard sidebar is collapsed (no personal data) | 1 year                         |

Because these cookies are strictly necessary for the service to function, we do not require a separate cookie consent banner for them.

### 4. How Long We Keep Your Data

| Data category                                 | Retention period                                                    |
|-----------------------------------------------|---------------------------------------------------------------------|
| Account data (company name, email, Tax ID)    | Until you request account deletion, or 3 years after last activity  |
| Subscription records                          | 7 years from the end of the subscription (tax and legal obligation) |
| Contact form messages                         | 2 years from receipt                                                |
| IP address / country code (geoblocking check) | Not stored persistently — processed in real time only               |
| Session cookies                               | Until logout or natural expiry                                      |

### 5. Who We Share Your Data With

We do not sell, rent, or trade your personal data. We share it only with the following **sub-processors**, who provide the technical infrastructure we rely on to operate the service:

| Sub-processor      | Role                                    | Location | GDPR safeguard                      |
|--------------------|-----------------------------------------|----------|-------------------------------------|
| **Supabase, Inc.** | Database and authentication             | USA / EU | Standard Contractual Clauses (SCCs) |
| **Stripe, Inc.**   | Payment processing and billing          | USA / EU | Standard Contractual Clauses (SCCs) |
| **Resend, Inc.**   | Transactional email delivery            | USA      | Standard Contractual Clauses (SCCs) |
| **Vercel, Inc.**   | Website hosting and edge infrastructure | USA / EU | Standard Contractual Clauses (SCCs) |

Each of these providers is bound by GDPR-compliant data processing agreements. Transfers of data outside the European Economic Area (EEA) are protected by Standard Contractual Clauses (SCCs) approved by the European Commission.

We may also disclose personal data if required to do so by applicable law, court order, or governmental authority.

### 6. International Data Transfers

Our service infrastructure is primarily located within the EEA where possible. However, some sub-processors (Supabase, Stripe, Resend, Vercel) are headquartered in the United States. All transfers to these providers are made under Standard Contractual Clauses (SCCs), as required by GDPR Chapter V.

### 7. Your Rights Under GDPR

As a data subject under GDPR, you have the following rights:

- **Right of access** — Request a copy of the personal data we hold about you.
- **Right to rectification** — Ask us to correct inaccurate or incomplete data.
- **Right to erasure** — Ask us to delete your data ("right to be forgotten"), subject to our legal retention obligations.
- **Right to restriction** — Ask us to temporarily stop processing your data while a request is being resolved.
- **Right to data portability** — Receive your data in a structured, machine-readable format.
- **Right to object** — Object to processing based on legitimate interest.

To exercise any of these rights, send a request to **<support@example.com>**. We will respond within **one calendar month** of receiving your request, as required by GDPR Article 12.

#### 7.1 Right to Lodge a Complaint

If you believe we have processed your data unlawfully, you have the right to lodge a complaint with the competent supervisory authority of your country of residence within the EEA.

### 8. Data Security

We implement appropriate technical and organisational measures to protect your personal data, including:

- Passwords stored exclusively as hashed values (never in plain text)
- HTTPS encryption for all data in transit
- Role-based access controls on our database (Supabase Row Level Security)
- Service-role keys never exposed to the browser
- HTTP-only, signed cookies for session management

### 9. Children

Our service is exclusively intended for registered businesses. We do not knowingly collect personal data from individuals under the age of 18. If you believe a minor has submitted data through our platform, please contact us at <support@example.com> and we will delete it immediately.

### 10. Changes to This Policy

We reserve the right to update this Privacy Policy at any time. When we do, we will update the "Last updated" date at the top of this page. Continued use of the service after the updated policy is published constitutes acceptance of the changes. For material changes, we will notify registered users by email.

### 11. Contact

For any question, request, or concern regarding this Privacy Policy or the processing of your personal data:

**Acme Labs, Inc.**
123 Example Street, Suite 100, Springfield, 00000, United States
**Email:** <support@example.com>
**Website:** [example.com](https://example.com)
