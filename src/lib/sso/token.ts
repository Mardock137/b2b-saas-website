import { SignJWT } from "jose";

export const SSO_ISSUER = "partner-website";
export const SSO_AUDIENCE = "support-saas";
export const SSO_TOKEN_TTL_SECONDS = 60;
export const SSO_QUERY_PARAM = "sso_token";

export type SsoCompany = {
  id: string;
  company_name: string;
};

function getSharedSecret(): Uint8Array {
  const secret = process.env.SSO_SHARED_SECRET;

  if (!secret) {
    throw new Error("SSO_SHARED_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

/**
 * Signs a short-lived JWT proving the company identity to a product web app.
 * The payload includes `company_name`, the product slug, and a unique `jti`.
 * The token must be appended as `sso_token` on the product web app URL.
 * It is meant to be used once; this site only issues the `jti`. Replay checks
 * belong to the product app.
 */
export async function generateSsoToken(
  company: SsoCompany,
  productSlug: string,
): Promise<string> {
  return new SignJWT({
    company_name: company.company_name,
    product: productSlug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(company.id)
    .setJti(crypto.randomUUID())
    .setIssuer(SSO_ISSUER)
    .setAudience(SSO_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SSO_TOKEN_TTL_SECONDS}s`)
    .sign(getSharedSecret());
}

/**
 * Appends the SSO token to the product web app URL without dropping existing query params.
 */
export function buildSsoOpenUrl(webAppUrl: string, token: string): string {
  const url = new URL(webAppUrl);
  url.searchParams.set(SSO_QUERY_PARAM, token);
  return url.toString();
}
