"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { motion } from "motion/react";

import {
  cardHover,
  fadeInUp,
  inViewViewport,
  staggerContainer,
} from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

/**
 * CSS variables + pointer handler powering the mouse-follow glow effect.
 * Shared between `SpotlightCard` and any custom interactive container
 * (e.g. `BillingShortcutCard`) that needs the same glow but can't use
 * `SpotlightCard` directly because it wraps something more than a plain div
 * (like a `<button>` with its own click/loading logic).
 */
export function handleSpotlightPointerMove(
  event: PointerEvent<HTMLElement>,
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--mx",
    `${event.clientX - rect.left}px`,
  );
  event.currentTarget.style.setProperty(
    "--my",
    `${event.clientY - rect.top}px`,
  );
}

export const spotlightInitialStyle = {
  "--mx": "50%",
  "--my": "0%",
} as CSSProperties;

export const SPOTLIGHT_CARD_BASE_CLASSNAME =
  "group relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-colors hover:border-primary/40";

/** Radial-gradient layer that fades in on hover, following `--mx`/`--my`. */
export function SpotlightGlowLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_220px_at_var(--mx)_var(--my),rgba(76,141,255,0.16),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
    />
  );
}

export function SpotlightCard({
  children,
  className,
  dimmed = false,
}: {
  children: ReactNode;
  className?: string;
  dimmed?: boolean;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={dimmed ? undefined : cardHover}
      onPointerMove={dimmed ? undefined : handleSpotlightPointerMove}
      className={cn(
        SPOTLIGHT_CARD_BASE_CLASSNAME,
        "h-full p-6",
        className,
      )}
      style={spotlightInitialStyle}
    >
      {!dimmed && <SpotlightGlowLayer />}
      {dimmed && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-background/30 backdrop-blur-[2px]"
        />
      )}
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </motion.div>
  );
}

export function MotionStagger({
  children,
  className,
  inView = false,
}: {
  children: ReactNode;
  className?: string;
  inView?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate={inView ? undefined : "visible"}
      whileInView={inView ? "visible" : undefined}
      viewport={inView ? inViewViewport : undefined}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}
