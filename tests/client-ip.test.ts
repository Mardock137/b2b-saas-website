import { beforeEach, describe, expect, it, vi } from "vitest";

const headerGet = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => headerGet(name),
  }),
}));

const { getClientIp } = await import("@/lib/security/client-ip");

describe("getClientIp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the first address in x-forwarded-for", async () => {
    headerGet.mockImplementation((name: string) =>
      name === "x-forwarded-for" ? "203.0.113.10, 10.0.0.1" : null,
    );

    await expect(getClientIp()).resolves.toBe("203.0.113.10");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", async () => {
    headerGet.mockImplementation((name: string) =>
      name === "x-real-ip" ? "198.51.100.20" : null,
    );

    await expect(getClientIp()).resolves.toBe("198.51.100.20");
  });

  it("returns unknown when neither header is present", async () => {
    headerGet.mockReturnValue(null);

    await expect(getClientIp()).resolves.toBe("unknown");
  });
});
