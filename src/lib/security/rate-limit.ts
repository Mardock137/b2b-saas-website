import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const CONTACT_RATE_LIMIT_PREFIX = "app:contact";
const SIGNUP_RATE_LIMIT_PREFIX = "app:signup";

type LimiterKind = "contact" | "signup";

type CachedRedis = {
  url: string;
  token: string;
  redis: Redis;
};

const cachedLimiters = new Map<LimiterKind, { url: string; token: string; ratelimit: Ratelimit }>();
let cachedRedis: CachedRedis | null = null;

function getRedis(url: string, token: string): Redis {
  if (cachedRedis && cachedRedis.url === url && cachedRedis.token === token) {
    return cachedRedis.redis;
  }

  const redis = new Redis({ url, token });
  cachedRedis = { url, token, redis };
  return redis;
}

function getLimiter(kind: LimiterKind, url: string, token: string): Ratelimit {
  const cached = cachedLimiters.get(kind);
  if (cached && cached.url === url && cached.token === token) {
    return cached.ratelimit;
  }

  const ratelimit = new Ratelimit({
    redis: getRedis(url, token),
    limiter:
      kind === "contact"
        ? Ratelimit.slidingWindow(3, "10 m")
        : Ratelimit.slidingWindow(10, "10 m"),
    prefix:
      kind === "contact" ? CONTACT_RATE_LIMIT_PREFIX : SIGNUP_RATE_LIMIT_PREFIX,
    analytics: false,
  });

  cachedLimiters.set(kind, { url, token, ratelimit });
  return ratelimit;
}

/**
 * Sliding window: 3 contact messages per 10 minutes per IP.
 * Fail-open when Upstash env vars are missing or the check throws,
 * so a Redis outage does not block real messages. Turnstile still runs.
 * In local development without the variables, the check is skipped.
 */
async function checkRateLimit(
  ip: string,
  kind: LimiterKind,
  logPrefix: string,
): Promise<{ allowed: boolean }> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.error(
      `${logPrefix} KV_REST_API_URL or KV_REST_API_TOKEN is not set. Skipping rate limit.`,
    );
    return { allowed: true };
  }

  try {
    const ratelimit = getLimiter(kind, url, token);
    const result = await ratelimit.limit(ip);
    return { allowed: result.success };
  } catch (error) {
    console.error(
      `${logPrefix} Upstash rate limit check failed. Allowing the request.`,
      error,
    );
    return { allowed: true };
  }
}

export async function checkContactRateLimit(
  ip: string,
): Promise<{ allowed: boolean }> {
  return checkRateLimit(ip, "contact", "[checkContactRateLimit]");
}

/**
 * Sliding window: 10 signup attempts per 10 minutes per IP.
 * Runs before the VIES call so a bot cannot use our server as an open
 * proxy onto the Commission service. Same fail-open rules as the contact limit.
 */
export async function checkSignupRateLimit(
  ip: string,
): Promise<{ allowed: boolean }> {
  return checkRateLimit(ip, "signup", "[checkSignupRateLimit]");
}
