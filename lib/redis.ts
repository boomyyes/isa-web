// Upstash Redis client for the certificate roster.
//
// Upstash speaks REST over HTTPS rather than the Redis wire protocol, so this
// works on any host and any runtime (including edge) — nothing here ties the
// site to a particular deployment target.

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let client: Redis | null = null;

/**
 * Lazily-constructed singleton. Built on first use rather than at module load
 * so a missing env var fails the request, not `next build`.
 */
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
 * Per-IP limiter — 30 attempts per 10 minutes.
 *
 * Deliberately loose. Students on campus wifi share one NATed address, so a
 * tight per-IP cap would lock out a whole lab the moment a few people fumble
 * their code. This exists to blunt naive floods; the real protection against
 * guessing is the per-UID limiter below.
 */
export function lookupIpLimiter(): Ratelimit {
  if (ipLimiter) return ipLimiter;

  ipLimiter = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(30, "10 m"),
    prefix: "rl:cert-ip",
    // Keeps repeat hits from the same warm instance off the network, which
    // matters against the 500k commands/mo free tier.
    ephemeralCache: new Map(),
    analytics: false,
  });
  return ipLimiter;
}

/**
 * Per-UID limiter — 10 attempts per 10 minutes.
 *
 * UIDs are sequential and therefore guessable, so the access code is the only
 * real secret. This caps guesses against a single student regardless of how
 * many addresses the attempts come from.
 */
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

/**
 * Reset requests, per IP — 5 per hour.
 *
 * Much tighter than sign-in because this endpoint *sends email*. Loose limits
 * here would turn the site into an open relay for spamming students' inboxes.
 */
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

/** Reset requests, per UID — 3 per hour, so one student can't be mail-bombed. */
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

/**
 * Best-effort client IP. `NextRequest.ip` was removed in Next 15, and every
 * host we might deploy to (Vercel, Cloudflare, Netlify) sets one of these.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
