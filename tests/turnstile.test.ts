import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { verifyTurnstileToken } = await import("@/lib/security/turnstile");

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

describe("verifyTurnstileToken", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
  });

  it("returns true when siteverify accepts the token", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await verifyTurnstileToken("valid-token", "203.0.113.10");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init.method).toBe("POST");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("valid-token");
    expect(body.get("remoteip")).toBe("203.0.113.10");
  });

  it("returns false when siteverify rejects the token", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await verifyTurnstileToken("bad-token");

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns false when the siteverify request fails", async () => {
    const networkError = new Error("network down");
    fetchMock.mockRejectedValueOnce(networkError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await verifyTurnstileToken("valid-token");

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[verifyTurnstileToken] siteverify request failed:",
      networkError,
    );
    consoleSpy.mockRestore();
  });

  it("returns false and does not call siteverify when the secret is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await verifyTurnstileToken("valid-token");

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[verifyTurnstileToken] TURNSTILE_SECRET_KEY is not set.",
    );
    consoleSpy.mockRestore();
  });
});
