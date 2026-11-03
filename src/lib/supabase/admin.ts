import "server-only";

import { createClient } from "@supabase/supabase-js";

// Privileged Supabase client used for server-side admin operations
// (e.g. cleanup of an Auth user when a follow-up DB write fails).
// This client uses the SERVICE_ROLE_KEY and bypasses RLS, so it must
// NEVER be imported from a client component or exposed to the browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createClient(url, serviceRoleKey, {
    db: { schema: "website" },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
