import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Acme Labs",
  description:
    "How Acme Labs, Inc. collects, uses, and protects your personal data in compliance with GDPR.",
};

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-border/50">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-3 align-top text-sm leading-relaxed text-muted-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <header className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mx-auto mt-6 max-w-2xl rounded-md border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          Sample text. This page is a template and does not describe a real
          company or service.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: November 1, 2026
        </p>
      </header>

      <div className="mt-16 space-y-12">
        {/* 1. Who We Are */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">1.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Who We Are
            </h2>
          </div>
          <div className="ml-7 mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              <strong className="text-foreground">Acme Labs, Inc.</strong> (“Acme Labs”,
              “we”, “us”, or “our”) is a company with registration number
              00-0000000, operating the website{" "}
              <strong className="text-foreground">example.com</strong> and
              providing business software (“Apps”) on a B2B subscription basis.
            </p>
            <p>
              For any privacy-related matter, you can contact us at:{" "}
              <a href="mailto:support@example.com" className="text-primary underline-offset-2 hover:underline">support@example.com</a>
            </p>
            <p>
              We are the{" "}
              <strong className="text-foreground">data controller</strong> for
              the personal data described in this policy, meaning we determine
              how and why your data is processed.
            </p>
          </div>
        </section>

        {/* 2. Scope */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">2.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Scope of This Policy
            </h2>
          </div>
          <div className="ml-7 mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              This policy applies to personal data we collect when you:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-primary">
              <li>
                Visit <strong className="text-foreground">example.com</strong>
              </li>
              <li>Create an account and register your company</li>
              <li>Purchase or manage a subscription</li>
              <li>Use the customer dashboard</li>
              <li>Contact us via the contact form</li>
            </ul>
            <p>
              This policy does{" "}
              <strong className="text-foreground">not</strong> cover personal
              data processed on behalf of our customers within the App
              services themselves (e.g., data processed by Frontline on
              behalf of your company).
            </p>
          </div>
        </section>

        {/* 3. What Data We Collect */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">3.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              What Data We Collect and Why
            </h2>
          </div>

          <div className="ml-7 mt-6 space-y-10">
            {/* 3.1 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                3.1 Account Registration
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                When you create an account, we collect:
              </p>
              <DataTable
                headers={["Data", "Purpose", "Legal Basis"]}
                rows={[
                  [
                    "Company name",
                    "Identify your organisation",
                    "Contract performance (Art. 6(1)(b) GDPR)",
                  ],
                  [
                    "Business email address",
                    "Authentication, service communications",
                    "Contract performance (Art. 6(1)(b) GDPR)",
                  ],
                  [
                    "Tax ID / VAT number and country",
                    "Verify business identity, invoicing, legal compliance. EU VAT numbers are checked with the European Commission's VIES service. We store the check result only, not the name or address VIES may return.",
                    "Legal obligation (Art. 6(1)(c) GDPR)",
                  ],
                  [
                    "Password (hashed)",
                    "Account security — never stored in plain text",
                    "Contract performance (Art. 6(1)(b) GDPR)",
                  ],
                ]}
              />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                We only accept{" "}
                <strong className="text-foreground">business email addresses</strong>.
                Personal email domains (e.g., gmail.com, yahoo.com) are blocked
                at registration.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                For VAT numbers of European Union countries (and Northern Ireland
                numbers with the XI prefix) we send the number to the European
                Commission&apos;s VIES service, only to check that it is registered.
                We do not keep the name or address VIES may return. The legal basis
                is the same as for the tax ID: legal obligation (Art. 6(1)(c) GDPR).
                VIES is a public EU service, located in the EEA.
              </p>
            </div>

            {/* 3.2 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                3.2 Subscription and Billing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                When you purchase a subscription:
              </p>
              <DataTable
                headers={["Data", "Purpose", "Legal Basis"]}
                rows={[
                  [
                    "Stripe Customer ID",
                    "Link your account to your Stripe billing profile",
                    "Contract performance (Art. 6(1)(b) GDPR)",
                  ],
                  [
                    "Subscription status and product(s) purchased",
                    "Grant access to purchased services, manage your dashboard",
                    "Contract performance (Art. 6(1)(b) GDPR)",
                  ],
                ]}
              />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                We do <strong className="text-foreground">not</strong> store any
                payment card data. All payment information is collected and
                processed directly by{" "}
                <strong className="text-foreground">Stripe</strong>. We only
                store a reference ID. At checkout, Stripe also asks for a business
                tax ID when it supports one for the customer&apos;s country, and
                stores that number on the Stripe customer.
              </p>
            </div>

            {/* 3.3 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                3.3 Contact Form
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                When you submit a message via our contact form, we collect:
              </p>
              <DataTable
                headers={["Data", "Purpose", "Legal Basis"]}
                rows={[
                  [
                    "Company name",
                    "Identify the sender",
                    "Legitimate interest (Art. 6(1)(f) GDPR)",
                  ],
                  [
                    "Email address",
                    "Reply to your message",
                    "Legitimate interest (Art. 6(1)(f) GDPR)",
                  ],
                  [
                    "Message content",
                    "Respond to your enquiry",
                    "Legitimate interest (Art. 6(1)(f) GDPR)",
                  ],
                ]}
              />
            </div>

            {/* 3.4 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                3.4 IP Address and Geographic Location
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                When you visit example.com, we process your IP address solely to
                determine your country of origin. This is required to enforce our{" "}
                <strong className="text-foreground">
                  geographic access restrictions
                </strong>
                : the service is available only in a defined set of countries.
                Visitors from non-authorised countries are redirected to a
                blocked-access page and no account data is collected from them.
              </p>
              <DataTable
                headers={["Data", "Purpose", "Legal Basis"]}
                rows={[
                  [
                    "IP address / country code",
                    "Geographic access control (geoblocking)",
                    "Legitimate interest (Art. 6(1)(f) GDPR)",
                  ],
                ]}
              />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                This country check is performed in real time by our hosting
                infrastructure and is not stored in our database.
              </p>
            </div>

            {/* 3.5 */}
            <div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                3.5 Session Data and Cookies
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                We use{" "}
                <strong className="text-foreground">session cookies</strong>{" "}
                strictly necessary for authentication. These cookies are set by
                our authentication infrastructure (Supabase) and are required to
                keep you logged in. We do not use advertising cookies, tracking
                pixels, or analytics scripts of any kind.
              </p>
              <DataTable
                headers={["Cookie", "Purpose", "Duration"]}
                rows={[
                  [
                    "Supabase auth session cookie",
                    "Maintain your authenticated session",
                    "Until logout or session expiry",
                  ],
                  [
                    <code
                      key="sidebar"
                      className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground"
                    >
                      sidebar_collapsed
                    </code>,
                    "Remember whether the dashboard sidebar is collapsed (no personal data)",
                    "1 year",
                  ],
                ]}
              />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Because these cookies are strictly necessary for the service to
                function, we do not require a separate cookie consent banner for
                them.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Retention */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">4.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              How Long We Keep Your Data
            </h2>
          </div>
          <div className="ml-7 mt-4">
            <DataTable
              headers={["Data category", "Retention period"]}
              rows={[
                [
                  "Account data (company name, email, Tax ID)",
                  "Until you request account deletion, or 3 years after last activity",
                ],
                [
                  "Subscription records",
                  "7 years from the end of the subscription (tax and legal obligation)",
                ],
                ["Contact form messages", "2 years from receipt"],
                [
                  "IP address / country code (geoblocking check)",
                  "Not stored persistently — processed in real time only",
                ],
                ["Session cookies", "Until logout or natural expiry"],
              ]}
            />
          </div>
        </section>

        {/* 5. Who We Share */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">5.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Who We Share Your Data With
            </h2>
          </div>
          <div className="ml-7 mt-3 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              We do not sell, rent, or trade your personal data. We share it only
              with the following{" "}
              <strong className="text-foreground">sub-processors</strong>, who
              provide the technical infrastructure we rely on to operate the
              service:
            </p>
            <DataTable
              headers={["Sub-processor", "Role", "Location", "GDPR safeguard"]}
              rows={[
                [
                  <strong key="sb" className="text-foreground">
                    Supabase, Inc.
                  </strong>,
                  "Database and authentication",
                  "USA / EU",
                  "Standard Contractual Clauses (SCCs)",
                ],
                [
                  <strong key="st" className="text-foreground">
                    Stripe, Inc.
                  </strong>,
                  "Payment processing and billing",
                  "USA / EU",
                  "Standard Contractual Clauses (SCCs)",
                ],
                [
                  <strong key="rs" className="text-foreground">
                    Resend, Inc.
                  </strong>,
                  "Transactional email delivery",
                  "USA",
                  "Standard Contractual Clauses (SCCs)",
                ],
                [
                  <strong key="vc" className="text-foreground">
                    Vercel, Inc.
                  </strong>,
                  "Website hosting and edge infrastructure",
                  "USA / EU",
                  "Standard Contractual Clauses (SCCs)",
                ],
              ]}
            />
            <p>
              Each of these providers is bound by GDPR-compliant data processing
              agreements. Transfers of data outside the European Economic Area
              (EEA) are protected by Standard Contractual Clauses (SCCs)
              approved by the European Commission.
            </p>
            <p>
              We may also disclose personal data if required to do so by
              applicable law, court order, or governmental authority.
            </p>
          </div>
        </section>

        {/* 6. International Transfers */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">6.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              International Data Transfers
            </h2>
          </div>
          <p className="ml-7 mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Our service infrastructure is primarily located within the EEA where
            possible. However, some sub-processors (Supabase, Stripe, Resend,
            Vercel) are headquartered in the United States. All transfers to
            these providers are made under Standard Contractual Clauses (SCCs),
            as required by GDPR Chapter V.
          </p>
        </section>

        {/* 7. Your Rights */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">7.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Your Rights Under GDPR
            </h2>
          </div>
          <div className="ml-7 mt-3 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              As a data subject under GDPR, you have the following rights:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-primary">
              <li>
                <strong className="text-foreground">Right of access</strong> —
                Request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to rectification
                </strong>{" "}
                — Ask us to correct inaccurate or incomplete data.
              </li>
              <li>
                <strong className="text-foreground">Right to erasure</strong> —
                Ask us to delete your data (“right to be forgotten”), subject to
                our legal retention obligations.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to restriction
                </strong>{" "}
                — Ask us to temporarily stop processing your data while a
                request is being resolved.
              </li>
              <li>
                <strong className="text-foreground">
                  Right to data portability
                </strong>{" "}
                — Receive your data in a structured, machine-readable format.
              </li>
              <li>
                <strong className="text-foreground">Right to object</strong> —
                Object to processing based on legitimate interest.
              </li>
            </ul>
            <p>
              To exercise any of these rights, send a request to{" "}
              <a href="mailto:support@example.com" className="text-primary underline-offset-2 hover:underline">support@example.com</a>.
              We will respond within{" "}
              <strong className="text-foreground">one calendar month</strong> of
              receiving your request, as required by GDPR Article 12.
            </p>

            {/* 7.1 */}
            <div className="mt-6 border-l border-border/40 pl-4">
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                7.1 Right to Lodge a Complaint
              </h3>
              <div className="mt-2 space-y-3">
                <p>
                  If you believe we have processed your data unlawfully, you
                  have the right to lodge a complaint with the competent
                  supervisory authority of your country of residence within the
                  EEA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Security */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">8.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Data Security
            </h2>
          </div>
          <div className="ml-7 mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              We implement appropriate technical and organisational measures to
              protect your personal data, including:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-primary">
              <li>
                Passwords stored exclusively as hashed values (never in plain
                text)
              </li>
              <li>HTTPS encryption for all data in transit</li>
              <li>
                Role-based access controls on our database (Supabase Row Level
                Security)
              </li>
              <li>Service-role keys never exposed to the browser</li>
              <li>HTTP-only, signed cookies for session management</li>
            </ul>
          </div>
        </section>

        {/* 9. Children */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">9.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Children
            </h2>
          </div>
          <p className="ml-7 mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Our service is exclusively intended for registered businesses. We do
            not knowingly collect personal data from individuals under the age of
            18. If you believe a minor has submitted data through our platform,
            please contact us at{" "}
            <a href="mailto:support@example.com" className="text-primary underline-offset-2 hover:underline">support@example.com</a> and
            we will delete it immediately.
          </p>
        </section>

        {/* 10. Changes */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">10.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Changes to This Policy
            </h2>
          </div>
          <p className="ml-7 mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            We reserve the right to update this Privacy Policy at any time. When
            we do, we will update the “Last updated” date at the top of this
            page. Continued use of the service after the updated policy is
            published constitutes acceptance of the changes. For material
            changes, we will notify registered users by email.
          </p>
        </section>

        {/* 11. Contact */}
        <section className="border-l-2 border-border/60 pl-6">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-primary">11.</span>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Contact
            </h2>
          </div>
          <div className="ml-7 mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              For any question, request, or concern regarding this Privacy Policy
              or the processing of your personal data:
            </p>
            <address className="not-italic space-y-1">
              <p className="font-semibold text-foreground">Acme Labs, Inc.</p>
              <p>123 Example Street, Suite 100, Springfield, 00000, United States</p>
              <p>
                Email:{" "}
                <a href="mailto:support@example.com" className="text-primary underline-offset-2 hover:underline">support@example.com</a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  example.com
                </a>
              </p>
            </address>
          </div>
        </section>
      </div>
    </div>
  );
}
