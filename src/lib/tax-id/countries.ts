import { ALLOWED_COUNTRIES } from "@/lib/geo/allowed-countries";

/**
 * The 42 countries that may register. EU members are checked on VIES.
 * Greece is ISO `GR` but VIES uses `EL`. Northern Ireland (`XI`) is not
 * a row here: it is detected from a GB tax ID that starts with XI.
 *
 * Names come from Intl.DisplayNames (English). Do not hard-code them.
 */
export const TAX_ID_COUNTRIES = [
  { code: "AL", isEu: false, viesCode: null },
  { code: "AU", isEu: false, viesCode: null },
  { code: "AT", isEu: true, viesCode: "AT" },
  { code: "BE", isEu: true, viesCode: "BE" },
  { code: "CA", isEu: false, viesCode: null },
  { code: "HR", isEu: true, viesCode: "HR" },
  { code: "CY", isEu: true, viesCode: "CY" },
  { code: "CZ", isEu: true, viesCode: "CZ" },
  { code: "DK", isEu: true, viesCode: "DK" },
  { code: "EE", isEu: true, viesCode: "EE" },
  { code: "FI", isEu: true, viesCode: "FI" },
  { code: "FR", isEu: true, viesCode: "FR" },
  { code: "DE", isEu: true, viesCode: "DE" },
  { code: "GR", isEu: true, viesCode: "EL" },
  { code: "GL", isEu: false, viesCode: null },
  { code: "IS", isEu: false, viesCode: null },
  { code: "IE", isEu: true, viesCode: "IE" },
  { code: "IL", isEu: false, viesCode: null },
  { code: "IT", isEu: true, viesCode: "IT" },
  { code: "JP", isEu: false, viesCode: null },
  { code: "LV", isEu: true, viesCode: "LV" },
  { code: "LI", isEu: false, viesCode: null },
  { code: "LT", isEu: true, viesCode: "LT" },
  { code: "LU", isEu: true, viesCode: "LU" },
  { code: "MT", isEu: true, viesCode: "MT" },
  { code: "MC", isEu: false, viesCode: null },
  { code: "NL", isEu: true, viesCode: "NL" },
  { code: "NZ", isEu: false, viesCode: null },
  { code: "NO", isEu: false, viesCode: null },
  { code: "PL", isEu: true, viesCode: "PL" },
  { code: "PT", isEu: true, viesCode: "PT" },
  { code: "SM", isEu: false, viesCode: null },
  { code: "SG", isEu: false, viesCode: null },
  { code: "SI", isEu: true, viesCode: "SI" },
  { code: "KR", isEu: false, viesCode: null },
  { code: "ES", isEu: true, viesCode: "ES" },
  { code: "SE", isEu: true, viesCode: "SE" },
  { code: "CH", isEu: false, viesCode: null },
  { code: "TW", isEu: false, viesCode: null },
  { code: "GB", isEu: false, viesCode: null },
  { code: "UY", isEu: false, viesCode: null },
  { code: "US", isEu: false, viesCode: null },
] as const;

export type TaxIdCountryCode = (typeof TAX_ID_COUNTRIES)[number]["code"];

export const TAX_ID_COUNTRY_CODES = TAX_ID_COUNTRIES.map(
  (country) => country.code,
) as unknown as [TaxIdCountryCode, ...TaxIdCountryCode[]];

const COUNTRY_BY_CODE = new Map(
  TAX_ID_COUNTRIES.map((country) => [country.code, country]),
);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function isTaxIdCountryCode(value: string): value is TaxIdCountryCode {
  return COUNTRY_BY_CODE.has(value as TaxIdCountryCode);
}

export function getTaxIdCountryName(code: string): string {
  return regionNames.of(code) ?? code;
}

export function listTaxIdCountries(): { code: TaxIdCountryCode; name: string }[] {
  return TAX_ID_COUNTRIES.map((country) => ({
    code: country.code,
    name: getTaxIdCountryName(country.code),
  })).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/**
 * VIES member code for this signup, or null when VIES does not apply.
 * A GB number that starts with XI is Northern Ireland and is checked as XI.
 */
export function viesMemberCode(
  countryCode: string,
  normalizedTaxId: string,
): string | null {
  if (countryCode === "GB" && normalizedTaxId.startsWith("XI")) {
    return "XI";
  }

  const country = COUNTRY_BY_CODE.get(countryCode as TaxIdCountryCode);
  if (!country?.isEu || !country.viesCode) {
    return null;
  }

  return country.viesCode;
}

export function taxIdCountriesMatchAllowList(): boolean {
  if (TAX_ID_COUNTRIES.length !== ALLOWED_COUNTRIES.size) {
    return false;
  }

  return TAX_ID_COUNTRIES.every((country) =>
    ALLOWED_COUNTRIES.has(country.code),
  );
}
