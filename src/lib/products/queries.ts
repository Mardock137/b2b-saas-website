import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/dashboard/queries";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthly_price_cents: number;
  currency: string;
  web_app_url: string;
  status: ProductStatus;
  stripe_price_id: string | null;
};

/**
 * Returns catalog products excluding archived ones, ordered by creation date.
 * Archived products stay hidden from the public catalog; authenticated
 * companies can still resolve them via the subscriptions join in the dashboard.
 */
export async function getAvailableProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, monthly_price_cents, currency, web_app_url, status, stripe_price_id",
    )
    .neq("status", "archived")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getAvailableProducts] Failed to load products:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    monthly_price_cents: row.monthly_price_cents,
    currency: row.currency,
    web_app_url: row.web_app_url,
    status: row.status as ProductStatus,
    stripe_price_id: row.stripe_price_id ?? null,
  }));
}

/**
 * Returns the display name of a product by its slug, or null if not found.
 */
export async function getProductNameBySlug(
  slug: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getProductNameBySlug] Failed to load product:", error);
    return null;
  }

  return data?.name ?? null;
}

/**
 * Returns the slugs of products the company is actively subscribed to
 * (status = 'active' or 'past_due'). Used to detect already-subscribed products.
 */
export async function getUserActiveSubscriptionSlugs(
  companyId: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("products(slug)")
    .eq("company_id", companyId)
    .in("status", ["active", "past_due"]);

  if (error) {
    console.error(
      "[getUserActiveSubscriptionSlugs] Failed to load subscriptions:",
      error,
    );
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const product = Array.isArray(row.products)
        ? row.products[0]
        : row.products;
      return product?.slug ?? null;
    })
    .filter((slug): slug is string => slug !== null);
}
