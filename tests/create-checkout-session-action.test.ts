import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetCurrentCompany = vi.fn();

vi.mock("@/lib/dashboard/queries", () => ({
  getCurrentCompany: (...args: unknown[]) => mockGetCurrentCompany(...args),
}));

type QueryResult = { data: unknown; error: unknown };

function createQueryChain(result: QueryResult) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    maybeSingle: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);
  return chain;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

const mockCheckoutCreate = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  getStripeServerClient: () => ({
    checkout: { sessions: { create: mockCheckoutCreate } },
  }),
}));

const { createCheckoutSessionAction } = await import(
  "@/app/(site)/products/actions"
);

const COMPANY = {
  id: "company-uuid-123",
  company_name: "Acme SRL",
  tax_id: "IT123",
  stripe_customer_id: "cus_123",
};

const USER = {
  id: COMPANY.id,
  email: "owner@acme.com",
};

const PRODUCT = {
  id: "product-uuid-frontline",
  slug: "frontline",
  name: "Frontline",
  status: "available",
  stripe_price_id: "price_frontline_monthly",
};

const INCOMPLETE_MESSAGE =
  "You already have a pending subscription for this product. Check your email for a payment link, or contact support if you need help.";

function mockTables(tables: Record<string, ReturnType<typeof createQueryChain>>) {
  mockFrom.mockImplementation((table: string) => {
    const chain = tables[table];
    if (!chain) {
      throw new Error(`Unexpected table: ${table}`);
    }
    return chain;
  });
}

describe("createCheckoutSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns an error when the user is not authenticated", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce(null);

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "Please sign in to subscribe.",
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the product is not found", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    mockTables({
      products: createQueryChain({ data: null, error: null }),
    });

    const result = await createCheckoutSessionAction("unknown-slug");

    expect(result).toEqual({
      success: false,
      error: "Product not found.",
    });
    expect(mockFrom).toHaveBeenCalledWith("products");
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the product is not available for purchase", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    mockTables({
      products: createQueryChain({
        data: { ...PRODUCT, status: "coming_soon" },
        error: null,
      }),
    });

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "This product is not available for purchase.",
    });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the product has no stripe_price_id", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    mockTables({
      products: createQueryChain({
        data: { ...PRODUCT, stripe_price_id: null },
        error: null,
      }),
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "This product is not ready for purchase yet.",
    });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns an error when an active subscription already exists", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    const subscriptions = createQueryChain({
      data: { id: "sub-row-1", status: "active" },
      error: null,
    });
    mockTables({
      products: createQueryChain({ data: PRODUCT, error: null }),
      subscriptions,
    });

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "You are already subscribed to this product.",
    });
    expect(subscriptions.in).toHaveBeenCalledWith("status", [
      "active",
      "past_due",
      "incomplete",
    ]);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns a dedicated error when an incomplete subscription already exists", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    mockTables({
      products: createQueryChain({ data: PRODUCT, error: null }),
      subscriptions: createQueryChain({
        data: { id: "sub-row-1", status: "incomplete" },
        error: null,
      }),
    });

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: false,
      error: INCOMPLETE_MESSAGE,
    });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("creates a checkout session when no blocking subscription exists", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    mockTables({
      products: createQueryChain({ data: PRODUCT, error: null }),
      subscriptions: createQueryChain({ data: null, error: null }),
    });
    mockCheckoutCreate.mockResolvedValueOnce({
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: PRODUCT.stripe_price_id, quantity: 1 }],
        tax_id_collection: { enabled: true, required: "if_supported" },
        customer: COMPANY.stripe_customer_id,
        customer_update: { name: "auto" },
        metadata: {
          company_id: COMPANY.id,
          product_id: PRODUCT.id,
          product_slug: PRODUCT.slug,
        },
        subscription_data: {
          metadata: {
            company_id: COMPANY.id,
            product_id: PRODUCT.id,
          },
        },
      }),
    );
  });

  it("returns a generic error when Stripe fails to create the session", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: COMPANY,
    });
    mockTables({
      products: createQueryChain({ data: PRODUCT, error: null }),
      subscriptions: createQueryChain({ data: null, error: null }),
    });
    mockCheckoutCreate.mockRejectedValueOnce(new Error("stripe down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCheckoutSessionAction("frontline");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("omits customer_update when Stripe has not created a customer yet", async () => {
    mockGetCurrentCompany.mockResolvedValueOnce({
      user: USER,
      company: { ...COMPANY, stripe_customer_id: null },
    });
    mockTables({
      products: createQueryChain({ data: PRODUCT, error: null }),
      subscriptions: createQueryChain({ data: null, error: null }),
    });
    mockCheckoutCreate.mockResolvedValueOnce({
      url: "https://checkout.stripe.com/c/pay/cs_test_new",
    });

    const result = await createCheckoutSessionAction("frontline");

    expect(result.success).toBe(true);
    const params = mockCheckoutCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(params).toMatchObject({
      customer_email: USER.email,
      tax_id_collection: { enabled: true, required: "if_supported" },
    });
    expect(params).not.toHaveProperty("customer");
    expect(params).not.toHaveProperty("customer_update");
  });
});
