"use server";

import Stripe from "stripe";

import { getCurrentCompany } from "@/lib/dashboard/queries";
import { getRequestOrigin } from "@/lib/http/request-origin";
import { getStripeServerClient } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export type CheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function createCheckoutSessionAction(
  productSlug: string,
): Promise<CheckoutResult> {
  // 1. Verify the user is authenticated.
  const auth = await getCurrentCompany();
  if (!auth) {
    return { success: false, error: "Please sign in to subscribe." };
  }
  const { user, company } = auth;

  // 2. Load the product by slug.
  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, slug, name, status, stripe_price_id")
    .eq("slug", productSlug)
    .maybeSingle();

  if (productError) {
    console.error("[createCheckoutSessionAction] Product query error:", productError);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  if (product.status !== "available") {
    return { success: false, error: "This product is not available for purchase." };
  }

  if (!product.stripe_price_id) {
    console.error(
      `[createCheckoutSessionAction] stripe_price_id is null for product "${productSlug}"`,
    );
    return { success: false, error: "This product is not ready for purchase yet." };
  }

  // 3. Check for an existing subscription that must not be duplicated.
  const { data: existing, error: subError } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("company_id", company.id)
    .eq("product_id", product.id)
    .in("status", ["active", "past_due", "incomplete"])
    .maybeSingle();

  if (subError) {
    console.error(
      "[createCheckoutSessionAction] Subscription check error:",
      subError,
    );
    return { success: false, error: "Something went wrong. Please try again." };
  }

  if (existing) {
    return {
      success: false,
      error:
        existing.status === "incomplete"
          ? "You already have a pending subscription for this product. Check your email for a payment link, or contact support if you need help."
          : "You are already subscribed to this product.",
    };
  }

  // 4. Build the origin for success/cancel URLs.
  const origin = getRequestOrigin();

  // 5. Create the Stripe Checkout Session.
  try {
    const stripe = getStripeServerClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      tax_id_collection: { enabled: true, required: "if_supported" },
      ...(company.stripe_customer_id
        ? {
            customer: company.stripe_customer_id,
            customer_update: { name: "auto" as const },
          }
        : { customer_email: user.email }),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(product.slug)}`,
      cancel_url: `${origin}/checkout/cancel`,
      client_reference_id: company.id,
      allow_promotion_codes: true,
      metadata: {
        company_id: company.id,
        product_id: product.id,
        product_slug: product.slug,
      },
      subscription_data: {
        metadata: {
          company_id: company.id,
          product_id: product.id,
        },
      },
    });

    if (!session.url) {
      console.error(
        "[createCheckoutSessionAction] Stripe session created but URL is null",
      );
      return { success: false, error: "Something went wrong. Please try again." };
    }

    return { success: true, url: session.url };
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error(
        "[createCheckoutSessionAction] Stripe error:",
        err.message,
      );
    } else {
      console.error("[createCheckoutSessionAction] Unexpected error:", err);
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
