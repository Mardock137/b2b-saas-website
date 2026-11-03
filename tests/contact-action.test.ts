import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock "server-only" so it doesn't throw outside the Next.js runtime.
vi.mock("server-only", () => ({}));

const mockSend = vi.fn();
vi.mock("@/lib/resend/server", () => ({
  getResendClient: () => ({
    emails: { send: mockSend },
  }),
}));

const mockGetClientIp = vi.fn();
vi.mock("@/lib/security/client-ip", () => ({
  getClientIp: () => mockGetClientIp(),
}));

const mockCheckContactRateLimit = vi.fn();
vi.mock("@/lib/security/rate-limit", () => ({
  checkContactRateLimit: (...args: unknown[]) =>
    mockCheckContactRateLimit(...args),
}));

const mockVerifyTurnstileToken = vi.fn();
vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstileToken: (...args: unknown[]) =>
    mockVerifyTurnstileToken(...args),
  VERIFICATION_FAILED_MESSAGE: "Verification failed. Please try again.",
}));

const { sendContactMessageAction } = await import(
  "@/app/(site)/contact/actions"
);

const VALID_INPUT = {
  companyName: "Acme Inc.",
  email: "info@acme.com",
  message: "We are interested in Frontline.",
};

const CAPTCHA_TOKEN = "captcha-token";
const CLIENT_IP = "203.0.113.10";

function sendMessage(
  values: typeof VALID_INPUT = VALID_INPUT,
  honeypot = "",
) {
  return sendContactMessageAction(values, CAPTCHA_TOKEN, honeypot);
}

describe("sendContactMessageAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTACT_RECIPIENT_EMAIL = "support@example.com";
    process.env.RESEND_API_KEY = "re_test_key";
    mockGetClientIp.mockResolvedValue(CLIENT_IP);
    mockCheckContactRateLimit.mockResolvedValue({ allowed: true });
    mockVerifyTurnstileToken.mockResolvedValue(true);
  });

  it("returns success when Resend sends without errors", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_123" }, error: null });

    const result = await sendMessage();

    expect(result).toEqual({ success: true });
    expect(mockCheckContactRateLimit).toHaveBeenCalledWith(CLIENT_IP);
    expect(mockVerifyTurnstileToken).toHaveBeenCalledWith(
      CAPTCHA_TOKEN,
      CLIENT_IP,
    );
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@example.com",
        to: "support@example.com",
        replyTo: VALID_INPUT.email,
        subject: expect.stringContaining(VALID_INPUT.companyName),
      }),
    );
  });

  it("returns a fake success and sends nothing when the honeypot is filled", async () => {
    const result = await sendMessage(VALID_INPUT, "https://spam.example");

    expect(result).toEqual({ success: true });
    expect(mockGetClientIp).not.toHaveBeenCalled();
    expect(mockCheckContactRateLimit).not.toHaveBeenCalled();
    expect(mockVerifyTurnstileToken).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns an error and does not send when the rate limit is exceeded", async () => {
    mockCheckContactRateLimit.mockResolvedValueOnce({ allowed: false });

    const result = await sendMessage();

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again later.",
    });
    expect(mockVerifyTurnstileToken).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns a verification error and does not send when Turnstile rejects the token", async () => {
    mockVerifyTurnstileToken.mockResolvedValueOnce(false);

    const result = await sendMessage();

    expect(result).toEqual({
      success: false,
      error: "Verification failed. Please try again.",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error when Resend responds with an error object", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Invalid address" },
    });

    const result = await sendMessage();

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again later.",
    });
  });

  it("returns error when Resend throws unexpectedly", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network failure"));

    const result = await sendMessage();

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again later.",
    });
  });

  it("returns error when companyName is too short (server-side validation)", async () => {
    const result = await sendMessage({
      ...VALID_INPUT,
      companyName: "A",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid form data. Please check your inputs.",
    });
    expect(mockGetClientIp).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error when email is invalid (server-side validation)", async () => {
    const result = await sendMessage({
      ...VALID_INPUT,
      email: "not-an-email",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid form data. Please check your inputs.",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error when message is too short (server-side validation)", async () => {
    const result = await sendMessage({
      ...VALID_INPUT,
      message: "Short",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid form data. Please check your inputs.",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error when CONTACT_RECIPIENT_EMAIL is not set", async () => {
    delete process.env.CONTACT_RECIPIENT_EMAIL;

    const result = await sendMessage();

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again later.",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
