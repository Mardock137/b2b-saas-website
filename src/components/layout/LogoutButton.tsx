"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/hooks/use-logout";

export function LogoutButton({ className }: { className?: string }) {
  const { logout, isPending } = useLogout();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={logout}
      disabled={isPending}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Logging out..." : "Log out"}
    </Button>
  );
}
