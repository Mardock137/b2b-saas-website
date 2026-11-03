import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type Company = {
  id: string;
  company_name: string;
  tax_id: string;
  stripe_customer_id: string | null;
};

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export type ProductStatus = "available" | "coming_soon" | "archived";

export type SubscriptionWithProduct = {
  status: SubscriptionStatus;
  current_period_end: string | null;
  product: {
    slug: string;
    name: string;
    description: string;
    web_app_url: string;
    status: ProductStatus;
  };
};

export const getCurrentCompany = cache(async function getCurrentCompany(): Promise<{
  user: User;
  company: Company;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, company_name, tax_id, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentCompany] Failed to load company:", error);
    return null;
  }

  if (!company) return null;

  return { user, company };
});

export async function getSubscriptionsForCompany(
  companyId: string,
): Promise<SubscriptionWithProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "status, current_period_end, products(slug, name, description, web_app_url, status)",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "[getSubscriptionsForCompany] Failed to load subscriptions:",
      error,
    );
    return [];
  }

  // Supabase types the joined relation as an array even on a single FK; we
  // normalise it to a single object since `product_id` is a one-to-one FK.
  return (data ?? [])
    .map((row) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      if (!product) return null;
      return {
        status: row.status as SubscriptionStatus,
        current_period_end: row.current_period_end,
        product: {
          slug: product.slug,
          name: product.name,
          description: product.description,
          web_app_url: product.web_app_url,
          status: product.status as ProductStatus,
        },
      } satisfies SubscriptionWithProduct;
    })
    .filter((row): row is SubscriptionWithProduct => row !== null);
}
