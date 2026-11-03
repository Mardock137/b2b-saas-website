"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isSafeNextPath } from "@/lib/auth/safe-redirect";
import {
  isCaptchaVerificationError,
  VERIFICATION_FAILED_MESSAGE,
} from "@/lib/security/turnstile";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export type LoginActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  values: LoginValues,
  captchaToken: string,
  next?: string,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid login data.",
    };
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error) {
    const code = error.code ?? "";
    const message = error.message?.toLowerCase() ?? "";

    if (isCaptchaVerificationError(error)) {
      return { success: false, error: VERIFICATION_FAILED_MESSAGE };
    }

    if (
      code === "invalid_credentials" ||
      message.includes("invalid login credentials")
    ) {
      return { success: false, error: "Invalid email or password." };
    }

    if (
      code === "email_not_confirmed" ||
      message.includes("email not confirmed")
    ) {
      return {
        success: false,
        error: "Please confirm your email before logging in.",
      };
    }

    console.error("[loginAction] Unexpected sign-in error:", error);
    return {
      success: false,
      error: "Unable to log in. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  const destination = isSafeNextPath(next) ? next : "/dashboard";
  redirect(destination);
}
