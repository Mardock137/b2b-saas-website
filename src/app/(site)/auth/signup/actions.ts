"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestOrigin } from "@/lib/http/request-origin";
import { getClientIp } from "@/lib/security/client-ip";
import { checkSignupRateLimit } from "@/lib/security/rate-limit";
import {
  isCaptchaVerificationError,
  VERIFICATION_FAILED_MESSAGE,
} from "@/lib/security/turnstile";
import { viesMemberCode } from "@/lib/tax-id/countries";
import { normalizeTaxId } from "@/lib/tax-id/normalize";
import { checkVatNumber } from "@/lib/tax-id/vies";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";

const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";
const VIES_INVALID_MESSAGE =
  "This VAT number was not found in the EU VIES database.";
const VIES_UNAVAILABLE_MESSAGE =
  "The VAT validation service is temporarily unavailable. Please try again in a few minutes.";

export type SignupActionResult =
  | { success: true }
  | { success: false; error: string };

export async function signupAction(
  values: SignupValues,
  captchaToken: string,
): Promise<SignupActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Invalid signup data.",
    };
  }

  const { companyName, email, taxIdCountry, taxId, password } = parsed.data;
  const normalizedTaxId = normalizeTaxId(taxId, taxIdCountry);

  const ip = await getClientIp();
  const rateLimit = await checkSignupRateLimit(ip);
  if (!rateLimit.allowed) {
    return { success: false, error: RATE_LIMIT_MESSAGE };
  }

  const viesCode = viesMemberCode(taxIdCountry, normalizedTaxId);
  let taxIdVerification: "vies_verified" | "format_only" = "format_only";

  if (viesCode) {
    const vatNumber = viesCode === "XI" ? normalizedTaxId.slice(2) : normalizedTaxId;
    const viesResult = await checkVatNumber(viesCode, vatNumber);
    if (viesResult === "invalid") {
      return { success: false, error: VIES_INVALID_MESSAGE };
    }
    if (viesResult === "unavailable") {
      return { success: false, error: VIES_UNAVAILABLE_MESSAGE };
    }
    taxIdVerification = "vies_verified";
  }

  const origin = getRequestOrigin();

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      captchaToken,
    },
  });

  if (signUpError || !signUpData.user) {
    console.error("[signupAction] signUpError:", signUpError);
    if (isCaptchaVerificationError(signUpError)) {
      return { success: false, error: VERIFICATION_FAILED_MESSAGE };
    }
    return {
      success: false,
      error: signUpError?.message ?? "Unable to create account. Please try again.",
    };
  }

  const userId = signUpData.user.id;

  // Supabase's anti-enumeration behavior: if "Confirm email" is enabled and
  // the email already belongs to a *confirmed* account, signUp() does NOT
  // return an error — it returns the existing user with an empty
  // `identities` array. Without this check we would proceed to insert into
  // `companies` using someone else's user id, and on failure we would call
  // deleteUser() on a real, pre-existing account.
  const identities = signUpData.user.identities ?? [];
  if (identities.length === 0) {
    console.error(
      "[signupAction] signUp returned an existing user with no new identity (email likely already registered):",
      userId,
    );
    return {
      success: false,
      error: "Unable to create account. Please try again or contact support.",
    };
  }

  // The INSERT must use the admin client (service_role) because the user
  // has not confirmed their email yet, so there is no active session and
  // RLS would block the INSERT (auth.uid() is NULL at this point).
  // This is the standard Supabase pattern for creating a profile row
  // immediately after signUp when email confirmation is enabled.
  const admin = createAdminClient();

  const { error: insertError } = await admin.from("companies").insert({
    id: userId,
    company_name: companyName,
    tax_id: normalizedTaxId,
    tax_id_country: taxIdCountry,
    tax_id_verification: taxIdVerification,
  });

  if (insertError) {
    console.error("[signupAction] insertError:", insertError);
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch (cleanupError) {
      console.error(
        "[signupAction] Failed to clean up Auth user after companies insert error:",
        cleanupError,
      );
    }

    return {
      success: false,
      error:
        "We couldn't save your company profile. Please try again or contact support.",
    };
  }

  return { success: true };
}
