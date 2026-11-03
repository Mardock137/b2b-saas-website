import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetCurrentCompany = vi.fn();
const mockGetSubscriptionsForCompany = vi.fn();

vi.mock("@/lib/dashboard/queries", () => ({
  getCurrentCompany: (...args: unknown[]) => mockGetCurrentCompany(...args),
  getSubscriptionsForCompany: (...args: unknown[]) =>
    mockGetSubscriptionsForCompany(...args),
}));

const mockGenerateSsoToken = vi.fn();
const mockBuildSsoOpenUrl = vi.fn();

vi.mock("@/lib/sso/token", () => ({
  generateSsoToken: (...args: unknown[]) => mockGenerateSsoToken(...args),
  buildSsoOpenUrl: (...args: unknown[]) => mockBuildSsoOpenUrl(...args),
}));

const { openProductAppAction } = await import(
  "@/app/(dashboard)/dashboard/apps/actions"
);

const COMPANY = {
  id: "company-uuid-123",
  company_name: "Acme SRL",
  tax_id: "IT123",
  stripe_customer_id: "cus_123",
};

const ACTIVE_SUBSCRIPTION = {
  status: "active" as const,
  current_period_end: "2026-09-01T00:00:00.000Z",
  product: {
    slug: "frontline",
    name: "Frontline",
    description: "AI support",
    web_app_url: "https://frontline.example.com",
    status: "available" as const,
  },
};

describe("openProductAppAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when the user is not authenticated", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(null);

    const result = await openProductAppAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "Please sign in to open the app.",
    });
    expect(mockGetSubscriptionsForCompany).not.toHaveBeenCalled();
  });

  it("returns an error when the subscription is missing", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: COMPANY,
    });
    mockGetSubscriptionsForCompany.mockResolvedValueOnce([]);

    const result = await openProductAppAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "This app is not active.",
    });
    expect(mockGenerateSsoToken).not.toHaveBeenCalled();
  });

  it("returns an error when the subscription is not active", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: COMPANY,
    });
    mockGetSubscriptionsForCompany.mockResolvedValueOnce([
      { ...ACTIVE_SUBSCRIPTION, status: "canceled" },
    ]);

    const result = await openProductAppAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "This app is not active.",
    });
    expect(mockGenerateSsoToken).not.toHaveBeenCalled();
  });

  it("returns a signed URL when the subscription is active", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: COMPANY,
    });
    mockGetSubscriptionsForCompany.mockResolvedValueOnce([ACTIVE_SUBSCRIPTION]);
    mockGenerateSsoToken.mockResolvedValueOnce("signed.jwt.token");
    mockBuildSsoOpenUrl.mockReturnValueOnce(
      "https://frontline.example.com/?sso_token=signed.jwt.token",
    );

    const result = await openProductAppAction("frontline");

    expect(result).toEqual({
      success: true,
      url: "https://frontline.example.com/?sso_token=signed.jwt.token",
    });
    expect(mockGenerateSsoToken).toHaveBeenCalledWith(
      {
        id: COMPANY.id,
        company_name: COMPANY.company_name,
      },
      ACTIVE_SUBSCRIPTION.product.slug,
    );
    expect(mockBuildSsoOpenUrl).toHaveBeenCalledWith(
      ACTIVE_SUBSCRIPTION.product.web_app_url,
      "signed.jwt.token",
    );
  });

  it("returns an error when token signing fails", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: { id: COMPANY.id },
      company: COMPANY,
    });
    mockGetSubscriptionsForCompany.mockResolvedValueOnce([ACTIVE_SUBSCRIPTION]);
    mockGenerateSsoToken.mockRejectedValueOnce(
      new Error("SSO_SHARED_SECRET is not configured"),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await openProductAppAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
