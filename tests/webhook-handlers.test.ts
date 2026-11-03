import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("server-only", () => ({}));

type QueryResult = { data: unknown; error: unknown };

function createThenableChain(result: QueryResult = { data: null, error: null }) {
  const resolved: QueryResult = {
    data: result.data ?? null,
    error: result.error ?? null,
  };

  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    then(
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(resolved).then(onFulfilled, onRejected);
    },
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(resolved);
  chain.upsert.mockResolvedValue(resolved);

  return chain;
}

const mockSendTaxIdReviewAlert = vi.fn();
vi.mock("@/lib/resend/alerts", () => ({
  sendTaxIdReviewAlert: (...args: unknown[]) => mockSendTaxIdReviewAlert(...args),
}));

const mockFrom = vi.fn();
const mockCreateAdminClient = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));

const mockRetrieve = vi.fn();
const mockCancel = vi.fn();
const mockGetStripeServerClient = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  getStripeServerClient: (...args: unknown[]) =>
    mockGetStripeServerClient(...args),
}));

const {
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleTaxIdChanged,
} = await import("@/lib/stripe/webhook-handlers");

const COMPANY_ID = "company-uuid-123";
const PRODUCT_ID = "product-uuid-frontline";
const NEW_SUB_ID = "sub_new_123";
const OLD_SUB_ID = "sub_old_456";
const CUSTOMER_ID = "cus_123";
const PERIOD_END_TS = 1_780_000_000;
const PERIOD_END_ISO = new Date(PERIOD_END_TS * 1000).toISOString();

function makeCheckoutSession(
  overrides: Partial<{
    metadata: Record<string, string> | null;
    subscription: string | null;
    customer: string | null;
  }> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    metadata:
      overrides.metadata === undefined
        ? { company_id: COMPANY_ID, product_id: PRODUCT_ID }
        : overrides.metadata,
    subscription:
      overrides.subscription === undefined ? NEW_SUB_ID : overrides.subscription,
    customer: overrides.customer === undefined ? CUSTOMER_ID : overrides.customer,
  } as unknown as Stripe.Checkout.Session;
}

function asSubscription(
  subscription: Record<string, unknown>,
): Stripe.Subscription {
  return subscription as unknown as Stripe.Subscription;
}

