import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe/server", () => ({
  getStripeServerClient: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

const mockHandleCheckoutSessionCompleted = vi.fn();
const mockHandleSubscriptionUpdated = vi.fn();
const mockHandleSubscriptionDeleted = vi.fn();
const mockHandleTaxIdChanged = vi.fn();
vi.mock("@/lib/stripe/webhook-handlers", () => ({
  handleCheckoutSessionCompleted: (...a: unknown[]) =>
    mockHandleCheckoutSessionCompleted(...a),
  handleSubscriptionUpdated: (...a: unknown[]) =>
    mockHandleSubscriptionUpdated(...a),
  handleSubscriptionDeleted: (...a: unknown[]) =>
    mockHandleSubscriptionDeleted(...a),
  handleTaxIdChanged: (...a: unknown[]) => mockHandleTaxIdChanged(...a),
}));

const { POST } = await import("@/app/api/stripe/webhook/route");

function makeRequest(
  opts: { signature?: string | null; body?: string } = {},
): NextRequest {
  const { signature = "sig_test", body = "{}" } = opts;
  return {
    headers: {
      get: (name: string) => (name === "stripe-signature" ? signature : null),
    },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  } as unknown as NextRequest;
}

function makeEvent(type: string, object: Record<string, unknown> = {}) {
  return { type, data: { object } };
}

describe("POST /api/stripe/webhook", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("returns 500 and does not verify the signature when STRIPE_WEBHOOK_SECRET is unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    expect(mockConstructEvent).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns 400 when the stripe-signature header is missing", async () => {
    const response = await POST(makeRequest({ signature: null }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Missing stripe-signature header." });
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when constructEvent throws because the signature is invalid", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Webhook signature verification failed");
    expect(body.error).toContain("Invalid signature");
    consoleSpy.mockRestore();
  });

  it("ignores unhandled event types and still returns 200", async () => {
    mockConstructEvent.mockReturnValueOnce(makeEvent("invoice.paid"));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mockHandleCheckoutSessionCompleted).not.toHaveBeenCalled();
    expect(mockHandleSubscriptionUpdated).not.toHaveBeenCalled();
    expect(mockHandleSubscriptionDeleted).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("dispatches checkout.session.completed to its handler", async () => {
    const session = { id: "cs_test_123" };
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("checkout.session.completed", session),
    );
    mockHandleCheckoutSessionCompleted.mockResolvedValueOnce(undefined);

    const response = await POST(makeRequest());

    expect(mockHandleCheckoutSessionCompleted).toHaveBeenCalledWith(session);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });

  it("dispatches customer.subscription.updated to its handler", async () => {
    const subscription = { id: "sub_test_123" };
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("customer.subscription.updated", subscription),
    );
    mockHandleSubscriptionUpdated.mockResolvedValueOnce(undefined);

    const response = await POST(makeRequest());

    expect(mockHandleSubscriptionUpdated).toHaveBeenCalledWith(subscription);
    expect(response.status).toBe(200);
  });

  it("dispatches customer.subscription.deleted to its handler", async () => {
    const subscription = { id: "sub_test_456" };
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("customer.subscription.deleted", subscription),
    );
    mockHandleSubscriptionDeleted.mockResolvedValueOnce(undefined);

    const response = await POST(makeRequest());

    expect(mockHandleSubscriptionDeleted).toHaveBeenCalledWith(subscription);
    expect(response.status).toBe(200);
  });

  it("dispatches customer.tax_id.created and customer.tax_id.updated", async () => {
    const created = { id: "txi_created" };
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("customer.tax_id.created", created),
    );
    mockHandleTaxIdChanged.mockResolvedValueOnce(undefined);

    const createdResponse = await POST(makeRequest());

    expect(mockHandleTaxIdChanged).toHaveBeenCalledWith(created);
    expect(createdResponse.status).toBe(200);

    const updated = { id: "txi_updated" };
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("customer.tax_id.updated", updated),
    );
    mockHandleTaxIdChanged.mockResolvedValueOnce(undefined);

    const updatedResponse = await POST(makeRequest());

    expect(mockHandleTaxIdChanged).toHaveBeenCalledWith(updated);
    expect(updatedResponse.status).toBe(200);
  });

  it("returns 500 when the tax ID handler throws, so Stripe retries", async () => {
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("customer.tax_id.updated", { id: "txi_fail" }),
    );
    mockHandleTaxIdChanged.mockRejectedValueOnce(new Error("company missing"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal handler error." });
    consoleSpy.mockRestore();
  });

  it("returns 500 when a handler throws, so Stripe retries the webhook", async () => {
    mockConstructEvent.mockReturnValueOnce(
      makeEvent("checkout.session.completed", { id: "cs_test_fail" }),
    );
    mockHandleCheckoutSessionCompleted.mockRejectedValueOnce(
      new Error("DB down"),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal handler error." });
    consoleSpy.mockRestore();
  });
});
