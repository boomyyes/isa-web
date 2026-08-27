/**
 * Version token for the ISAAC magazine artwork.
 *
 * Pages are fetched from fixed Google Drive file IDs, so replacing artwork in
 * Drive does not change any URL — and three separate caches will happily keep
 * serving the old bytes:
 *
 *   1. the routes' own fetch cache (`revalidate` in app/api/isaac-cover and
 *      app/api/isaac-page),
 *   2. the next/image optimizer, whose TTL is max(minimumCacheTTL, upstream
 *      max-age) and which Next documents as having no invalidation mechanism
 *      other than changing the src,
 *   3. the browser and any CDN, via Cache-Control.
 *
 * Threading this token through the URL is what changes the cache key for all
 * three at once. Bump it whenever the Drive files' contents change; the value
 * is arbitrary, so a date is used because it also records when the swap
 * happened. Forgetting to bump it is not fatal — the caches still expire on
 * their own, it just takes up to a day.
 *
 * The name is historical: it versions every page, not only the cover.
 */
export const ISAAC_COVER_VERSION = "2026-08-27c";

/** Same-origin proxy path used by the spotlight <Image>. Never the Drive URL. */
export const ISAAC_COVER_SRC = `/api/isaac-cover?v=${ISAAC_COVER_VERSION}`;

/**
 * Same-origin proxy path for one page of the reader. `index` is 0-based and
 * 0 is the cover. Like ISAAC_COVER_SRC this is deliberately not a Drive URL —
 * the file IDs never leave the server. See lib/isaac.server.ts.
 */
export function isaacPageSrc(index: number): string {
  return `/api/isaac-page/${index}?v=${ISAAC_COVER_VERSION}`;
}

/**
 * Aspect ratio (width / height) of one page. The artwork is A4 at 2480x3508
 * and the whole issue is laid out to that trim size, so the reader sizes its
 * paper once from this constant rather than per image. Any page whose own
 * ratio differs is letterboxed inside the paper (object-contain), never
 * cropped — a cropped magazine page loses text.
 */
export const ISAAC_PAGE_ASPECT = 2480 / 3508;

/**
 * True when a request carries the current cache-busting token.
 *
 * next.config.ts allows any query string on the ISAAC proxy paths, so this is
 * what stops a visitor minting unlimited next/image optimizer cache entries by
 * varying ?v=. Checked per request rather than pinned in the config: the config
 * is read once at startup, so pinning it there meant every token bump needed a
 * server restart to stay in step, and a mismatch rejected every page image.
 */
export function isCurrentVersion(url: string): boolean {
  try {
    return new URL(url).searchParams.get("v") === ISAAC_COVER_VERSION;
  } catch {
    return false;
  }
}
