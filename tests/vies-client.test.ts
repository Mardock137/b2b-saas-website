import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { checkVatNumber } = await import("@/lib/tax-id/vies");

describe("checkVatNumber", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns valid when VIES accepts the number", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ valid: true, actionSucceed: true }),
    });

    await expect(checkVatNumber("IT", "12345678901")).resolves.toBe("valid");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      countryCode: "IT",
      vatNumber: "12345678901",
    });
  });

  it("returns invalid when VIES says the number is not registered", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ valid: false }),
    });

    await expect(checkVatNumber("IT", "12345678901")).resolves.toBe("invalid");
  });

  it("returns unavailable on a non-OK HTTP status", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ valid: false }),
    });

    await expect(checkVatNumber("IT", "12345678901")).resolves.toBe(
      "unavailable",
    );
  });

  it("returns unavailable when the request times out", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }),
    );

    const pending = checkVatNumber("IT", "12345678901");
    await vi.advanceTimersByTimeAsync(8_000);

    await expect(pending).resolves.toBe("unavailable");
  });

  it("returns unavailable when the body is not a VIES result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    });

    await expect(checkVatNumber("IT", "12345678901")).resolves.toBe(
      "unavailable",
    );
  });

  it("returns invalid when VIES rejects the number as INVALID_INPUT", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        actionSucceed: false,
        errorWrappers: [{ error: "INVALID_INPUT", message: "Invalid input" }],
      }),
    });

    await expect(checkVatNumber("IT", "123")).resolves.toBe("invalid");
  });

  it("returns invalid when a 200 response carries userError INVALID_INPUT", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ userError: "INVALID_INPUT" }),
    });

    await expect(checkVatNumber("IT", "123")).resolves.toBe("invalid");
  });

  it("returns unavailable when actionSucceed is false", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ actionSucceed: false, valid: true }),
    });

    await expect(checkVatNumber("IT", "12345678901")).resolves.toBe(
      "unavailable",
    );
  });

  it("returns unavailable when the response body cannot be parsed", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(checkVatNumber("DE", "123456789")).resolves.toBe("unavailable");
  });
});
