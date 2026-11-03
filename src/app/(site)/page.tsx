"use client";

import Link from "next/link";
import { Zap, CreditCard, Activity, ArrowRight, Lock } from "lucide-react";
import { motion } from "motion/react";

import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  fadeInUp,
  inViewViewport,
  staggerContainer,
} from "@/lib/motion/variants";

const valueProps = [
  {
    icon: Zap,
    title: "Plug & Play",
    description:
      "Buy online, configure in minutes. No consultants, no waiting.",
  },
  {
    icon: CreditCard,
    title: "Monthly Subscription",
    description:
      "Predictable pricing. Cancel anytime. No setup fees, no long-term contracts.",
  },
  {
    icon: Activity,
    title: "Always On",
    description:
      "Apps stay available around the clock. Consistent quality, always.",
  },
];

const productPreviews = [
  {
    name: "Frontline",
    description: "Multi-tenant customer support platform.",
    status: "available" as const,
  },
  {
    name: "Coming Soon",
    description: "New apps in active development.",
    status: "coming" as const,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8 lg:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              variants={fadeInUp}
              className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
            >
              Business software,{" "}
              <span className="text-primary">on subscription.</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
            >
              Ready-made business software you can subscribe to and start using
              in minutes.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/products">View Products</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={inViewViewport}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {valueProps.map((item) => (
              <SpotlightCard key={item.title}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-violet/25 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </SpotlightCard>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={inViewViewport}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
            >
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Our Apps
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ready-made apps, available on a monthly subscription.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm text-primary transition-opacity hover:opacity-90"
              >
                View all products <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div
              variants={staggerContainer}
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:max-w-4xl"
            >
              {productPreviews.map((product, idx) => (
                <SpotlightCard key={idx}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {product.name}
                    </h3>
                    {product.status === "coming" && (
                      <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                        <Lock className="h-3 w-3" /> Coming Soon
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                </SpotlightCard>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <AuroraBackground intensity="subtle" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={inViewViewport}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Stop hiring. Start replacing.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-base text-muted-foreground sm:text-lg"
            >
              Pick an app and put it to work today.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
