/**
 * True when a POST came from a page on the same host. Browsers always send
 * Origin on POST (fetch and plain form submits alike), so a missing header is
 * treated as foreign. This is the CSRF check for every state-changing route.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
