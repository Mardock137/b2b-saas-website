import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NoAppsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        No apps yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        You haven&apos;t subscribed to any app yet. Browse the catalog and
        activate the ones that fit your business.
      </p>
      <Button asChild className="mt-6">
        <Link href="/products" className="inline-flex items-center gap-2">
          Browse Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
