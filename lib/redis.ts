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

let uidCapLimiter: Ratelimit | null = null;

/**
 * UIDs are guessable, so the access code is the only real secret. Keyed by
 * UID + network, so a stranger's failed guesses don't lock the student out;
 * lookupUidCapLimiter is the backstop against guessing from many networks.
 */
export function lookupUidLimiter(): Ratelimit {
  if (uidLimiter) return uidLimiter;

  uidLimiter = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "rl:cert-uid-ip",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return uidLimiter;
}

/** Per UID across all networks. Loose enough that one attacker can't easily exhaust it. */
export function lookupUidCapLimiter(): Ratelimit {
  if (uidCapLimiter) return uidCapLimiter;

  uidCapLimiter = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(50, "1 h"),
    prefix: "rl:cert-uid",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return uidCapLimiter;
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

let formIp: Ratelimit | null = null;
let formEmail: Ratelimit | null = null;

/** Public forms. Loose per IP for the same NAT reason as sign-in. */
export function formIpLimiter(): Ratelimit {
  if (formIp) return formIp;
  formIp = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "rl:form-ip",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return formIp;
}

/** Keyed by form + email, so one address can't flood a form from many IPs. */
export function formEmailLimiter(): Ratelimit {
  if (formEmail) return formEmail;
  formEmail = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(3, "1 d"),
    prefix: "rl:form-email",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return formEmail;
}

let formAnonIp: Ratelimit | null = null;

/**
 * Anonymous submissions on top of formIpLimiter: with no email there's no
 * per-person limit, so the per-network one is tighter. Still not very tight,
 * since a whole campus can share one address.
 */
export function formAnonIpLimiter(): Ratelimit {
  if (formAnonIp) return formAnonIp;
  formAnonIp = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "rl:form-anon-ip",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return formAnonIp;
}

/**
 * `NextRequest.ip` was removed in Next 15. Headers the platform sets itself come
 * first; in X-Forwarded-For the client can write the leading entries, so only
 * the last one (added by the nearest proxy) is trusted.
 */
export function clientIp(request: Request): string {
  const platform = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip");
  if (platform) return platform.split(",")[0].trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)!.trim();
  return "unknown";
}
