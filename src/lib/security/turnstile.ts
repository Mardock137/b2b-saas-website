import "server-only";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const VERIFICATION_FAILED_MESSAGE =
  "Verification failed. Please try again.";

type SiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

type CaptchaError = {
  code?: string | null;
  message?: string | null;
};

/**
 * True when Supabase rejected the request because the Turnstile token
 * was missing, invalid, or already used.
 */
export function isCaptchaVerificationError(
  error: CaptchaError | null | undefined,
): boolean {
  if (!error) {
    return false;
  }

  const code = error.code ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return code === "captcha_failed" || message.includes("captcha");
}

/**
 * Verifies a Turnstile token with Cloudflare. Fail-closed: a missing
 * secret, an empty token, a rejected token, or a network error all
 * count as invalid. The secret is never written to logs.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[verifyTurnstileToken] TURNSTILE_SECRET_KEY is not set.");
    return false;
  }

  if (!token.trim()) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      console.error(
        "[verifyTurnstileToken] siteverify HTTP error:",
        response.status,
      );
      return false;
    }

    const data = (await response.json()) as SiteverifyResponse;
    if (data.success !== true) {
      console.error(
        "[verifyTurnstileToken] siteverify rejected the token.",
        data["error-codes"] ?? [],
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[verifyTurnstileToken] siteverify request failed:", error);
    return false;
  }
}
