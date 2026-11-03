"use server";

import { getResendClient } from "@/lib/resend/server";
import { getClientIp } from "@/lib/security/client-ip";
import { checkContactRateLimit } from "@/lib/security/rate-limit";
import {
  VERIFICATION_FAILED_MESSAGE,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";
import { contactSchema, type ContactValues } from "@/lib/validations/contact";

const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

export type ContactResult =
  | { success: true }
  | { success: false; error: string };

export async function sendContactMessageAction(
  values: ContactValues,
  captchaToken: string,
  honeypot = "",
): Promise<ContactResult> {
  // Server-side re-validation — never trust client-only validation.
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data. Please check your inputs." };
  }

  // Bots that fill the hidden field get a fake success and nothing is sent.
  if (honeypot.trim() !== "") {
    return { success: true };
  }

  const ip = await getClientIp();
  const rateLimit = await checkContactRateLimit(ip);
  if (!rateLimit.allowed) {
    return { success: false, error: RATE_LIMIT_MESSAGE };
  }

  const turnstileOk = await verifyTurnstileToken(
    captchaToken,
    ip === "unknown" ? undefined : ip,
  );
  if (!turnstileOk) {
    return { success: false, error: VERIFICATION_FAILED_MESSAGE };
  }

  const { companyName, email, message } = parsed.data;

  const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL;
  if (!recipientEmail) {
    console.error("[sendContactMessageAction] CONTACT_RECIPIENT_EMAIL is not set.");
    return { success: false, error: "Something went wrong. Please try again later." };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: "noreply@example.com",
      to: recipientEmail,
      replyTo: email,
      subject: `New contact message from ${companyName}`,
      text: `Company: ${companyName}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("[sendContactMessageAction] Resend error:", error);
      return { success: false, error: "Something went wrong. Please try again later." };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendContactMessageAction] Unexpected error:", err);
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}
