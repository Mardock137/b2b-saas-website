import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockSend = vi.fn();
vi.mock("@/lib/resend/server", () => ({
  getResendClient: () => ({
    emails: { send: mockSend },
  }),
}));

const { sendTaxIdReviewAlert } = await import("@/lib/resend/alerts");

const ALERT = {
  companyName: "Acme SRL",
  companyId: "company-uuid-123",
  stripeCustomerId: "cus_123",
  taxIdType: "eu_vat",
  taxIdValue: "IT12345678901",
  verificationStatus: "unverified" as const,
};

describe("sendTaxIdReviewAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTACT_RECIPIENT_EMAIL = "support@example.com";
    process.env.RESEND_API_KEY = "re_test_key";
  });

  it("sends a plain-text alert to the contact recipient", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_1" }, error: null });

    await sendTaxIdReviewAlert(ALERT);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@example.com",
        to: "support@example.com",
        subject: "Tax ID needs review: Acme SRL",
        text: expect.stringContaining("IT12345678901"),
      }),
    );
  });

  it("does not throw when Resend returns an error", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "invalid" },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendTaxIdReviewAlert(ALERT)).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("does not throw when Resend throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("network"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendTaxIdReviewAlert(ALERT)).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("does not throw when CONTACT_RECIPIENT_EMAIL is missing", async () => {
    delete process.env.CONTACT_RECIPIENT_EMAIL;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendTaxIdReviewAlert(ALERT)).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
