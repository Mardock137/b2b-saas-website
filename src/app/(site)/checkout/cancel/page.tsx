import Link from "next/link";
import { XCircle } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import {
  MotionItem,
  MotionStagger,
} from "@/components/ui/spotlight-card";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20">
      <MotionStagger className="w-full">
        <MotionItem>
          <AuthCard className="flex flex-col items-center text-center">
            <XCircle className="h-16 w-16 text-muted-foreground" />

            <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-foreground">
              Checkout canceled
            </h1>

            <p className="mt-4 text-base text-muted-foreground">
              No worries — your card has not been charged. You can go back and
              subscribe whenever you&apos;re ready.
            </p>

            <Button asChild size="lg" variant="outline" className="mt-10">
              <Link href="/products">Back to Products</Link>
            </Button>
          </AuthCard>
        </MotionItem>
      </MotionStagger>
    </div>
  );
}
