import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetCurrentCompany = vi.fn();
vi.mock("@/lib/dashboard/queries", () => ({
  getCurrentCompany: (...args: unknown[]) => mockGetCurrentCompany(...args),
}));

const mockSignInWithPassword = vi.fn();
const mockUpdateUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateUser,
    },
  })),
}));

const { changePasswordAction } = await import(
  "@/app/(dashboard)/dashboard/settings/actions"
);

const CAPTCHA_TOKEN = "captcha-token";

const VALID_VALUES = {
  currentPassword: "old-password-123",
  newPassword: "brand-new-password-456",
  confirmPassword: "brand-new-password-456",
};

const AUTHED_COMPANY = {
  user: { email: "owner@acme.com" },
  company: { id: "c1" },
};

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a validation error without calling getCurrentCompany when newPassword exceeds 128 characters", async () => {
    const tooLong = "a".repeat(129);
    const result = await changePasswordAction(
      {
        currentPassword: "old-password-123",
        newPassword: tooLong,
        confirmPassword: tooLong,
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({
      success: false,
      error: "Password must be at most 128 characters",
    });
    expect(mockGetCurrentCompany).not.toHaveBeenCalled();
  });

  it("accepts a new password of exactly 128 characters", async () => {
    const exact = "a".repeat(128);
    mockGetCurrentCompany.mockResolvedValueOnce(AUTHED_COMPANY);
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    mockUpdateUser.mockResolvedValueOnce({ error: null });

    const result = await changePasswordAction(
      {
        currentPassword: "old-password-123",
        newPassword: exact,
        confirmPassword: exact,
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: exact });
  });

  it("returns a Zod error and skips getCurrentCompany when confirmPassword does not match", async () => {
    const result = await changePasswordAction(
      {
        ...VALID_VALUES,
        confirmPassword: "does-not-match-000",
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({
      success: false,
      error: "Passwords do not match",
    });
    expect(mockGetCurrentCompany).not.toHaveBeenCalled();
  });

  it("returns a Zod error when the new password equals the current one", async () => {
    const result = await changePasswordAction(
      {
        currentPassword: "same-password-123",
        newPassword: "same-password-123",
        confirmPassword: "same-password-123",
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({
      success: false,
      error: "New password must be different from the current one",
    });
    expect(mockGetCurrentCompany).not.toHaveBeenCalled();
  });

  it("returns a sign-in error when getCurrentCompany returns null", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(null);

    const result = await changePasswordAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Please sign in to change your password.",
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("passes the Turnstile token when re-authenticating", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(AUTHED_COMPANY);
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    mockUpdateUser.mockResolvedValueOnce({ error: null });

    await changePasswordAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: AUTHED_COMPANY.user.email,
      password: VALID_VALUES.currentPassword,
      options: { captchaToken: CAPTCHA_TOKEN },
    });
  });

  it("returns a verification error instead of a wrong-password error when captcha fails", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(AUTHED_COMPANY);
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { code: "captcha_failed", message: "captcha verification process failed" },
    });

    const result = await changePasswordAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Verification failed. Please try again.",
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("does not call updateUser when re-authentication fails", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(AUTHED_COMPANY);
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });

    const result = await changePasswordAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Current password is incorrect.",
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("logs and returns a generic error when updateUser fails", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(AUTHED_COMPANY);
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    const updateError = { message: "update failed" };
    mockUpdateUser.mockResolvedValueOnce({ error: updateError });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await changePasswordAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[changePasswordAction] updateError:",
      updateError,
    );
    consoleSpy.mockRestore();
  });

  it("returns success when re-authentication and updateUser both succeed", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(AUTHED_COMPANY);
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    mockUpdateUser.mockResolvedValueOnce({ error: null });

    const result = await changePasswordAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: VALID_VALUES.newPassword,
    });
  });
});
