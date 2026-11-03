"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useDrawer } from "@/lib/hooks/use-drawer";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";

export type SiteNavLink = {
  href: string;
  label: string;
};

export function NavbarFrame({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b motion-safe:transition-[background-color,border-color,box-shadow] motion-safe:duration-300",
        scrolled
          ? "border-border bg-background/80 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
          : "border-transparent bg-background/50 backdrop-blur-sm supports-[backdrop-filter]:bg-background/40",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </header>
  );
}

const emptySubscribe = () => () => {};

export function MobileNavMenu({
  navLinks,
  isLoggedIn,
  companyName,
}: {
  navLinks: SiteNavLink[];
  isLoggedIn: boolean;
  companyName: string | null;
}) {
  const pathname = usePathname();
  const { open, setOpen } = useDrawer();
  const drawerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useFocusTrap(drawerRef, open);

  const drawer = (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        id="site-mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal={open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(20rem,100%)] flex-col border-l border-border bg-background/95 backdrop-blur-md transition-transform duration-200 ease-in-out md:hidden motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
        inert={!open || undefined}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-heading text-sm font-semibold tracking-wide text-foreground">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          {isLoggedIn ? (
            <div className="flex flex-col gap-3">
              {companyName && (
                <p
                  className="truncate px-1 text-sm text-muted-foreground"
                  title={companyName}
                >
                  {companyName}
                </p>
              )}
              <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </Button>
              <LogoutButton className="w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/auth/signup" onClick={() => setOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="site-mobile-drawer"
        className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </div>
  );
}
