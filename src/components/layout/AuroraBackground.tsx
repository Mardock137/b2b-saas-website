"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type AuroraBackgroundProps = {
  className?: string;
  intensity?: "default" | "subtle";
};

export function AuroraBackground({
  className,
  intensity = "default",
}: AuroraBackgroundProps) {
  const blobOpacity = intensity === "subtle" ? "opacity-15" : "opacity-25";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <motion.div
        className={cn(
          "absolute -left-[18%] -top-[35%] h-[70%] w-[70%] rounded-full bg-primary blur-3xl",
          blobOpacity,
        )}
        animate={{ x: [0, 36, -16, 0], y: [0, 24, 8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cn(
          "absolute -right-[12%] top-[8%] h-[55%] w-[55%] rounded-full bg-violet blur-3xl",
          blobOpacity,
        )}
        animate={{ x: [0, -28, 12, 0], y: [0, 18, -12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cn(
          "absolute bottom-[-22%] left-[18%] h-[50%] w-[62%] rounded-full bg-primary blur-3xl",
          intensity === "subtle" ? "opacity-10" : "opacity-[0.18]",
        )}
        animate={{ x: [0, 22, 0], y: [0, -18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
