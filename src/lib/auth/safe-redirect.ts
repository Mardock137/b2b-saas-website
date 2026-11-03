/**
 * Guards against open-redirect attacks: only allows internal paths
 * ("/foo"), rejecting protocol-relative ("//evil.com") and
 * backslash-trick paths ("/\evil.com").
 */
export function isSafeNextPath(next: string | undefined | null): next is string {
  if (!next) return false;
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  if (next.startsWith("/\\")) return false;
  return true;
}
