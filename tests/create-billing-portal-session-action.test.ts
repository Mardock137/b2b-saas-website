import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetCurrentCompany = vi.fn();

vi.mock("@/lib/dashboard/queries", () => ({
  getCurrentCompany: (...args: unknown[]) => mockGetCurrentCompany(...args),
}));

const mockBillingPortalCreate = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  getStripeServerClient: () => ({
    billingPortal: { sessions: { create: mockBillingPortalCreate } },
  }),
}));

const { createBillingPortalSessionAction } = await import(
  "@/app/(dashboard)/dashboard/actions"
);

const COMPANY = {
  id: "company-uuid-123",
  company_name: "Acme SRL",
  tax_id: "IT123",
  stripe_customer_id: "cus_123",
};

describe("createBillingPortalSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns an error when the user is not authenticated", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(null);

    const result = await createBillingPortalSessionAction();

    expect(result).toEqual({
      success: false,
      error: "Please sign in to manage your billing.",
    });
    expect(mockBillingPortalCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the company has no Stripe customer id", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: { ...COMPANY, stripe_customer_id: null },
    });

    const result = await createBillingPortalSessionAction();

    expect(result).toEqual({
      success: false,
      error: "You don't have an active subscription to manage.",
    });
    expect(mockBillingPortalCreate).not.toHaveBeenCalled();
  });

  it("creates a billing portal session and returns its url", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: COMPANY,
    });
    mockBillingPortalCreate.mockResolvedValueOnce({
      url: "https://billing.stripe.com/p/session/test_123",
    });

    const result = await createBillingPortalSessionAction();

    expect(result).toEqual({
      success: true,
      url: "https://billing.stripe.com/p/session/test_123",
    });
    expect(mockBillingPortalCreate).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "https://example.com/dashboard",
    });
  });

  it("returns a generic error when Stripe fails to create the session", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: COMPANY,
    });
    mockBillingPortalCreate.mockRejectedValueOnce(new Error("stripe down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createBillingPortalSessionAction();

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
