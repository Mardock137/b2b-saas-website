import { z } from "zod";

import { isBlockedEmailDomain } from "@/lib/auth/blocked-email-domains";
import {
  getTaxIdCountryName,
  isTaxIdCountryCode,
  TAX_ID_COUNTRY_CODES,
} from "@/lib/tax-id/countries";
import { isValidTaxIdFormat } from "@/lib/tax-id/formats";
import { normalizeTaxId } from "@/lib/tax-id/normalize";

export const PASSWORD_MIN_LENGTH = 16;
export const PASSWORD_MAX_LENGTH = 128;

export const signupSchema = z
  .object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .refine((email) => !isBlockedEmailDomain(email), {
        message: "Please use your company email address",
      }),
    taxIdCountry: z.enum(TAX_ID_COUNTRY_CODES, { error: "Select a country" }),
    taxId: z.string().min(1, "Tax ID is required"),
    password: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      ),
  })
  .superRefine((data, ctx) => {
    if (!isTaxIdCountryCode(data.taxIdCountry)) {
      return;
    }

    const normalized = normalizeTaxId(data.taxId, data.taxIdCountry);
    if (!isValidTaxIdFormat(data.taxIdCountry, normalized)) {
      ctx.addIssue({
        code: "custom",
        path: ["taxId"],
        message: `Enter a valid tax ID for ${getTaxIdCountryName(data.taxIdCountry)}`,
      });
    }
  });

export type SignupValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(
      PASSWORD_MAX_LENGTH,
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    ),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .max(
        PASSWORD_MAX_LENGTH,
        `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      ),
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
