import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockSignOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { signOut: mockSignOut } })),
}));

const { logoutAction } = await import("@/app/(site)/auth/actions");

describe("logoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates the layout and redirects home after a successful signOut", async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("logs a signOut error but still redirects home", async () => {
    const signOutError = { message: "network error" };
    mockSignOut.mockResolvedValueOnce({ error: signOutError });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");
    expect(consoleSpy).toHaveBeenCalledWith(
      "[logoutAction] Sign-out error:",
      signOutError,
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    consoleSpy.mockRestore();
  });
});
