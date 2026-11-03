import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockUpdateSession = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

const { proxy } = await import("@/proxy");

function makeRequest(
  path: string,
  opts: { country?: string } = {},
): NextRequest {
  const headers = new Headers();
  if (opts.country) headers.set("x-vercel-ip-country", opts.country);
  return new NextRequest(new URL(path, "https://example.com"), { headers });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
  });

  it("rewrites disallowed countries to /blocked with 403", async () => {
    const request = makeRequest("/products", { country: "XX" });

    const response = await proxy(request);

    expect(response.status).toBe(403);
    expect(response.headers.get("x-middleware-rewrite")).toContain("/blocked");
    expect(mockUpdateSession).not.toHaveBeenCalled();
  });

  it("lets a whitelisted country through", async () => {
    const request = makeRequest("/products", { country: "US" });

    await proxy(request);

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("redirects unauthenticated users away from /dashboard", async () => {
    const request = makeRequest("/dashboard", { country: "IT" });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth/login");
    expect(location.searchParams.get("next")).toBe("/dashboard");
  });

  it("lets authenticated users through to /dashboard", async () => {
    const passthrough = NextResponse.next();
    mockUpdateSession.mockResolvedValueOnce({
      response: passthrough,
      user: { id: "user-1" },
    });
    const request = makeRequest("/dashboard", { country: "IT" });

    const response = await proxy(request);

    expect(response).toBe(passthrough);
  });

  it("redirects authenticated users away from /auth/login", async () => {
    mockUpdateSession.mockResolvedValueOnce({
      response: NextResponse.next(),
      user: { id: "user-1" },
    });
    const request = makeRequest("/auth/login", { country: "IT" });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
  });

  it("lets unauthenticated users see /auth/login", async () => {
    const passthrough = NextResponse.next();
    mockUpdateSession.mockResolvedValueOnce({
      response: passthrough,
      user: null,
    });
    const request = makeRequest("/auth/login", { country: "IT" });

    const response = await proxy(request);

    expect(response).toBe(passthrough);
    expect(response.headers.get("location")).toBeNull();
  });
});
