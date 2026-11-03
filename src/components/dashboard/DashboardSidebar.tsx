"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from "lucide-react";

import {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
} from "@/lib/dashboard/sidebar-preference";
import { useDrawer } from "@/lib/hooks/use-drawer";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useLogout } from "@/lib/hooks/use-logout";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/apps", label: "My Apps", icon: LayoutGrid },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-sm font-semibold tracking-wide text-foreground">
        Acme Labs
      </span>
    </Link>
  );
}

function CompactLogoutButton({ companyName }: { companyName: string }) {
  const { logout, isPending } = useLogout();

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isPending}
      title={`${companyName} — Log out`}
      aria-label="Log out"
      className="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}

function SidebarContent({
  companyName,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  companyName: string;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-border p-4",
          collapsed && "flex flex-col items-center gap-3 px-2",
        )}
      >
        {collapsed ? (
          <CompactLogoutButton companyName={companyName} />
        ) : (
          <div className="flex items-center justify-between gap-2 px-2">
            <p
              className="truncate text-sm text-muted-foreground"
              title={companyName}
            >
              {companyName}
            </p>
            <CompactLogoutButton companyName={companyName} />
          </div>
        )}
      </div>
    </>
  );
}

export function DashboardSidebar({
  companyName,
  defaultCollapsed = false,
}: {
  companyName: string;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const { open, setOpen } = useDrawer();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const drawerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(drawerRef, open);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${next ? "1" : "0"}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }

  return (
    <>
      {/* Topbar mobile */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-card/90 px-4 backdrop-blur-sm md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="dashboard-mobile-drawer"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border",
            collapsed ? "justify-center px-2" : "justify-between px-6",
          )}
        >
          {!collapsed && <Logo />}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
        <SidebarContent
          companyName={companyName}
          pathname={pathname}
          collapsed={collapsed}
        />
      </aside>

      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer mobile (sempre a piena larghezza, indipendente da collapsed) */}
      <div
        id="dashboard-mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal={open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card/95 backdrop-blur-md transition-transform duration-200 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarContent
          companyName={companyName}
          pathname={pathname}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </>
  );
}
