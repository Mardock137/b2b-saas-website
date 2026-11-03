"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSessionAction } from "@/app/(site)/products/actions";
import { Button } from "@/components/ui/button";
import type { ProductStatus } from "@/lib/dashboard/queries";

type Props = {
  productSlug: string;
  productStatus: ProductStatus;
  /** null = user is not logged in */
  isLoggedIn: boolean;
  isSubscribed: boolean;
};

export default function ProductCtaButton({
  productSlug,
  productStatus,
  isLoggedIn,
  isSubscribed,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Product not purchasable regardless of auth state.
  if (productStatus === "coming_soon" || productStatus === "archived") {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled
        className="mt-6 w-full"
      >
        Not available yet
      </Button>
    );
  }

  // Already subscribed — send to dashboard.
  if (isLoggedIn && isSubscribed) {
    return (
      <Button asChild variant="outline" size="lg" className="mt-6 w-full">
        <Link href="/dashboard">
          Manage in Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  // Not logged in — send to signup.
  if (!isLoggedIn) {
    return (
      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/auth/signup?next=/products">
          Sign up to subscribe <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  // Logged in, not subscribed — initiate Stripe Checkout.
  function handleSubscribe() {
    startTransition(async () => {
      const result = await createCheckoutSessionAction(productSlug);
      if (result.success) {
        router.push(result.url);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleSubscribe}
      disabled={isPending}
      className="mt-6 w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
        </>
      ) : (
        <>
          Subscribe <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
