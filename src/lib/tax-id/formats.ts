import type { TaxIdCountryCode } from "@/lib/tax-id/countries";

/**
 * National part of a VAT / tax ID, already normalized (uppercase, no
 * spaces, dots, or hyphens, country prefix removed).
 *
 * EU structures follow the European Commission / EUIPO table
 * "European Union VAT identification numbers"
 * (https://euipo.europa.eu/tunnel-web/secure/webdav/guest/document_library/Documents/COSME/VAT%20numbers%20EU.pdf)
 * and the Commission overview at
 * https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/vat-identification-numbers_en.
 * The EUIPO PDF prints Malta's structure as "LU99999999" (Luxembourg's
 * prefix copied by mistake); the same row's country prefix is MT and the
 * length is 8 digits, which is the structure used here.
 * Spain: first and last characters may be a letter or a digit, but not
 * both digits (Commission footnote on ESX9999999X).
 * Netherlands: 9 digits, a literal B, then 2 digits.
 *
 * United Kingdom (and the national part of an XI number) follows the
 * structures HMRC still publishes for VAT numbers: 9 digits, 12 digits,
 * GD plus 3 digits (government departments), or HA plus 3 digits (health
 * authorities). See https://www.gov.uk/guidance/vat-eu-country-codes-vat-numbers-and-vat-in-other-languages.
 *
 * Countries in GENERIC_TAX_ID_COUNTRIES have no reliable national pattern
 * wired in. They accept 4–20 letters or digits after normalization.
 */

export const GENERIC_TAX_ID_COUNTRIES = [
  "AL",
  "AU",
  "CA",
  "GL",
  "IS",
  "IL",
  "JP",
  "LI",
  "MC",
  "NZ",
  "NO",
  "SM",
  "SG",
  "KR",
  "CH",
  "TW",
  "UY",
  "US",
] as const satisfies readonly TaxIdCountryCode[];

const GENERIC_PATTERN = /^[A-Z0-9]{4,20}$/;

function isGeneric(value: string): boolean {
  return GENERIC_PATTERN.test(value);
}

function isUkNational(value: string): boolean {
  return (
    /^\d{9}$/.test(value) ||
    /^\d{12}$/.test(value) ||
    /^GD\d{3}$/.test(value) ||
    /^HA\d{3}$/.test(value)
  );
}

function isSpain(value: string): boolean {
  if (!/^[A-Z0-9]\d{7}[A-Z0-9]$/.test(value)) {
    return false;
  }

  const firstIsDigit = /\d/.test(value[0] ?? "");
  const lastIsDigit = /\d/.test(value[8] ?? "");
  return !(firstIsDigit && lastIsDigit);
}

function isIreland(value: string): boolean {
  return (
    /^[0-9][0-9A-Z+*][0-9]{5}[A-Z]$/.test(value) ||
    /^[0-9]{7}[A-Z]{2}$/.test(value)
  );
}

const RULES: Record<TaxIdCountryCode, (value: string) => boolean> = {
  AL: isGeneric,
  AU: isGeneric,
  AT: (value) => /^U\d{8}$/.test(value),
  BE: (value) => /^[01]\d{9}$/.test(value),
  CA: isGeneric,
  HR: (value) => /^\d{11}$/.test(value),
  CY: (value) => /^\d{8}[A-Z]$/.test(value),
  CZ: (value) => /^\d{8,10}$/.test(value),
  DK: (value) => /^\d{8}$/.test(value),
  EE: (value) => /^\d{9}$/.test(value),
  FI: (value) => /^\d{8}$/.test(value),
  FR: (value) => /^[A-Z0-9]{2}\d{9}$/.test(value),
  DE: (value) => /^\d{9}$/.test(value),
  GR: (value) => /^\d{9}$/.test(value),
  GL: isGeneric,
  IS: isGeneric,
  IE: isIreland,
  IL: isGeneric,
  IT: (value) => /^\d{11}$/.test(value),
  JP: isGeneric,
  LV: (value) => /^\d{11}$/.test(value),
  LI: isGeneric,
  LT: (value) => /^\d{9}$/.test(value) || /^\d{12}$/.test(value),
  LU: (value) => /^\d{8}$/.test(value),
  MT: (value) => /^\d{8}$/.test(value),
  MC: isGeneric,
  NL: (value) => /^\d{9}B\d{2}$/.test(value),
  NZ: isGeneric,
  NO: isGeneric,
  PL: (value) => /^\d{10}$/.test(value),
  PT: (value) => /^\d{9}$/.test(value),
  SM: isGeneric,
  SG: isGeneric,
  SI: (value) => /^\d{8}$/.test(value),
  KR: isGeneric,
  ES: isSpain,
  SE: (value) => /^\d{12}$/.test(value),
  CH: isGeneric,
  TW: isGeneric,
  GB: (value) =>
    value.startsWith("XI") ? isUkNational(value.slice(2)) : isUkNational(value),
  UY: isGeneric,
  US: isGeneric,
};

export function isValidTaxIdFormat(
  countryCode: string,
  normalizedTaxId: string,
): boolean {
  const rule = RULES[countryCode as TaxIdCountryCode];
  if (!rule) {
    return false;
  }

  return rule(normalizedTaxId);
}
