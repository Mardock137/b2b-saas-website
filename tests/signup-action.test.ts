import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { signUp: mockSignUp } })),
}));

const mockCompaniesInsert = vi.fn();
const mockDeleteUser = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ insert: mockCompaniesInsert }),
    auth: { admin: { deleteUser: mockDeleteUser } },
  }),
}));

const mockGetClientIp = vi.fn();
vi.mock("@/lib/security/client-ip", () => ({
  getClientIp: () => mockGetClientIp(),
}));

const mockCheckSignupRateLimit = vi.fn();
vi.mock("@/lib/security/rate-limit", () => ({
  checkSignupRateLimit: (...args: unknown[]) => mockCheckSignupRateLimit(...args),
}));

const mockCheckVatNumber = vi.fn();
vi.mock("@/lib/tax-id/vies", () => ({
  checkVatNumber: (...args: unknown[]) => mockCheckVatNumber(...args),
}));

const { signupAction } = await import("@/app/(site)/auth/signup/actions");

const CAPTCHA_TOKEN = "captcha-token";

const VALID_VALUES = {
  companyName: "Acme SRL",
  email: "owner@acme.com",
  taxIdCountry: "IT" as const,
  taxId: "12345678901",
  password: "sixteen-chars-ok",
};

function newUser(overrides: Partial<{ id: string; identities: unknown[] }> = {}) {
  return {
    id: overrides.id ?? "new-user-uuid",
    identities: overrides.identities ?? [{ id: "identity-1" }],
  };
}

describe("signupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIp.mockResolvedValue("203.0.113.10");
    mockCheckSignupRateLimit.mockResolvedValue({ allowed: true });
    mockCheckVatNumber.mockResolvedValue("valid");
  });

  it("returns a validation error without calling signUp when the password is too short", async () => {
    const result = await signupAction(
      {
        ...VALID_VALUES,
        password: "short",
      },
      CAPTCHA_TOKEN,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0);
    }
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockCheckSignupRateLimit).not.toHaveBeenCalled();
    expect(mockCheckVatNumber).not.toHaveBeenCalled();
  });

  it("returns a validation error without calling signUp when the password exceeds 128 characters", async () => {
    const result = await signupAction(
      {
        ...VALID_VALUES,
        password: "a".repeat(129),
      },
      CAPTCHA_TOKEN,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Password must be at most 128 characters");
    }
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("accepts a password of exactly 128 characters", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: newUser() },
      error: null,
    });
    mockCompaniesInsert.mockResolvedValueOnce({ error: null });

    const result = await signupAction(
      {
        ...VALID_VALUES,
        password: "a".repeat(128),
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({ success: true });
    expect(mockSignUp).toHaveBeenCalledWith({
      email: VALID_VALUES.email,
      password: "a".repeat(128),
      options: {
        emailRedirectTo: expect.stringContaining("/auth/callback"),
        captchaToken: CAPTCHA_TOKEN,
      },
    });
  });

  it("returns a verification error when Supabase reports captcha_failed", async () => {
    const captchaError = {
      code: "captcha_failed",
      message: "captcha verification process failed",
    };
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: captchaError,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Verification failed. Please try again.",
    });
    expect(mockCompaniesInsert).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns the signUp error message when signUp fails", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Sign-up failed" },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Sign-up failed",
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[signupAction] signUpError:",
      { message: "Sign-up failed" },
    );
    expect(mockCompaniesInsert).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not insert or deleteUser when signUp returns an existing user with empty identities", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "existing-uuid", identities: [] } },
      error: null,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Unable to create account. Please try again or contact support.",
    });
    expect(mockCompaniesInsert).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[signupAction] signUp returned an existing user with no new identity (email likely already registered):",
      "existing-uuid",
    );
    consoleSpy.mockRestore();
  });

  it("returns success when signUp creates a new user and the companies insert succeeds", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: newUser() },
      error: null,
    });
    mockCompaniesInsert.mockResolvedValueOnce({ error: null });

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({ success: true });
    expect(mockCheckVatNumber).toHaveBeenCalledWith("IT", "12345678901");
    expect(mockCompaniesInsert).toHaveBeenCalledWith({
      id: "new-user-uuid",
      company_name: VALID_VALUES.companyName,
      tax_id: "12345678901",
      tax_id_country: "IT",
      tax_id_verification: "vies_verified",
    });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes the new Auth user when the companies insert fails", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: newUser({ id: "new-user-uuid" }) },
      error: null,
    });
    mockCompaniesInsert.mockResolvedValueOnce({
      error: { message: "insert failed" },
    });
    mockDeleteUser.mockResolvedValueOnce(undefined);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(mockDeleteUser).toHaveBeenCalledWith("new-user-uuid");
    expect(result).toEqual({
      success: false,
      error:
        "We couldn't save your company profile. Please try again or contact support.",
    });
    consoleSpy.mockRestore();
  });

  it("swallows a deleteUser failure after a companies insert error and still returns the insert error", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: newUser({ id: "new-user-uuid" }) },
      error: null,
    });
    mockCompaniesInsert.mockResolvedValueOnce({
      error: { message: "insert failed" },
    });
    const cleanupError = new Error("cleanup failed");
    mockDeleteUser.mockRejectedValueOnce(cleanupError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error:
        "We couldn't save your company profile. Please try again or contact support.",
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[signupAction] Failed to clean up Auth user after companies insert error:",
      cleanupError,
    );
    consoleSpy.mockRestore();
  });

  it("does not call VIES for a non-EU country and stores format_only", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: newUser() },
      error: null,
    });
    mockCompaniesInsert.mockResolvedValueOnce({ error: null });

    const result = await signupAction(
      {
        ...VALID_VALUES,
        taxIdCountry: "US",
        taxId: "12-3456789",
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({ success: true });
    expect(mockCheckVatNumber).not.toHaveBeenCalled();
    expect(mockCompaniesInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_id: "123456789",
        tax_id_country: "US",
        tax_id_verification: "format_only",
      }),
    );
  });

  it("does not call signUp when VIES reports the VAT number as invalid", async () => {
    mockCheckVatNumber.mockResolvedValueOnce("invalid");

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "This VAT number was not found in the EU VIES database.",
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("does not call signUp when VIES is unavailable", async () => {
    mockCheckVatNumber.mockResolvedValueOnce("unavailable");

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error:
        "The VAT validation service is temporarily unavailable. Please try again in a few minutes.",
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("does not call VIES or signUp when the signup rate limit is exceeded", async () => {
    mockCheckSignupRateLimit.mockResolvedValueOnce({ allowed: false });

    const result = await signupAction(VALID_VALUES, CAPTCHA_TOKEN);

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again later.",
    });
    expect(mockCheckVatNumber).not.toHaveBeenCalled();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("checks a Northern Ireland number on VIES as XI", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: newUser() },
      error: null,
    });
    mockCompaniesInsert.mockResolvedValueOnce({ error: null });

    const result = await signupAction(
      {
        ...VALID_VALUES,
        taxIdCountry: "GB",
        taxId: "XI123456789",
      },
      CAPTCHA_TOKEN,
    );

    expect(result).toEqual({ success: true });
    expect(mockCheckVatNumber).toHaveBeenCalledWith("XI", "123456789");
    expect(mockCompaniesInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_id: "XI123456789",
        tax_id_country: "GB",
        tax_id_verification: "vies_verified",
      }),
    );
  });
});
