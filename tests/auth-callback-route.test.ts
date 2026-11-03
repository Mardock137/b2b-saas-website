import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockExchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

const { GET } = await import("@/app/(site)/auth/callback/route");

const ORIGIN = "https://example.com";

function makeRequest(query = ""): Request {
  return new Request(`${ORIGIN}/auth/callback${query}`);
}

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with link_expired when error_code is otp_expired", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(
      makeRequest("?error=access_denied&error_code=otp_expired"),
    );

    expect(locationOf(response)).toBe(
      `${ORIGIN}/auth/login?error=link_expired`,
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[authCallback]"),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it("redirects to login with link_invalid when a generic error is present without a code", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(makeRequest("?error=access_denied"));

    expect(locationOf(response)).toBe(
      `${ORIGIN}/auth/login?error=link_invalid`,
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[authCallback]"),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it("redirects to login with link_invalid when no query params are present", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(makeRequest());

    expect(locationOf(response)).toBe(
      `${ORIGIN}/auth/login?error=link_invalid`,
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[authCallback]"),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it("redirects to /dashboard when the code exchange succeeds", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const response = await GET(makeRequest("?code=abc"));

    expect(locationOf(response)).toBe(`${ORIGIN}/dashboard`);
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("redirects to a safe next path when the code exchange succeeds", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const response = await GET(
      makeRequest(`?code=abc&next=${encodeURIComponent("/products")}`),
    );

    expect(locationOf(response)).toBe(`${ORIGIN}/products`);
  });

  it("falls back to /dashboard when next is a protocol-relative URL", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const response = await GET(
      makeRequest(`?code=abc&next=${encodeURIComponent("//evil.com")}`),
    );

    expect(locationOf(response)).toBe(`${ORIGIN}/dashboard`);
  });

  it("redirects to login with auth_failed when the code exchange fails", async () => {
    const exchangeError = { code: "unexpected_failure", message: "boom" };
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: exchangeError });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(makeRequest("?code=abc"));

    expect(locationOf(response)).toBe(
      `${ORIGIN}/auth/login?error=auth_failed`,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[authCallback] exchangeCodeForSession failed:",
      exchangeError,
    );
    consoleSpy.mockRestore();
  });

  it("redirects to login with link_expired when the exchange error code contains expired", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      error: { code: "otp_expired", message: "Email link is invalid or has expired" },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(makeRequest("?code=abc"));

    expect(locationOf(response)).toBe(
      `${ORIGIN}/auth/login?error=link_expired`,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[authCallback]"),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });
});
