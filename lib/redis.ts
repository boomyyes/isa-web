// Upstash speaks REST over HTTPS, so this works on any host and any runtime.

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let client: Redis | null = null;

// All of these are built lazily so a missing env var fails the request rather
// than `next build`.
export function redis(): Redis {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set");
  }

  client = new Redis({ url, token });
  return client;
}

let ipLimiter: Ratelimit | null = null;
let uidLimiter: Ratelimit | null = null;

/**
 * Deliberately loose — a campus shares one NATed address, so a tight cap would
 * lock out a whole lab. Real protection is the per-UID limiter below.
 */
export function lookupIpLimiter(): Ratelimit {
  if (ipLimiter) return ipLimiter;

  ipLimiter = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(30, "10 m"),
    prefix: "rl:cert-ip",
    // Keeps repeat hits from a warm instance off the 500k commands/mo budget.
    ephemeralCache: new Map(),
    analytics: false,
  });
  return ipLimiter;
}

/** UIDs are guessable, so the access code is the only real secret. */
export function lookupUidLimiter(): Ratelimit {
  if (uidLimiter) return uidLimiter;

  uidLimiter = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "rl:cert-uid",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return uidLimiter;
}

let resetIp: Ratelimit | null = null;
let resetUid: Ratelimit | null = null;

/** Tighter than sign-in: this endpoint sends email, so it's a spam vector. */
export function resetIpLimiter(): Ratelimit {
  if (resetIp) return resetIp;
  resetIp = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "rl:reset-ip",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return resetIp;
}

/** So one student can't be mail-bombed. */
export function resetUidLimiter(): Ratelimit {
  if (resetUid) return resetUid;
  resetUid = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "rl:reset-uid",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return resetUid;
}

/** `NextRequest.ip` was removed in Next 15. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
