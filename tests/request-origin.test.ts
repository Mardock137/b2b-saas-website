import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getRequestOrigin } = await import("@/lib/http/request-origin");

describe("getRequestOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the origin when NEXT_PUBLIC_SITE_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    expect(getRequestOrigin()).toBe("https://example.com");
  });

  it("strips a trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");

    expect(getRequestOrigin()).toBe("https://example.com");
  });

  it("throws when NEXT_PUBLIC_SITE_URL is not a valid absolute URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");

    expect(() => getRequestOrigin()).toThrow(
      "NEXT_PUBLIC_SITE_URL is not a valid absolute URL",
    );
  });

  it("throws in production when NEXT_PUBLIC_SITE_URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getRequestOrigin()).toThrow(
      "NEXT_PUBLIC_SITE_URL is required in production",
    );
  });

  it("falls back to http://localhost:3000 when the env is missing outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "test");

    expect(getRequestOrigin()).toBe("http://localhost:3000");
  });
});
