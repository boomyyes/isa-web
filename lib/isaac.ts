/**
 * Version token for the ISAAC magazine cover.
 *
 * The cover is fetched from a fixed Google Drive file ID, so replacing the
 * artwork in Drive does not change any URL — and three separate caches will
 * happily keep serving the old bytes:
 *
 *   1. the route's own fetch cache (`revalidate` in app/api/isaac-cover),
 *   2. the next/image optimizer, whose TTL is max(minimumCacheTTL, upstream
 *      max-age) and which Next documents as having no invalidation mechanism
 *      other than changing the src,
 *   3. the browser and any CDN, via Cache-Control.
 *
 * Threading this token through the URL is what changes the cache key for all
 * three at once. Bump it whenever the Drive file's contents change; the value
 * is arbitrary, so a date is used because it also records when the swap
 * happened. Forgetting to bump it is not fatal — the caches still expire on
 * their own, it just takes up to a day.
 */
export const ISAAC_COVER_VERSION = "2026-08-10";

/** Same-origin proxy path used by the <Image>. Never the Drive URL. */
export const ISAAC_COVER_SRC = `/api/isaac-cover?v=${ISAAC_COVER_VERSION}`;
