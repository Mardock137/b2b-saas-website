export const ALLOWED_COUNTRIES = new Set<string>([
  "AL", "AU", "AT", "BE", "CA", "HR", "CY", "CZ", "DK", "EE",
  "FI", "FR", "DE", "GR", "GL", "IS", "IE", "IL", "IT", "JP",
  "LV", "LI", "LT", "LU", "MT", "MC", "NL", "NZ", "NO", "PL",
  "PT", "SM", "SG", "SI", "KR", "ES", "SE", "CH", "TW", "GB",
  "UY", "US",
]);

export function isCountryAllowed(country: string | null | undefined): boolean {
  if (!country) return false;
  return ALLOWED_COUNTRIES.has(country.toUpperCase());
}
