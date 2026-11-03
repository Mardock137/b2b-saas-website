import "server-only";

import { getResendClient } from "@/lib/resend/server";

export type TaxIdReviewAlert = {
  companyName: string;
  companyId: string;
  stripeCustomerId: string;
  taxIdType: string;
  taxIdValue: string;
  verificationStatus: "unverified" | "unavailable";
};

/**
 * Emails the operator that a company tax ID needs a manual check.
 * Never throws: a mail failure must not make Stripe retry the webhook
 * after the flag has already been saved.
 */
export async function sendTaxIdReviewAlert(
  alert: TaxIdReviewAlert,
): Promise<void> {
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL;
  if (!recipient) {
    console.error(
      "[sendTaxIdReviewAlert] CONTACT_RECIPIENT_EMAIL is not set.",
    );
    return;
  }

  const text = [
    "A customer tax ID needs a manual check.",
    "",
    `Company: ${alert.companyName}`,
    `Company ID: ${alert.companyId}`,
    `Stripe customer: ${alert.stripeCustomerId}`,
    `Tax ID type: ${alert.taxIdType}`,
    `Tax ID value: ${alert.taxIdValue}`,
    `Verification status: ${alert.verificationStatus}`,
  ].join("\n");

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: "noreply@example.com",
      to: recipient,
      subject: `Tax ID needs review: ${alert.companyName}`,
      text,
    });

    if (error) {
      console.error("[sendTaxIdReviewAlert] Resend error:", error);
    }
  } catch (err) {
    console.error("[sendTaxIdReviewAlert] Unexpected error:", err);
  }
}
