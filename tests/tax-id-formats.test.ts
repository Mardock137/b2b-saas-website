import { describe, expect, it } from "vitest";

import { ALLOWED_COUNTRIES } from "@/lib/geo/allowed-countries";
import {
  listTaxIdCountries,
  TAX_ID_COUNTRIES,
  taxIdCountriesMatchAllowList,
  viesMemberCode,
} from "@/lib/tax-id/countries";
import { GENERIC_TAX_ID_COUNTRIES, isValidTaxIdFormat } from "@/lib/tax-id/formats";
import { normalizeTaxId } from "@/lib/tax-id/normalize";

const VALID_NATIONAL: Record<string, string> = {
  AL: "AB12",
  AU: "AB12",
  AT: "U12345678",
  BE: "0123456789",
  CA: "AB12",
  HR: "12345678901",
  CY: "12345678A",
  CZ: "12345678",
  DK: "12345678",
  EE: "123456789",
  FI: "12345678",
  FR: "AB123456789",
  DE: "123456789",
  GR: "123456789",
  GL: "AB12",
  IS: "AB12",
  IE: "1A23456B",
  IL: "AB12",
  IT: "12345678901",
  JP: "AB12",
  LV: "12345678901",
  LI: "AB12",
  LT: "123456789",
  LU: "12345678",
  MT: "12345678",
  MC: "AB12",
  NL: "123456789B01",
  NZ: "AB12",
  NO: "AB12",
  PL: "1234567890",
  PT: "123456789",
  SM: "AB12",
  SG: "AB12",
  SI: "12345678",
  KR: "AB12",
  ES: "A12345678",
  SE: "123456789012",
  CH: "AB12",
  TW: "AB12",
  GB: "123456789",
  UY: "AB12",
  US: "AB12",
};

describe("tax id countries", () => {
  it("lists the same 42 countries as the geo allow list", () => {
    expect(taxIdCountriesMatchAllowList()).toBe(true);
    expect(TAX_ID_COUNTRIES).toHaveLength(ALLOWED_COUNTRIES.size);
    expect(TAX_ID_COUNTRIES.filter((country) => country.isEu)).toHaveLength(23);
  });

  it("sorts display names in English", () => {
    const names = listTaxIdCountries().map((country) => country.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en"));
    expect(names).toEqual(sorted);
    expect(names).toContain("Italy");
    expect(names).toContain("Greece");
  });
});

describe("tax id formats", () => {
  it.each(TAX_ID_COUNTRIES.map((country) => country.code))(
    "accepts a well-formed number and rejects junk for %s",
    (code) => {
      expect(isValidTaxIdFormat(code, VALID_NATIONAL[code] ?? "")).toBe(true);
      expect(isValidTaxIdFormat(code, "!!!")).toBe(false);
    },
  );

  it("rejects a Spanish number whose first and last characters are both digits", () => {
    expect(isValidTaxIdFormat("ES", "123456789")).toBe(false);
    expect(isValidTaxIdFormat("ES", "12345678A")).toBe(true);
  });

  it("accepts the second Irish pattern", () => {
    expect(isValidTaxIdFormat("IE", "1234567WA")).toBe(true);
  });

  it("accepts a 12-digit Lithuanian number", () => {
    expect(isValidTaxIdFormat("LT", "123456789012")).toBe(true);
  });
});

describe("normalizeTaxId", () => {
  it("strips spaces, dots, hyphens, and a matching country prefix", () => {
    expect(normalizeTaxId("it 123.456-78901", "IT")).toBe("12345678901");
    expect(normalizeTaxId("IT12345678901", "IT")).toBe("12345678901");
  });

  it("strips both EL and GR for Greece", () => {
    expect(normalizeTaxId("EL123456789", "GR")).toBe("123456789");
    expect(normalizeTaxId("gr123456789", "GR")).toBe("123456789");
  });

  it("keeps the XI prefix on a Northern Ireland number", () => {
    expect(normalizeTaxId("XI 123456789", "GB")).toBe("XI123456789");
    expect(isValidTaxIdFormat("GB", "XI123456789")).toBe(true);
    expect(viesMemberCode("GB", "XI123456789")).toBe("XI");
  });

  it("does not send a plain UK number to VIES", () => {
    expect(normalizeTaxId("GB123456789", "GB")).toBe("123456789");
    expect(viesMemberCode("GB", "123456789")).toBeNull();
    expect(viesMemberCode("IT", "12345678901")).toBe("IT");
    expect(viesMemberCode("GR", "123456789")).toBe("EL");
  });

  it("uses the generic rule only for the countries without a national pattern", () => {
    expect(GENERIC_TAX_ID_COUNTRIES).toHaveLength(18);
    expect(isValidTaxIdFormat("US", "ABC")).toBe(false);
    expect(isValidTaxIdFormat("US", "ABCD")).toBe(true);
  });
});
