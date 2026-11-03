import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "[stripe/server] STRIPE_SECRET_KEY is not set. Add it to your .env file.",
    );
  }

  stripeClient = new Stripe(secretKey, {
    // Intentionally pinned to an older "dahlia" snapshot (see docs/stripe.md);
    // the installed SDK only types the latest snapshot.
    // @ts-expect-error - pinned apiVersion is older than the SDK's typed snapshot
    apiVersion: "2026-04-22.dahlia",
  });

  return stripeClient;
}
