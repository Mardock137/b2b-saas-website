"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { openProductAppAction } from "@/app/(dashboard)/dashboard/apps/actions";
import { Button } from "@/components/ui/button";

export function OpenAppButton({ productSlug }: { productSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleClick() {
    setErrorMsg(null);

    // Open synchronously, inside the click handler, to preserve the
    // user-gesture requirement browsers impose on window.open(). We cannot
    // pass "noopener" here because it would make `pending` null in most
    // browsers, and we need the reference to navigate it once the signed
    // URL is ready.
    const pending = window.open("", "_blank");
    if (!pending) {
      setErrorMsg("Please allow pop-ups to open the app.");
      return;
    }

    startTransition(async () => {
      const result = await openProductAppAction(productSlug);
      if (!result.success) {
        pending.close();
        setErrorMsg(result.error);
        return;
      }
      pending.location.href = result.url;
    });
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full"
      >
        Open app
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
      </Button>

      {errorMsg && (
        <p className="mt-2 text-center text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
