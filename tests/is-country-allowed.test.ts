import { describe, expect, it } from "vitest";

import { isCountryAllowed } from "@/lib/geo/allowed-countries";

describe("isCountryAllowed", () => {
  it("returns true for a country in the whitelist (uppercase)", () => {
    expect(isCountryAllowed("IT")).toBe(true);
    expect(isCountryAllowed("US")).toBe(true);
    expect(isCountryAllowed("DE")).toBe(true);
    expect(isCountryAllowed("JP")).toBe(true);
  });

  it("returns false for a country not in the whitelist", () => {
    expect(isCountryAllowed("CN")).toBe(false);
    expect(isCountryAllowed("RU")).toBe(false);
    expect(isCountryAllowed("BR")).toBe(false);
    expect(isCountryAllowed("IN")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isCountryAllowed(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isCountryAllowed(undefined)).toBe(false);
  });

  it("handles lowercase country codes correctly", () => {
    expect(isCountryAllowed("it")).toBe(true);
    expect(isCountryAllowed("us")).toBe(true);
    expect(isCountryAllowed("cn")).toBe(false);
  });

  it("returns false for unknown or empty codes", () => {
    expect(isCountryAllowed("XX")).toBe(false);
    expect(isCountryAllowed("ZZ")).toBe(false);
    expect(isCountryAllowed("")).toBe(false);
  });
});
