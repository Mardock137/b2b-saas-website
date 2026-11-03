import "server-only";

/**
 * Resolves the absolute origin to use when building URLs sent to
 * third parties (Stripe redirect URLs, email confirmation links, etc.).
 * Uses NEXT_PUBLIC_SITE_URL exclusively — never the request Host header,
 * which a client can spoof. Required in production; falls back to
 * http://localhost:3000 outside production (local/test).
 */
export function getRequestOrigin(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    try {
      return new URL(siteUrl).origin;
    } catch {
      throw new Error("NEXT_PUBLIC_SITE_URL is not a valid absolute URL");
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
  }

  return "http://localhost:3000";
}
