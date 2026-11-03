import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
  })),
}));

const { loginAction } = await import("@/app/(site)/auth/login/actions");

const VALID_VALUES = {
  email: "owner@acme.com",
  password: "any-password",
};

const CAPTCHA_TOKEN = "captcha-token";

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a validation error without calling signInWithPassword when email is invalid", async () => {
    const result = await loginAction(
      {
        email: "not-an-email",
        password: "any-password",
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0);
    }
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("passes the Turnstile token to signInWithPassword", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { code: "invalid_credentials" },
    });

    await loginAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: VALID_VALUES.email,
      password: VALID_VALUES.password,
      options: { captchaToken: CAPTCHA_TOKEN },
    });
  });

  it("returns a verification error when Supabase reports captcha_failed", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { code: "captcha_failed", message: "captcha verification process failed" },
    });

    const result = await loginAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Verification failed. Please try again.",
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns 'Invalid email or password.' on invalid_credentials", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { code: "invalid_credentials" },
    });

    const result = await loginAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Invalid email or password.",
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns the unconfirmed-email message when the error mentions it", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Email not confirmed" },
    });

    const result = await loginAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Please confirm your email before logging in.",
    });
  });

  it("logs unexpected sign-in errors and returns a generic message", async () => {
    const unexpected = { code: "unexpected_failure", message: "boom" };
    mockSignInWithPassword.mockResolvedValueOnce({ error: unexpected });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await loginAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Unable to log in. Please try again.",
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[loginAction] Unexpected sign-in error:",
      unexpected,
    );
    consoleSpy.mockRestore();
  });

  it("revalidates the layout and redirects to /dashboard when login succeeds with no next", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    await expect(loginAction(VALID_VALUES, CAPTCHA_TOKEN)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("redirects to a safe next path after a successful login", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    await expect(
      loginAction(VALID_VALUES, CAPTCHA_TOKEN, "/products"),
    ).rejects.toThrow(
      "REDIRECT:/products",
    );
  });

  it("falls back to /dashboard when next is a protocol-relative URL", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    await expect(
      loginAction(VALID_VALUES, CAPTCHA_TOKEN, "//evil.com"),
    ).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(mockRedirect).not.toHaveBeenCalledWith("//evil.com");
  });
});
