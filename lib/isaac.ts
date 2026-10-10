import issueJson from "@/content/site/isaac-issue.json";

/**
 * Largest issue PDF the admin upload accepts. The server reads the whole file
 * into memory to check it and, on each cold start, to render pages, so this is
 * bounded by function memory and the 60 s publish limit, not by R2.
 */
export const ISAAC_MAX_UPLOAD_MB = 250;
export const ISAAC_MAX_UPLOAD_BYTES = ISAAC_MAX_UPLOAD_MB * 1024 * 1024;

/**
 * The current issue, written only by the admin upload page
 * (app/api/admin/content/isaac-issue). `pdf` is a key in the private R2 bucket,
 * or "" while the issue still comes from the Drive env vars. The key isn't a
 * secret — the bucket is private — so it's fine in this public repository.
 * `previous` is the issue before it, kept until the next upload so the live
 * site can keep serving it while the new one deploys.
 */
export type IsaacIssue = { version: string; pdf: string; previous: string; uploadedAt?: string };
export const ISAAC_ISSUE = issueJson as IsaacIssue;

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
 * three at once. It lives in content/site/isaac-issue.json: uploading an issue
 * from the admin area writes a new one automatically. With the older Drive
 * setup it still has to be bumped by hand in that file whenever the Drive
 * files' contents change. Forgetting is not fatal — the caches still expire on
 * their own, it just takes up to a day.
 *
 * The name is historical: it versions every page, not only the cover.
 */
export const ISAAC_COVER_VERSION = ISAAC_ISSUE.version;

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
