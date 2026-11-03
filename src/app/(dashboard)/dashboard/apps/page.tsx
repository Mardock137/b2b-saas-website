import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NoAppsEmptyState } from "@/components/dashboard/NoAppsEmptyState";
import { OpenAppButton } from "@/components/dashboard/OpenAppButton";
import { SubscriptionStatusBadge } from "@/components/dashboard/SubscriptionStatusBadge";
import { Button } from "@/components/ui/button";
import {
  MotionItem,
  MotionStagger,
} from "@/components/ui/spotlight-card";
import { DASHBOARD_DATE_FORMATTER } from "@/lib/dashboard/date-formatter";
import {
  getCurrentCompany,
  getSubscriptionsForCompany,
  type SubscriptionStatus,
  type SubscriptionWithProduct,
} from "@/lib/dashboard/queries";

export const metadata: Metadata = {
  title: "My Apps — Acme Labs",
  description: "Manage your apps.",
};

function formatPeriodLabel(
  status: SubscriptionStatus,
  currentPeriodEnd: string | null,
): string | null {
  if (!currentPeriodEnd) return null;
  const date = DASHBOARD_DATE_FORMATTER.format(new Date(currentPeriodEnd));

  switch (status) {
    case "active":
      return `Renews on ${date}`;
    case "past_due":
      return `Payment due since ${date}`;
    case "canceled":
      return `Expired on ${date}`;
    case "incomplete":
      return `Action needed by ${date}`;
  }
}

export default async function AppsPage() {
  const result = await getCurrentCompany();

  if (!result) {
    redirect("/auth/login");
  }

  const { company } = result;
  const subscriptions = await getSubscriptionsForCompany(company.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          My Apps
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Manage your apps.
        </p>
      </header>

      <section className="mt-12">
        {subscriptions.length === 0 ? (
          <NoAppsEmptyState />
        ) : (
          <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.product.slug}
                subscription={subscription}
              />
            ))}
          </MotionStagger>
        )}
      </section>
    </div>
  );
}

function SubscriptionCard({
  subscription,
}: {
  subscription: SubscriptionWithProduct;
}) {
  const { product, status, current_period_end } = subscription;
  const periodLabel = formatPeriodLabel(status, current_period_end);
  const canOpenApp = status === "active";

  return (
    <MotionItem className="h-full">
      <article className="flex h-full flex-col rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="whitespace-nowrap text-lg font-semibold text-foreground">
            {product.name}
          </h3>
          <SubscriptionStatusBadge status={status} />
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>

        {periodLabel && (
          <p className="mt-4 text-xs text-muted-foreground">{periodLabel}</p>
        )}

        <div className="mt-6 flex-1" />

        {canOpenApp ? (
          <OpenAppButton productSlug={product.slug} />
        ) : (
          <Button type="button" variant="outline" disabled className="w-full">
            Open app
          </Button>
        )}
      </article>
    </MotionItem>
  );
}
