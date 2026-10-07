// The site's Content-Security-Policy, shared by next.config.ts (public pages)
// and proxy.ts (admin pages, which also allow the live-chat connection).
//
// 'unsafe-inline' for scripts is deliberate: a nonce-based policy needs
// middleware and forces every page to render dynamically, which throws away the
// static prerendering the site depends on. This still blocks third-party
// scripts, exfiltration via connect-src, framing and <base> hijacking.
// Production only — `next dev` needs 'unsafe-eval' for fast refresh.
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  // The support and Artemis forms are embedded from these.
  "frame-src https://tally.so https://docs.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];
