import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import {
  MotionItem,
  MotionStagger,
} from "@/components/ui/spotlight-card";
import { getProductNameBySlug } from "@/lib/products/queries";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: slug } = await searchParams;

  const productName = slug ? await getProductNameBySlug(slug) : null;

  return (
    <div className="relative overflow-hidden">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20">
        <MotionStagger className="w-full">
          <MotionItem>
            <AuthCard className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-16 w-16 text-primary" />

              <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-foreground">
                Thank you for subscribing!
              </h1>

              <p className="mt-4 text-base text-muted-foreground">
                Your payment was received.{" "}
                {productName ? (
                  <>
                    Your subscription to{" "}
                    <span className="font-medium text-foreground">
                      {productName}
                    </span>{" "}
                    is now being activated.
                  </>
                ) : (
                  "Your subscription is now being activated."
                )}
              </p>

              <p className="mt-3 text-sm text-muted-foreground">
                It will appear in your dashboard as soon as we confirm your
                payment (usually within a few seconds). If it&apos;s not there
                yet, wait a moment and refresh the page.
              </p>

              <Button asChild size="lg" className="mt-10">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </AuthCard>
          </MotionItem>
        </MotionStagger>
      </div>
    </div>
  );
}
