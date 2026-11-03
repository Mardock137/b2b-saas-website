import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock "server-only" so it doesn't throw outside the Next.js runtime.
vi.mock("server-only", () => ({}));

// Shared mock for the Supabase query chain.
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

// Import the helper AFTER mocks are in place.
const { getProductNameBySlug } = await import("@/lib/products/queries");

describe("getProductNameBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the chain after each clear.
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("returns the product name when the slug is found", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { name: "Frontline" },
      error: null,
    });

    const result = await getProductNameBySlug("frontline");

    expect(result).toBe("Frontline");
    expect(mockFrom).toHaveBeenCalledWith("products");
    expect(mockEq).toHaveBeenCalledWith("slug", "frontline");
  });

  it("returns null when the slug is not found (data is null)", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getProductNameBySlug("unknown-slug");

    expect(result).toBeNull();
  });

  it("returns null and logs when Supabase returns an error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await getProductNameBySlug("frontline");

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[getProductNameBySlug]"),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });
});
