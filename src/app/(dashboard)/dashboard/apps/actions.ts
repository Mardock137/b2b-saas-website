"use server";

import {
  getCurrentCompany,
  getSubscriptionsForCompany,
} from "@/lib/dashboard/queries";
import { buildSsoOpenUrl, generateSsoToken } from "@/lib/sso/token";

export type OpenProductAppResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function openProductAppAction(
  productSlug: string,
): Promise<OpenProductAppResult> {
  const auth = await getCurrentCompany();
  if (!auth) {
    return { success: false, error: "Please sign in to open the app." };
  }

  const subscriptions = await getSubscriptionsForCompany(auth.company.id);
  const subscription = subscriptions.find(
    (item) => item.product.slug === productSlug,
  );

  if (!subscription || subscription.status !== "active") {
    return {
      success: false,
      error: "This app is not active.",
    };
  }

  try {
    const token = await generateSsoToken(
      {
        id: auth.company.id,
        company_name: auth.company.company_name,
      },
      subscription.product.slug,
    );
    const url = buildSsoOpenUrl(subscription.product.web_app_url, token);
    return { success: true, url };
  } catch (error) {
    console.error("[openProductAppAction] Failed to generate SSO token:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
