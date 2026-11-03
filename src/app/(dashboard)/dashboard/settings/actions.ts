"use server";

import { getCurrentCompany } from "@/lib/dashboard/queries";
import {
  isCaptchaVerificationError,
  VERIFICATION_FAILED_MESSAGE,
} from "@/lib/security/turnstile";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validations/auth";

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function changePasswordAction(
  values: ChangePasswordValues,
  captchaToken: string,
): Promise<ChangePasswordResult> {
  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  // 1. Verify the user is authenticated.
  const auth = await getCurrentCompany();
  if (!auth || !auth.user.email) {
    return { success: false, error: "Please sign in to change your password." };
  }

  const supabase = await createClient();

  // 2. Re-authenticate with the current password before allowing the change.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: currentPassword,
    options: { captchaToken },
  });

  if (reauthError) {
    if (isCaptchaVerificationError(reauthError)) {
      return { success: false, error: VERIFICATION_FAILED_MESSAGE };
    }
    return { success: false, error: "Current password is incorrect." };
  }

  // 3. Update the password.
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("[changePasswordAction] updateError:", updateError);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }

  return { success: true };
}
