import { describe, expect, it } from "vitest";

import {
  AUTH_CALLBACK_ERROR_CODES,
  AUTH_CALLBACK_ERROR_MESSAGES,
  isAuthCallbackErrorCode,
} from "@/lib/auth/callback-errors";

describe("isAuthCallbackErrorCode", () => {
  it("accepts the three known codes", () => {
    expect(isAuthCallbackErrorCode("link_expired")).toBe(true);
    expect(isAuthCallbackErrorCode("link_invalid")).toBe(true);
    expect(isAuthCallbackErrorCode("auth_failed")).toBe(true);
  });

  it("rejects null, an empty string, and arbitrary text", () => {
    expect(isAuthCallbackErrorCode(null)).toBe(false);
    expect(isAuthCallbackErrorCode("")).toBe(false);
    expect(isAuthCallbackErrorCode("otp_expired")).toBe(false);
    expect(isAuthCallbackErrorCode("please hack me")).toBe(false);
  });
});

describe("AUTH_CALLBACK_ERROR_MESSAGES", () => {
  it("has a non-empty message for every known code", () => {
    for (const code of AUTH_CALLBACK_ERROR_CODES) {
      expect(AUTH_CALLBACK_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });
});