describe("handleCheckoutSessionCompleted", () => {
  let subscriptionsChain: ReturnType<typeof createThenableChain>;
  let companiesChain: ReturnType<typeof createThenableChain>;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionsChain = createThenableChain();
    companiesChain = createThenableChain();
    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return companiesChain;
      return subscriptionsChain;
    });
    mockCreateAdminClient.mockReturnValue({ from: mockFrom });
    mockGetStripeServerClient.mockReturnValue({
      subscriptions: {
        retrieve: mockRetrieve,
        cancel: mockCancel,
      },
    });
    mockRetrieve.mockResolvedValue({
      status: "active",
      items: { data: [{ current_period_end: PERIOD_END_TS }] },
    });
    mockCancel.mockResolvedValue({});
  });

  it("logs and returns when company_id or product_id metadata is missing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handleCheckoutSessionCompleted(
      makeCheckoutSession({ metadata: { company_id: COMPANY_ID } }),
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[webhook] checkout.session.completed: missing metadata",
      expect.objectContaining({ companyId: COMPANY_ID, productId: undefined }),
    );
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockGetStripeServerClient).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("upserts the subscription and does not cancel when none existed before", async () => {
    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(mockCancel).not.toHaveBeenCalled();
    expect(subscriptionsChain.upsert).toHaveBeenCalledWith(
      {
        company_id: COMPANY_ID,
        product_id: PRODUCT_ID,
        stripe_subscription_id: NEW_SUB_ID,
        stripe_customer_id: CUSTOMER_ID,
        status: "active",
        current_period_end: PERIOD_END_ISO,
      },
      { onConflict: "company_id,product_id" },
    );
  });

  it("maps non-DB Stripe subscription statuses onto the closest existing DB status", async () => {
    mockRetrieve.mockResolvedValueOnce({
      status: "trialing",
      items: { data: [{ current_period_end: PERIOD_END_TS }] },
    });

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(subscriptionsChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
      { onConflict: "company_id,product_id" },
    );
  });

  it("defaults to 'incomplete' status when the Stripe retrieve call fails", async () => {
    mockRetrieve.mockRejectedValueOnce(new Error("network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(subscriptionsChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "incomplete" }),
      { onConflict: "company_id,product_id" },
    );
    consoleSpy.mockRestore();
  });

  it("cancels the previous Stripe subscription before upserting a new one", async () => {
    subscriptionsChain.maybeSingle.mockResolvedValueOnce({
      data: { stripe_subscription_id: OLD_SUB_ID },
      error: null,
    });
    const order: string[] = [];
    mockCancel.mockImplementation(async () => {
      order.push("cancel");
    });
    subscriptionsChain.upsert.mockImplementation(async () => {
      order.push("upsert");
      return { data: null, error: null };
    });

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(mockCancel).toHaveBeenCalledWith(OLD_SUB_ID);
    expect(subscriptionsChain.upsert).toHaveBeenCalled();
    expect(order).toEqual(["cancel", "upsert"]);
  });

  it("does not cancel when the Stripe subscription id is unchanged", async () => {
    subscriptionsChain.maybeSingle.mockResolvedValueOnce({
      data: { stripe_subscription_id: NEW_SUB_ID },
      error: null,
    });

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(mockCancel).not.toHaveBeenCalled();
    expect(subscriptionsChain.upsert).toHaveBeenCalled();
  });

  it("still upserts when canceling the previous subscription fails", async () => {
    subscriptionsChain.maybeSingle.mockResolvedValueOnce({
      data: { stripe_subscription_id: OLD_SUB_ID },
      error: null,
    });
    mockCancel.mockRejectedValueOnce(new Error("already canceled"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(mockCancel).toHaveBeenCalledWith(OLD_SUB_ID);
    expect(subscriptionsChain.upsert).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[webhook] checkout.session.completed: failed to cancel superseded subscription",
      expect.objectContaining({ previousSubscriptionId: OLD_SUB_ID }),
    );
    consoleSpy.mockRestore();
  });

  it("persists stripe_customer_id on companies when it is still null", async () => {
    await handleCheckoutSessionCompleted(makeCheckoutSession());

    expect(mockFrom).toHaveBeenCalledWith("companies");
    expect(companiesChain.update).toHaveBeenCalledWith({
      stripe_customer_id: CUSTOMER_ID,
    });
    expect(companiesChain.eq).toHaveBeenCalledWith("id", COMPANY_ID);
    expect(companiesChain.is).toHaveBeenCalledWith("stripe_customer_id", null);
  });

  it("throws when the subscriptions upsert fails, so Stripe retries the webhook", async () => {
    subscriptionsChain.upsert.mockResolvedValueOnce({
      data: null,
      error: { message: "upsert failed" },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(handleCheckoutSessionCompleted(makeCheckoutSession())).rejects.toThrow();

    consoleSpy.mockRestore();
  });
});

describe("handleSubscriptionUpdated", () => {
  let subscriptionsChain: ReturnType<typeof createThenableChain>;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionsChain = createThenableChain();
    mockFrom.mockReturnValue(subscriptionsChain);
    mockCreateAdminClient.mockReturnValue({ from: mockFrom });
  });

  it("updates status and current_period_end for the matching Stripe subscription", async () => {
    await handleSubscriptionUpdated(
      asSubscription({
        id: NEW_SUB_ID,
        status: "past_due",
        items: { data: [{ current_period_end: PERIOD_END_TS }] },
      }),
    );

    expect(subscriptionsChain.update).toHaveBeenCalledWith({
      status: "past_due",
      current_period_end: PERIOD_END_ISO,
    });
    expect(subscriptionsChain.eq).toHaveBeenCalledWith(
      "stripe_subscription_id",
      NEW_SUB_ID,
    );
  });

  it("maps a non-DB Stripe status (e.g. 'unpaid') onto 'past_due' before writing to the DB", async () => {
    await handleSubscriptionUpdated(
      asSubscription({
        id: NEW_SUB_ID,
        status: "unpaid",
        items: { data: [{ current_period_end: PERIOD_END_TS }] },
      }),
    );

    expect(subscriptionsChain.update).toHaveBeenCalledWith({
      status: "past_due",
      current_period_end: PERIOD_END_ISO,
    });
  });

  it("logs Supabase errors and rethrows so Stripe retries the webhook", async () => {
    subscriptionsChain = createThenableChain({
      data: null,
      error: { message: "update failed" },
    });
    mockFrom.mockReturnValue(subscriptionsChain);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      handleSubscriptionUpdated(
        asSubscription({ id: NEW_SUB_ID, status: "active", items: { data: [] } }),
      ),
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[webhook] customer.subscription.updated: update failed",
      { message: "update failed" },
    );
    consoleSpy.mockRestore();
  });
});

