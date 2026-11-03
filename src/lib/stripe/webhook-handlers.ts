import "server-only";

import type Stripe from "stripe";

import { sendTaxIdReviewAlert } from "@/lib/resend/alerts";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";

type DbSubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete";

/**
 * Maps a real Stripe Subscription status onto the 4 values accepted by
 * the `website.subscriptions.status` CHECK constraint. This site does not
 * use trial periods or subscription pausing today, so those Stripe
 * statuses are folded into the closest existing DB status rather than
 * expanding the schema.
 */
export function mapStripeStatusToDbStatus(
  status: Stripe.Subscription.Status,
): DbSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return "incomplete";
    default:
      return "incomplete";
  }
}

/**
 * checkout.session.completed
 *
 * Fired once after a successful payment. Creates or updates the subscription
 * row using upsert (idempotent — Stripe may deliver the same event more than once).
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const companyId = session.metadata?.company_id;
  const productId = session.metadata?.product_id;

  if (!companyId || !productId) {
    console.error(
      "[webhook] checkout.session.completed: missing metadata",
      { companyId, productId, sessionId: session.id },
    );
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const stripe = getStripeServerClient();

  // Retrieve the full subscription to get the billing period end date.
  // Since Stripe API 2026-04-22.dahlia (Basil), current_period_end was removed
  // from the Subscription root and moved to each SubscriptionItem.
  // For single-item subscriptions we read items.data[0].current_period_end.
  let currentPeriodEnd: string | null = null;
  let subscriptionStatus: DbSubscriptionStatus = "incomplete"; // conservative default if retrieve fails
  if (stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      subscriptionStatus = mapStripeStatusToDbStatus(stripeSub.status);
      const periodEndTs = stripeSub.items?.data?.[0]?.current_period_end;
      if (typeof periodEndTs === "number" && isFinite(periodEndTs)) {
        currentPeriodEnd = new Date(periodEndTs * 1000).toISOString();
      }
    } catch (err) {
      console.error(
        "[webhook] checkout.session.completed: failed to retrieve subscription",
        err,
      );
    }
  }

  const supabase = createAdminClient();

  const { data: existingRow, error: existingRowError } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("company_id", companyId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingRowError) {
    console.error(
      "[webhook] checkout.session.completed: failed to check existing subscription",
      existingRowError,
    );
  }

  const previousSubscriptionId = existingRow?.stripe_subscription_id;

  if (
    previousSubscriptionId &&
    stripeSubscriptionId &&
    previousSubscriptionId !== stripeSubscriptionId
  ) {
    try {
      await stripe.subscriptions.cancel(previousSubscriptionId);
    } catch (err) {
      // Non-fatal: the previous subscription may already be canceled or gone.
      console.error(
        "[webhook] checkout.session.completed: failed to cancel superseded subscription",
        { previousSubscriptionId, err },
      );
    }
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      company_id: companyId,
      product_id: productId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      status: subscriptionStatus,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "company_id,product_id" },
  );

  if (error) {
    console.error(
      "[webhook] checkout.session.completed: upsert failed",
      error,
    );
    throw new Error(`Failed to upsert subscription for company ${companyId}: ${error.message}`);
  }

  // First purchase for this company: persist the Customer so subsequent
  // checkouts reuse it instead of letting Stripe create a new one.
  if (stripeCustomerId) {
    const { error: companyError } = await supabase
      .from("companies")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", companyId)
      .is("stripe_customer_id", null);

    if (companyError) {
      console.error(
        "[webhook] checkout.session.completed: failed to persist stripe_customer_id on companies",
        companyError,
      );
    }
  }
}

/**
 * customer.subscription.updated
 *
 * Fired on every subscription change (renewal, status change, plan change, etc.).
 * Updates status and billing period end.
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  // Since Stripe API 2026-04-22.dahlia, current_period_end is on the item level.
  const periodEndTs = subscription.items?.data?.[0]?.current_period_end;
  const currentPeriodEnd =
    typeof periodEndTs === "number" && isFinite(periodEndTs)
      ? new Date(periodEndTs * 1000).toISOString()
      : null;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: mapStripeStatusToDbStatus(subscription.status),
      current_period_end: currentPeriodEnd,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error(
      "[webhook] customer.subscription.updated: update failed",
      error,
    );
    throw new Error(`Failed to update subscription ${subscription.id}: ${error.message}`);
  }
}

/**
 * customer.subscription.deleted
 *
 * Fired when a subscription is permanently canceled.
 * Marks the row as canceled without deleting it (audit trail).
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error(
      "[webhook] customer.subscription.deleted: update failed",
      error,
    );
    throw new Error(`Failed to mark subscription ${subscription.id} as canceled: ${error.message}`);
  }
}

type TaxIdReviewReason = "stripe_unverified" | "stripe_unavailable";

function readStripeCustomerId(taxId: Stripe.TaxId): string | null {
  const ownerCustomer = taxId.owner?.customer;
  if (typeof ownerCustomer === "string" && ownerCustomer) {
    return ownerCustomer;
  }
  if (
    ownerCustomer &&
    typeof ownerCustomer === "object" &&
    "id" in ownerCustomer &&
    ownerCustomer.id
  ) {
    return ownerCustomer.id;
  }

  const customer = taxId.customer;
  if (typeof customer === "string" && customer) {
    return customer;
  }
  if (customer && typeof customer === "object" && "id" in customer && customer.id) {
    return customer.id;
  }

  return null;
}

/**
 * customer.tax_id.created / customer.tax_id.updated
 *
 * pending is ignored. verified clears a previous review flag.
 * unverified and unavailable flag the company once and email the operator.
 * If the company row is not linked yet, throw so Stripe retries.
 */
