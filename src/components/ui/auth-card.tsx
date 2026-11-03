import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/80 p-8 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