describe("handleSubscriptionDeleted", () => {
  let subscriptionsChain: ReturnType<typeof createThenableChain>;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionsChain = createThenableChain();
    mockFrom.mockReturnValue(subscriptionsChain);
    mockCreateAdminClient.mockReturnValue({ from: mockFrom });
  });

  it("marks the matching Stripe subscription as canceled", async () => {
    await handleSubscriptionDeleted(asSubscription({ id: NEW_SUB_ID }));

    expect(subscriptionsChain.update).toHaveBeenCalledWith({
      status: "canceled",
    });
    expect(subscriptionsChain.eq).toHaveBeenCalledWith(
      "stripe_subscription_id",
      NEW_SUB_ID,
    );
  });

  it("logs Supabase errors and rethrows so Stripe retries the webhook", async () => {
    subscriptionsChain = createThenableChain({
      data: null,
      error: { message: "update failed" },
    });
    mockFrom.mockReturnValue(subscriptionsChain);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      handleSubscriptionDeleted(asSubscription({ id: NEW_SUB_ID })),
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[webhook] customer.subscription.deleted: update failed",
      { message: "update failed" },
    );
    consoleSpy.mockRestore();
  });
});

function makeTaxId(options: {
  status: string;
  ownerCustomer?: string | { id: string } | null;
  customer?: string | { id: string } | null;
}): Stripe.TaxId {
  const owner =
    options.ownerCustomer === undefined
      ? {
          customer: CUSTOMER_ID,
          customer_account: null,
          type: "customer" as const,
        }
      : options.ownerCustomer === null
        ? null
        : {
            customer: options.ownerCustomer,
            customer_account: null,
            type: "customer" as const,
          };

  return {
    id: "txi_123",
    object: "tax_id",
    type: "eu_vat",
    value: "IT12345678901",
    verification: {
      status: options.status,
      verified_address: null,
      verified_name: null,
    },
    owner,
    customer: options.customer === undefined ? null : options.customer,
  } as unknown as Stripe.TaxId;
}

