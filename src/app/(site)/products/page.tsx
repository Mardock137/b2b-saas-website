import { Lock } from "lucide-react";

import { getCurrentCompany } from "@/lib/dashboard/queries";
import {
  getAvailableProducts,
  getUserActiveSubscriptionSlugs,
} from "@/lib/products/queries";
import { AuroraBackground } from "@/components/layout/AuroraBackground";
import ProductCtaButton from "@/components/products/ProductCtaButton";
import {
  MotionItem,
  MotionStagger,
  SpotlightCard,
} from "@/components/ui/spotlight-card";

export const dynamic = "force-dynamic";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ProductsPage() {
  const [products, authData] = await Promise.all([
    getAvailableProducts(),
    getCurrentCompany(),
  ]);

  const isLoggedIn = authData !== null;
  const activeSubscriptionSlugs = isLoggedIn
    ? await getUserActiveSubscriptionSlugs(authData.company.id)
    : [];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <AuroraBackground intensity="subtle" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
          <MotionStagger>
            <MotionItem>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Apps
              </h1>
            </MotionItem>
            <MotionItem>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Ready-made apps you can subscribe to and start using in minutes.
              </p>
            </MotionItem>
          </MotionStagger>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <MotionStagger inView className="grid gap-6 md:grid-cols-3">
          {products.map((product) => {
            const isSubscribed = activeSubscriptionSlugs.includes(product.slug);
            const isAvailable = product.status === "available";

            if (isAvailable) {
              return (
                <SpotlightCard key={product.slug}>
                  <div className="mb-2 inline-flex w-fit items-center rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                    Available
                  </div>
                  <h2 className="font-heading text-2xl font-semibold text-foreground">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.description}
                  </p>

                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(
                        product.monthly_price_cents,
                        product.currency,
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  </div>

                  <ProductCtaButton
                    productSlug={product.slug}
                    productStatus={product.status}
                    isLoggedIn={isLoggedIn}
                    isSubscribed={isSubscribed}
                  />
                </SpotlightCard>
              );
            }

            return (
              <SpotlightCard key={product.slug} dimmed>
                <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Coming Soon
                </div>
                <h2 className="font-heading text-2xl font-semibold text-foreground/40">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground/60">
                  {product.description}
                </p>

                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground/30">
                    —
                  </span>
                  <span className="text-sm text-muted-foreground/40">
                    /month
                  </span>
                </div>

                <ProductCtaButton
                  productSlug={product.slug}
                  productStatus={product.status}
                  isLoggedIn={isLoggedIn}
                  isSubscribed={false}
                />
              </SpotlightCard>
            );
          })}
        </MotionStagger>
      </div>
    </>
  );
}
