import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Acme Labs",
  description: "Terms and conditions governing the use of Acme Labs services.",
};

const sections: { body: string; bullets?: string[]; trailing?: string }[] = [
  {
    body: "The user bears sole and full responsibility for the use made of the services, for any software outputs, for all decisions taken, and for any consequences arising from the use of those outputs. Acme Labs, Inc. accepts no liability whatsoever for direct, indirect, incidental, consequential, or any other form of damages arising from:",
    bullets: [
      "Improper use, misuse, or application of the services in violation of applicable laws or regulations.",
      "Business, operational, or strategic decisions made on the basis of software outputs.",
      "Software outputs that prove to be inaccurate, inappropriate, or harmful.",
      "Malfunctions, interruptions, or technical limitations affecting the services provided.",
    ],
    trailing:
      "The user agrees to use Acme Labs services in compliance with all applicable laws and to apply appropriate human oversight when making critical decisions.",
  },
  {
    body: "Acme Labs reserves the right to suspend or revoke access to its services in the event of non-payment, breach of these terms, or any conduct detrimental to Acme Labs or its systems. Suspension does not entitle the user to any refund for the remaining period.",
  },
  {
    body: "Acme Labs reserves the right to modify the pricing of its services. Any price change takes effect only after reasonable prior notice.",
  },
  {
    body: "The services are not available where providing them would breach applicable sanctions or export-control laws. Acme Labs may refuse or end access where that is required by those laws.",
  },
  {
    body: "Acme Labs may carry out compliance checks on the identity or other information declared by users or registered entities, in order to confirm adherence to these terms. Any attempt to conceal, circumvent, falsify, or materially omit relevant information is a serious breach and may result in:",
    bullets: [
      "Immediate revocation of access to the services.",
      "Reporting to the competent authorities.",
    ],
  },
  {
    body: "Any dispute arising out of or in connection with this agreement shall first be addressed through negotiation in good faith. If it is not resolved that way, it shall be submitted to the competent courts of the jurisdiction in which Acme Labs is registered.",
  },
  {
    body: "This agreement is governed by the laws of the jurisdiction in which Acme Labs is registered. Without prejudice to clause 6, any legal proceedings shall be brought before the competent courts of that jurisdiction.",
  },
  {
    body: "Acme Labs' maximum liability to the user, for any cause or reason whatsoever, is limited to the total amount paid by the user for Acme Labs services in the six (6) months preceding the event giving rise to the claim.",
  },
  {
    body: "Acme Labs reserves the right to amend these terms and conditions at any time. Amendments shall take effect from the date of publication on Acme Labs' official website. Continued use of the services following the publication of any amendments constitutes acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <header className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Terms &amp; Conditions
        </h1>
        <p className="mx-auto mt-6 max-w-2xl rounded-md border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          Sample text. This page is a template and does not describe a real
          company or service.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          The following terms govern the use of Acme Labs services and apply to
          all registered companies.
        </p>
      </header>

      <ol className="mt-16 space-y-10">
        {sections.map((section, idx) => (
          <li key={idx} className="border-l-2 border-border/60 pl-6">
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-primary">
                {idx + 1}.
              </span>
              <p className="text-sm leading-relaxed text-foreground sm:text-base">
                {section.body}
              </p>
            </div>

            {section.bullets && (
              <ul className="mt-4 ml-9 list-disc space-y-2 text-sm text-muted-foreground marker:text-primary sm:text-base">
                {section.bullets.map((bullet, bIdx) => (
                  <li key={bIdx}>{bullet}</li>
                ))}
              </ul>
            )}

            {section.trailing && (
              <p className="mt-4 ml-9 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {section.trailing}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
