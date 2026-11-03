import "server-only";

const CHECK_VAT_URL =
  "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

const VIES_TIMEOUT_MS = 8_000;

export type VatCheckResult = "valid" | "invalid" | "unavailable";

type ViesErrorWrapper = {
  error?: unknown;
};

type ViesResponse = {
  valid?: unknown;
  actionSucceed?: unknown;
  userError?: unknown;
  error?: unknown;
  errorWrappers?: ViesErrorWrapper[] | null;
};

function isInvalidInput(data: ViesResponse | null | undefined): boolean {
  if (!data) {
    return false;
  }

  if (data.userError === "INVALID_INPUT" || data.error === "INVALID_INPUT") {
    return true;
  }

  return (
    Array.isArray(data.errorWrappers) &&
    data.errorWrappers.some((item) => item?.error === "INVALID_INPUT")
  );
}

/**
 * Asks the European Commission's VIES REST API whether a VAT number is
 * registered. Never throws. Network errors, non-2xx responses, actionSucceed
 * false, and unreadable bodies are "unavailable". INVALID_INPUT (a number
 * VIES refuses) is "invalid", so the visitor sees "not found" instead of
 * a temporary outage. The VAT number is not logged.
 *
 * Contract: https://ec.europa.eu/assets/taxud/vow-information/swagger_publicVAT.yaml
 */
export async function checkVatNumber(
  countryCode: string,
  vatNumber: string,
): Promise<VatCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VIES_TIMEOUT_MS);

  try {
    const response = await fetch(CHECK_VAT_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ countryCode, vatNumber }),
      signal: controller.signal,
    });

    let data: ViesResponse | null = null;
    try {
      data = (await response.json()) as ViesResponse;
    } catch {
      data = null;
    }

    if (isInvalidInput(data)) {
      return "invalid";
    }

    if (!response.ok) {
      console.error(
        "[checkVatNumber] VIES HTTP error:",
        response.status,
        "country:",
        countryCode,
      );
      return "unavailable";
    }

    if (!data) {
      console.error(
        "[checkVatNumber] Unreadable VIES response. country:",
        countryCode,
      );
      return "unavailable";
    }

    if (data.actionSucceed === false) {
      console.error(
        "[checkVatNumber] VIES reported actionSucceed false. country:",
        countryCode,
      );
      return "unavailable";
    }

    if (typeof data?.valid !== "boolean") {
      console.error(
        "[checkVatNumber] Unreadable VIES response. country:",
        countryCode,
      );
      return "unavailable";
    }

    return data.valid ? "valid" : "invalid";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[checkVatNumber] VIES request failed. country:",
      countryCode,
      message.replaceAll(vatNumber, "[redacted]"),
    );
    return "unavailable";
  } finally {
    clearTimeout(timeout);
  }
}
