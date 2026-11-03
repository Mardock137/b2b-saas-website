"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { createBillingPortalSessionAction } from "@/app/(dashboard)/dashboard/actions";
import { cardHover } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import {
  handleSpotlightPointerMove,
  spotlightInitialStyle,
  SpotlightGlowLayer,
  SPOTLIGHT_CARD_BASE_CLASSNAME,
} from "@/components/ui/spotlight-card";

export default function BillingShortcutCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleClick() {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await createBillingPortalSessionAction();
      if (result.success) {
        router.push(result.url);
      } else {
        setErrorMsg(result.error);
      }
    });
  }

  return (
    <div>
      <motion.div
        whileHover={cardHover}
        onPointerMove={handleSpotlightPointerMove}
        className={cn(SPOTLIGHT_CARD_BASE_CLASSNAME)}
        style={spotlightInitialStyle}
      >
        <SpotlightGlowLayer />
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="relative z-10 flex w-full cursor-pointer items-center gap-3 p-6 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <CreditCard className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            )}
          </div>
          <span className="text-sm font-medium text-foreground">
            Manage billing
          </span>
        </button>
      </motion.div>

      {errorMsg && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
