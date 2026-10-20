// Error reporting to Sentry, server-side only: no browser SDK, so the CSP and
// the client bundle are untouched. Without SENTRY_DSN it stays off.

import type { Instrumentation } from "next";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? "development",
    // Nothing about the request or its data: bodies hold student form data,
    // cookies the admin session, query strings can carry an email (inbox
    // search), and a crashing function's locals can hold any of those.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
    // Every console.error("[area] ...") the routes already log, caught or not.
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  });
}

/**
 * Page and route errors that reached Next. Tagged with the digest, which the
 * error pages show as "Ref", so a ref a member reports can be searched for.
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  Sentry.withScope((scope) => {
    if (digest) scope.setTag("digest", digest);
    Sentry.captureRequestError(err, request, context);
  });
};
