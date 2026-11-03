import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { MobileNavMenu, NavbarFrame } from "./MobileNavMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let companyName: string | null = null;
  if (user) {
    const { data: company } = await supabase
      .from("companies")
      .select("company_name")
      .eq("id", user.id)
      .maybeSingle();
    companyName = company?.company_name ?? null;
  }

  return (
    <NavbarFrame>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-sm font-semibold tracking-wide text-foreground">
            Acme Labs
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                {companyName && (
                  <span
                    className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline"
                    title={companyName}
                  >
                    {companyName}
                  </span>
                )}
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Login
                </Link>
                <Button asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {!user && (
            <div className="md:hidden">
              <Button asChild size="sm">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          )}

          <MobileNavMenu
            navLinks={navLinks}
            isLoggedIn={Boolean(user)}
            companyName={companyName}
          />
        </div>
      </nav>
    </NavbarFrame>
  );
}