describe("handleTaxIdChanged", () => {
  let companiesChain: ReturnType<typeof createThenableChain>;

  beforeEach(() => {
    vi.clearAllMocks();
    companiesChain = createThenableChain();
    mockFrom.mockImplementation(() => companiesChain);
    mockCreateAdminClient.mockReturnValue({ from: mockFrom });
    mockSendTaxIdReviewAlert.mockResolvedValue(undefined);
  });

  function mockCompany(
    company: Record<string, unknown> | null,
    error: unknown = null,
  ) {
    companiesChain.maybeSingle.mockResolvedValueOnce({
      data: company,
      error,
    });
  }

  function mockFlagWrite(result: { data: unknown; error: unknown }) {
    const select = vi.fn().mockResolvedValue(result);
    const secondEq = vi.fn().mockReturnValue({ select });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    companiesChain.update.mockReturnValueOnce({ eq: firstEq });
  }

  it("ignores a pending verification and does not touch the database", async () => {
    await handleTaxIdChanged(makeTaxId({ status: "pending" }));

    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockSendTaxIdReviewAlert).not.toHaveBeenCalled();
  });

  it("clears the review flag when Stripe verifies the tax ID", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: true,
    });

    await handleTaxIdChanged(makeTaxId({ status: "verified" }));

    expect(companiesChain.update).toHaveBeenCalledWith({
      tax_id_needs_review: false,
      tax_id_review_reason: null,
      tax_id_review_flagged_at: null,
    });
    expect(companiesChain.eq).toHaveBeenCalledWith("tax_id_needs_review", true);
    expect(mockSendTaxIdReviewAlert).not.toHaveBeenCalled();
  });

  it("flags an unverified tax ID and sends one alert", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: false,
    });
    mockFlagWrite({ data: [{ id: COMPANY_ID }], error: null });

    await handleTaxIdChanged(makeTaxId({ status: "unverified" }));

    expect(companiesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_id_needs_review: true,
        tax_id_review_reason: "stripe_unverified",
      }),
    );
    expect(mockSendTaxIdReviewAlert).toHaveBeenCalledOnce();
    expect(mockSendTaxIdReviewAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: COMPANY_ID,
        stripeCustomerId: CUSTOMER_ID,
        taxIdType: "eu_vat",
        taxIdValue: "IT12345678901",
        verificationStatus: "unverified",
      }),
    );
  });

  it("flags an unavailable tax ID", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: false,
    });
    mockFlagWrite({ data: [{ id: COMPANY_ID }], error: null });

    await handleTaxIdChanged(makeTaxId({ status: "unavailable" }));

    expect(companiesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_id_review_reason: "stripe_unavailable",
      }),
    );
    expect(mockSendTaxIdReviewAlert).toHaveBeenCalledWith(
      expect.objectContaining({ verificationStatus: "unavailable" }),
    );
  });

  it("does not send a second email when the company is already flagged", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: true,
    });
    mockFlagWrite({ data: [], error: null });

    await handleTaxIdChanged(makeTaxId({ status: "unverified" }));

    expect(mockSendTaxIdReviewAlert).not.toHaveBeenCalled();
  });

  it("throws when no company is linked to the Stripe customer", async () => {
    mockCompany(null);

    await expect(
      handleTaxIdChanged(makeTaxId({ status: "unverified" })),
    ).rejects.toThrow(/no company/);
    expect(mockSendTaxIdReviewAlert).not.toHaveBeenCalled();
  });

  it("throws when the database update fails", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: false,
    });
    mockFlagWrite({ data: null, error: { message: "update failed" } });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      handleTaxIdChanged(makeTaxId({ status: "unverified" })),
    ).rejects.toThrow(/tax ID review/);

    expect(mockSendTaxIdReviewAlert).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("does not throw when the review email fails", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: false,
    });
    mockFlagWrite({ data: [{ id: COMPANY_ID }], error: null });
    mockSendTaxIdReviewAlert.mockRejectedValueOnce(new Error("resend down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      handleTaxIdChanged(makeTaxId({ status: "unverified" })),
    ).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("reads the customer id from owner.customer or from customer", async () => {
    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: false,
    });
    mockFlagWrite({ data: [{ id: COMPANY_ID }], error: null });

    await handleTaxIdChanged(
      makeTaxId({
        status: "unverified",
        ownerCustomer: { id: "cus_from_owner" },
      }),
    );

    expect(mockSendTaxIdReviewAlert).toHaveBeenCalledWith(
      expect.objectContaining({ stripeCustomerId: "cus_from_owner" }),
    );

    mockCompany({
      id: COMPANY_ID,
      company_name: "Acme SRL",
      tax_id_needs_review: false,
    });
    mockFlagWrite({ data: [{ id: COMPANY_ID }], error: null });

    await handleTaxIdChanged(
      makeTaxId({
        status: "unverified",
        ownerCustomer: null,
        customer: "cus_from_field",
      }),
    );

    expect(mockSendTaxIdReviewAlert).toHaveBeenLastCalledWith(
      expect.objectContaining({ stripeCustomerId: "cus_from_field" }),
    );
  });
});
