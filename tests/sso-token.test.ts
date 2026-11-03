import { afterEach, describe, expect, it } from "vitest";
import { jwtVerify } from "jose";

import {
  SSO_AUDIENCE,
  SSO_ISSUER,
  SSO_QUERY_PARAM,
  SSO_TOKEN_TTL_SECONDS,
  buildSsoOpenUrl,
  generateSsoToken,
} from "@/lib/sso/token";

const TEST_SECRET = "unit-test-sso-shared-secret-value";
const COMPANY = { id: "company-uuid-123", company_name: "Acme SRL" };
const PRODUCT_SLUG = "frontline";
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function encodeSecret(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

describe("generateSsoToken", () => {
  const originalSecret = process.env.SSO_SHARED_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.SSO_SHARED_SECRET;
    } else {
      process.env.SSO_SHARED_SECRET = originalSecret;
    }
  });

  it("throws when SSO_SHARED_SECRET is missing", async () => {
    delete process.env.SSO_SHARED_SECRET;

    await expect(generateSsoToken(COMPANY, PRODUCT_SLUG)).rejects.toThrow(
      "SSO_SHARED_SECRET is not configured",
    );
  });

  it("throws when SSO_SHARED_SECRET is an empty string", async () => {
    process.env.SSO_SHARED_SECRET = "";

    await expect(generateSsoToken(COMPANY, PRODUCT_SLUG)).rejects.toThrow(
      "SSO_SHARED_SECRET is not configured",
    );
  });

  it("signs a JWT with the expected claims, HS256 header and 60s TTL", async () => {
    process.env.SSO_SHARED_SECRET = TEST_SECRET;

    const token = await generateSsoToken(COMPANY, PRODUCT_SLUG);
    const { payload, protectedHeader } = await jwtVerify(
      token,
      encodeSecret(TEST_SECRET),
      { issuer: SSO_ISSUER, audience: SSO_AUDIENCE },
    );

    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe(COMPANY.id);
    expect(payload.company_name).toBe(COMPANY.company_name);
    expect(payload.product).toBe(PRODUCT_SLUG);
    expect(payload.jti).toEqual(expect.stringMatching(UUID_V4));
    expect(payload.iss).toBe(SSO_ISSUER);
    expect(payload.aud).toBe(SSO_AUDIENCE);
    expect(payload.iat).toEqual(expect.any(Number));
    expect(payload.exp).toBe((payload.iat as number) + SSO_TOKEN_TTL_SECONDS);
  });

  it("issues a different jti on every token", async () => {
    process.env.SSO_SHARED_SECRET = TEST_SECRET;

    const first = await generateSsoToken(COMPANY, PRODUCT_SLUG);
    const second = await generateSsoToken(COMPANY, PRODUCT_SLUG);
    const { payload: firstPayload } = await jwtVerify(
      first,
      encodeSecret(TEST_SECRET),
      { issuer: SSO_ISSUER, audience: SSO_AUDIENCE },
    );
    const { payload: secondPayload } = await jwtVerify(
      second,
      encodeSecret(TEST_SECRET),
      { issuer: SSO_ISSUER, audience: SSO_AUDIENCE },
    );

    expect(firstPayload.jti).toEqual(expect.stringMatching(UUID_V4));
    expect(secondPayload.jti).toEqual(expect.stringMatching(UUID_V4));
    expect(firstPayload.jti).not.toBe(secondPayload.jti);
  });

  it("rejects verification when the signature does not match", async () => {
    process.env.SSO_SHARED_SECRET = TEST_SECRET;

    const token = await generateSsoToken(COMPANY, PRODUCT_SLUG);

    await expect(
      jwtVerify(token, encodeSecret("a-different-secret-value"), {
        issuer: SSO_ISSUER,
        audience: SSO_AUDIENCE,
      }),
    ).rejects.toThrow();
  });
});

describe("buildSsoOpenUrl", () => {
  it("appends sso_token to a URL without query params", () => {
    const url = buildSsoOpenUrl("https://frontline.example.com/sso/callback", "abc.def.ghi");

    expect(url).toBe(
      "https://frontline.example.com/sso/callback?sso_token=abc.def.ghi",
    );
  });

  it("preserves existing query params", () => {
    const url = buildSsoOpenUrl(
      "https://frontline.example.com/sso/callback?ref=dashboard",
      "token-value",
    );

    expect(url).toContain("ref=dashboard");
    expect(url).toContain(`${SSO_QUERY_PARAM}=token-value`);
  });
});
