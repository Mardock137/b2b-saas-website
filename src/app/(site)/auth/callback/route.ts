import { NextResponse } from "next/server";

import type { AuthCallbackErrorCode } from "@/lib/auth/callback-errors";
import { isSafeNextPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

function redirectToLogin(origin: string, code: AuthCallbackErrorCode) {
  return NextResponse.redirect(`${origin}/auth/login?error=${code}`);
}

// Route hit by Supabase after the user clicks the confirmation link
// in the signup email. We exchange the one-time `code` for a session
// (cookies are set by the Supabase server client) and redirect to the
// dashboard (or to `next` if provided as a query param).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const destination = isSafeNextPath(next) ? next : "/dashboard";
  const supabaseError = searchParams.get("error");
  const supabaseErrorCode = searchParams.get("error_code");
  const supabaseErrorDescription = searchParams.get("error_description");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }

    console.error("[authCallback] exchangeCodeForSession failed:", error);
    const mapped: AuthCallbackErrorCode =
      typeof error.code === "string" && error.code.includes("expired")
        ? "link_expired"
        : "auth_failed";
    return redirectToLogin(origin, mapped);
  }

  const mapped: AuthCallbackErrorCode =
    supabaseErrorCode === "otp_expired" ? "link_expired" : "link_invalid";

  console.error("[authCallback] Confirmation failed without a code:", {
    error: supabaseError,
    error_code: supabaseErrorCode,
    error_description: supabaseErrorDescription,
  });

  return redirectToLogin(origin, mapped);
}
