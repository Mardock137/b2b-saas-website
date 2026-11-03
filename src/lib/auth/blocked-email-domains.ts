export const BLOCKED_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
  "ymail.com",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
] as const;

export function isBlockedEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
}
