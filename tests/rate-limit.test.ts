import { beforeEach, describe, expect, it, vi } from "vitest";

const { limitMock, redisMock, ratelimitMock, slidingWindowMock } = vi.hoisted(
  () => ({
    limitMock: vi.fn(),
    redisMock: vi.fn(),
    ratelimitMock: vi.fn(),
    slidingWindowMock: vi.fn(() => "sliding-window-limiter"),
  }),
);

vi.mock("server-only", () => ({}));

vi.mock("@upstash/redis", () => ({
  Redis: class Redis {
    constructor(config: unknown) {
      redisMock(config);
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class Ratelimit {
    static slidingWindow = slidingWindowMock;

    limit = limitMock;

    constructor(config: unknown) {
      ratelimitMock(config);
    }
  },
}));

const { checkContactRateLimit, checkSignupRateLimit } = await import(
  "@/lib/security/rate-limit"
);

describe("checkContactRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "test-token";
  });

  it("allows a request inside the sliding window", async () => {
    limitMock.mockResolvedValueOnce({ success: true });

    const result = await checkContactRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: true });
    expect(limitMock).toHaveBeenCalledWith("203.0.113.10");
    expect(slidingWindowMock).toHaveBeenCalledWith(3, "10 m");
    expect(redisMock).toHaveBeenCalledWith({
      url: "https://example.upstash.io",
      token: "test-token",
    });
    expect(ratelimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "app:contact",
        limiter: "sliding-window-limiter",
        analytics: false,
      }),
    );
  });

  it("blocks a request that exceeds the limit", async () => {
    limitMock.mockResolvedValueOnce({ success: false });

    const result = await checkContactRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: false });
  });

  it("fails open when the Upstash check throws", async () => {
    const upstashError = new Error("redis unavailable");
    limitMock.mockRejectedValueOnce(upstashError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkContactRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[checkContactRateLimit] Upstash rate limit check failed. Allowing the request.",
      upstashError,
    );
    consoleSpy.mockRestore();
  });

  it("skips the check and allows the request when Upstash variables are missing", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkContactRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: true });
    expect(limitMock).not.toHaveBeenCalled();
    expect(redisMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[checkContactRateLimit] KV_REST_API_URL or KV_REST_API_TOKEN is not set. Skipping rate limit.",
    );
    consoleSpy.mockRestore();
  });
});

describe("checkSignupRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "test-token";
  });

  it("allows a signup inside the sliding window", async () => {
    limitMock.mockResolvedValueOnce({ success: true });

    const result = await checkSignupRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: true });
    expect(limitMock).toHaveBeenCalledWith("203.0.113.10");
    expect(slidingWindowMock).toHaveBeenCalledWith(10, "10 m");
    expect(ratelimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "app:signup",
        limiter: "sliding-window-limiter",
        analytics: false,
      }),
    );
  });

  it("blocks a signup that exceeds the limit", async () => {
    limitMock.mockResolvedValueOnce({ success: false });

    const result = await checkSignupRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: false });
  });

  it("fails open when the Upstash check throws", async () => {
    const upstashError = new Error("redis unavailable");
    limitMock.mockRejectedValueOnce(upstashError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkSignupRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[checkSignupRateLimit] Upstash rate limit check failed. Allowing the request.",
      upstashError,
    );
    consoleSpy.mockRestore();
  });

  it("skips the check and allows the signup when Upstash variables are missing", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await checkSignupRateLimit("203.0.113.10");

    expect(result).toEqual({ allowed: true });
    expect(limitMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[checkSignupRateLimit] KV_REST_API_URL or KV_REST_API_TOKEN is not set. Skipping rate limit.",
    );
    consoleSpy.mockRestore();
  });
});
