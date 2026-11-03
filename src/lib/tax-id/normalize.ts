import { isValidTaxIdFormat } from "@/lib/tax-id/formats";

/**
 * Uppercase, strip spaces, dots, and hyphens, then drop a leading country
 * prefix (EL or GR for Greece) when the remainder is a valid national number.
 * The prefix is kept when stripping it would break a number that includes
 * those letters (for example a Swiss UID starting with CHE).
 */
export function normalizeTaxId(raw: string, countryCode: string): string {
  const compact = raw.toUpperCase().replace(/[\s.\-]/g, "");
  const prefixes = countryCode === "GR" ? ["EL", "GR"] : [countryCode];

  for (const prefix of prefixes) {
    if (!compact.startsWith(prefix) || compact.length <= prefix.length) {
      continue;
    }

    const withoutPrefix = compact.slice(prefix.length);
    if (isValidTaxIdFormat(countryCode, withoutPrefix)) {
      return withoutPrefix;
    }
  }

  return compact;
}
