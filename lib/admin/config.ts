// Shared by proxy.ts (no server-only there) and the admin pages and routes.

/** The host that serves the admin area. Also hardcoded in proxy.ts's matcher. */
export const ADMIN_HOST = "admin.isarait.in";

/**
 * Off production, the admin area is also reachable at /admin on any host, so it
 * can be tested on preview URLs and localhost, where there is no admin.
 * subdomain. Previews sit behind Vercel's own login as well.
 */
export const pathModeAllowed = () => process.env.VERCEL_ENV !== "production";

export const isAdminHost = (host: string | null) => host === ADMIN_HOST;

/**
 * Prefix for links inside the admin area: empty on the admin host, where the
 * proxy maps "/x" to "/admin/x", and "/admin" everywhere else.
 */
export const adminBase = (host: string | null) => (isAdminHost(host) ? "" : "/admin");

/** __Host- pins the cookie to this exact host, HTTPS, and path "/". */
export const SESSION_COOKIE = "__Host-admin";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const LOGIN_TTL_SECONDS = 10 * 60;
