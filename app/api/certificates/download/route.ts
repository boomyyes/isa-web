// GET ?t={token} -> 302 to a short-lived presigned R2 URL.
// GET ?t={token}&probe=1 -> the same outcome as JSON, so the page can recover in
// place rather than navigating the student onto an error.

import { type CertRecord } from "@/lib/certificates";
import { redisKey, verifyDownloadToken } from "@/lib/certificates.server";
import { redis } from "@/lib/redis";
import { objectExists, presignGet } from "@/lib/r2";

/** Long enough to follow the redirect, short enough that a copied URL is useless. */
const PRESIGN_TTL_SECONDS = 120;

type Reason = "expired" | "missing" | "unavailable";
type Outcome = { ok: true; url: string } | { ok: false; reason: Reason };

const STATUS: Record<Reason, number> = { expired: 403, missing: 404, unavailable: 503 };

const MESSAGE: Record<Reason, string> = {
  expired: "This download link has expired. Look up your certificate again.",
  missing: "That certificate hasn't been uploaded yet.",
  unavailable: "Certificate downloads are unavailable right now.",
};

async function resolve(token: string | null): Promise<Outcome> {
  if (!token) return { ok: false, reason: "expired" };

  let claim: ReturnType<typeof verifyDownloadToken>;
  try {
    claim = verifyDownloadToken(token);
  } catch {
    // A throw means CERT_TOKEN_SECRET is unset — config fault, not a bad token.
    return { ok: false, reason: "unavailable" };
  }
  if (!claim) return { ok: false, reason: "expired" };

  let record: CertRecord | null;
  try {
    record = await redis().get<CertRecord>(redisKey(claim.uid));
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const entry = record?.workshops?.[claim.workshopId];
  // Redis stays the authority, so a revoked attendance gets nothing.
  if (!record || !entry?.attended || !entry.cert) return { ok: false, reason: "missing" };

  const extension = entry.cert.includes(".") ? entry.cert.split(".").pop() : "png";
  const filename = `ISA-RAIT-${claim.workshopId}-${record.uid}.${extension}`;

  try {
    // Without this the redirect hands the student R2's raw XML "NoSuchKey" page.
    if (!(await objectExists(entry.cert))) return { ok: false, reason: "missing" };
    return { ok: true, url: await presignGet(entry.cert, PRESIGN_TTL_SECONDS, filename) };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** Direct hits land here with no React around them, so it ships its own page. */
function errorPage(reason: Reason): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Certificate unavailable — ISA RAIT</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem;
         background: #0B0F14; color: #F2F5F7;
         font: 16px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }
  main { max-width: 34rem; text-align: center; }
  h1 { font-size: 1.25rem; letter-spacing: 0.02em; margin: 0 0 0.75rem; }
  p { color: #8FA3AD; margin: 0 0 1.75rem; }
  a { display: inline-block; margin: 0.3rem; padding: 0.6rem 1.25rem; text-decoration: none;
      border: 1px solid #00E5FF; color: #00E5FF; font-size: 0.875rem; }
  a.muted { border-color: #2A3540; color: #8FA3AD; }
</style>
</head>
<body>
<main>
  <h1>Certificate unavailable</h1>
  <p>${MESSAGE[reason]}</p>
  <a href="/help">Contact Support</a>
  <a class="muted" href="/certificates">Back to Certificates</a>
</main>
</body>
</html>`;

  return new Response(html, {
    status: STATUS[reason],
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const outcome = await resolve(params.get("t"));

  if (params.get("probe") === "1") {
    return Response.json(
      outcome.ok
        ? { ok: true, url: outcome.url }
        : { ok: false, reason: outcome.reason, error: MESSAGE[outcome.reason] },
      {
        status: outcome.ok ? 200 : STATUS[outcome.reason],
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  if (!outcome.ok) return errorPage(outcome.reason);

  return new Response(null, {
    status: 302,
    headers: { Location: outcome.url, "Cache-Control": "no-store" },
  });
}
