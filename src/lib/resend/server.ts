import "server-only";

import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[resend/server] RESEND_API_KEY is not set. Add it to your .env file.",
    );
  }

  resendClient = new Resend(apiKey);

  return resendClient;
}
