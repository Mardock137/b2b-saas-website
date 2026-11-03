"use server";

import Stripe from "stripe";

import { getCurrentCompany } from "@/lib/dashboard/queries";
import { getRequestOrigin } from "@/lib/http/request-origin";
import { getStripeServerClient } from "@/lib/stripe/server";

export type BillingPortalResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function createBillingPortalSessionAction(): Promise<BillingPortalResult> {
  // 1. Verify the user is authenticated.
  const auth = await getCurrentCompany();
  if (!auth) {
    return { success: false, error: "Please sign in to manage your billing." };
  }

  // 2. Look up the Stripe Customer ID already loaded with the company.
  const stripeCustomerId = auth.company.stripe_customer_id;
  if (!stripeCustomerId) {
    return {
      success: false,
      error: "You don't have an active subscription to manage.",
    };
  }

  // 3. Build the return URL.
  const origin = getRequestOrigin();
  const returnUrl = `${origin}/dashboard`;

  // 4. Create the Billing Portal Session.
  try {
    const stripe = getStripeServerClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { success: true, url: session.url };
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error(
        "[createBillingPortalSessionAction] Stripe error:",
        err.message,
      );
    } else {
      console.error(
        "[createBillingPortalSessionAction] Unexpected error:",
        err,
      );
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
