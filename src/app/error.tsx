"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-4 py-20 sm:px-6">
      <div className="flex flex-col items-center">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          An unexpected error occurred. You can try again or go back home.
        </p>
      </div>

      <AuthCard className="mt-8 w-full">
        <div className="flex flex-col gap-3">
          <Button type="button" onClick={reset} className="w-full">
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </AuthCard>
    </div>
  );
}