export async function handleTaxIdChanged(taxId: Stripe.TaxId): Promise<void> {
  const status = taxId.verification?.status;
  if (!status || status === "pending") {
    return;
  }

  const stripeCustomerId = readStripeCustomerId(taxId);
  if (!stripeCustomerId) {
    throw new Error(
      `[webhook] customer.tax_id.*: missing customer on tax id ${taxId.id}`,
    );
  }

  const supabase = createAdminClient();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, company_name, tax_id_needs_review")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (companyError) {
    console.error(
      "[webhook] customer.tax_id.*: company lookup failed",
      companyError,
    );
    throw new Error(
      `Failed to look up company for Stripe customer ${stripeCustomerId}`,
    );
  }

  if (!company) {
    throw new Error(
      `[webhook] customer.tax_id.*: no company for Stripe customer ${stripeCustomerId}`,
    );
  }

  if (status === "verified") {
    const { error } = await supabase
      .from("companies")
      .update({
        tax_id_needs_review: false,
        tax_id_review_reason: null,
        tax_id_review_flagged_at: null,
      })
      .eq("id", company.id)
      .eq("tax_id_needs_review", true);

    if (error) {
      console.error(
        "[webhook] customer.tax_id.*: failed to clear review flag",
        error,
      );
      throw new Error(
        `Failed to clear tax ID review flag for company ${company.id}`,
      );
    }
    return;
  }

  const reason: TaxIdReviewReason =
    status === "unverified" ? "stripe_unverified" : "stripe_unavailable";

  const { data: flagged, error: flagError } = await supabase
    .from("companies")
    .update({
      tax_id_needs_review: true,
      tax_id_review_reason: reason,
      tax_id_review_flagged_at: new Date().toISOString(),
    })
    .eq("id", company.id)
    .eq("tax_id_needs_review", false)
    .select("id");

  if (flagError) {
    console.error(
      "[webhook] customer.tax_id.*: failed to set review flag",
      flagError,
    );
    throw new Error(
      `Failed to flag company ${company.id} for tax ID review`,
    );
  }

  if (!flagged || flagged.length === 0) {
    return;
  }

  console.log("[webhook] customer.tax_id.*: company flagged for review", {
    companyId: company.id,
    stripeCustomerId,
    taxIdType: taxId.type,
    verificationStatus: status,
  });

  try {
    await sendTaxIdReviewAlert({
      companyName: company.company_name,
      companyId: company.id,
      stripeCustomerId,
      taxIdType: taxId.type,
      taxIdValue: taxId.value,
      verificationStatus: status === "unverified" ? "unverified" : "unavailable",
    });
  } catch (err) {
    console.error(
      "[webhook] customer.tax_id.*: review alert failed",
      err,
    );
  }
}
