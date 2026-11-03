export const AUTH_CALLBACK_ERROR_CODES = [
  "link_expired",
  "link_invalid",
  "auth_failed",
] as const;

export type AuthCallbackErrorCode = (typeof AUTH_CALLBACK_ERROR_CODES)[number];

export function isAuthCallbackErrorCode(
  value: string | null,
): value is AuthCallbackErrorCode {
  if (!value) return false;
  return (AUTH_CALLBACK_ERROR_CODES as readonly string[]).includes(value);
}

export const AUTH_CALLBACK_ERROR_MESSAGES: Record<
  AuthCallbackErrorCode,
  string
> = {
  link_expired:
    "Your confirmation link has expired or was already used. Try logging in; if that doesn't work, contact support.",
  link_invalid:
    "This confirmation link is invalid. Please use the most recent link from your inbox.",
  auth_failed:
    "We couldn't confirm your email. Please try again or contact support.",
};
