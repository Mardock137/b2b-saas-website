import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Calendar, LayoutGrid, Settings } from "lucide-react";

import BillingShortcutCard from "@/components/dashboard/BillingShortcutCard";
import { NoAppsEmptyState } from "@/components/dashboard/NoAppsEmptyState";
import {
  MotionItem,
  MotionStagger,
  SpotlightCard,
} from "@/components/ui/spotlight-card";
import { DASHBOARD_DATE_FORMATTER } from "@/lib/dashboard/date-formatter";
import {
  getCurrentCompany,
  getSubscriptionsForCompany,
  type SubscriptionWithProduct,
} from "@/lib/dashboard/queries";

export const metadata: Metadata = {
  title: "Dashboard — Acme Labs",
  description: "Manage your apps.",
};

export default async function DashboardPage() {
  const result = await getCurrentCompany();

  if (!result) {
    redirect("/auth/login");
  }

  const { company } = result;
  const subscriptions = await getSubscriptionsForCompany(company.id);
  const hasBilling = Boolean(company.stripe_customer_id);

  const needsAttention = subscriptions.filter(
    (subscription) =>
      subscription.status === "past_due" || subscription.status === "incomplete",
  );
  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === "active",
  ).length;
  const nextRenewal = getNextRenewal(subscriptions);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome, {company.company_name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Manage your apps.
        </p>
      </header>

      {subscriptions.length === 0 ? (
        <div className="mt-12">
          <NoAppsEmptyState />
        </div>
      ) : (
        <>
          {needsAttention.length > 0 && (
            <AttentionBanner count={needsAttention.length} />
          )}

          <section className="mt-12">
            <MotionStagger className="grid gap-6 sm:grid-cols-2">
              <StatCard
                icon={LayoutGrid}
                label="Active apps"
                value={String(activeCount)}
              />
              <StatCard
                icon={Calendar}
                label="Next renewal"
                value={nextRenewal ? DASHBOARD_DATE_FORMATTER.format(nextRenewal) : "—"}
              />
            </MotionStagger>
          </section>

          <section className="mt-6">
            <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ShortcutLink
                href="/dashboard/apps"
                icon={LayoutGrid}
                label="My Apps"
              />
              {hasBilling && <BillingShortcutCard />}
              <ShortcutLink
                href="/dashboard/settings"
                icon={Settings}
                label="Settings"
              />
            </MotionStagger>
          </section>
        </>
      )}
    </div>
  );
}

function getNextRenewal(subscriptions: SubscriptionWithProduct[]): Date | null {
  const renewalDates = subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => subscription.current_period_end)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date));

  if (renewalDates.length === 0) return null;

  return renewalDates.reduce((earliest, date) =>
    date < earliest ? date : earliest,
  );
}

function AttentionBanner({ count }: { count: number }) {
  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">
          {count === 1
            ? "1 app needs attention."
            : `${count} apps need attention.`}
        </p>
      </div>
      <Link
        href="/dashboard/apps"
        className="text-sm font-medium text-destructive hover:opacity-90"
      >
        Review
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LayoutGrid;
  label: string;
  value: string;
}) {
  return (
    <MotionItem>
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </MotionItem>
  );
}

function ShortcutLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof LayoutGrid;
  label: string;
}) {
  return (
    <Link href={href}>
      <SpotlightCard>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
            <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
      </SpotlightCard>
    </Link>
  );
}

