// GET ?t={token} -> 302 to a short-lived presigned R2 URL.

import { type CertRecord } from "@/lib/certificates";
import { redisKey, verifyDownloadToken } from "@/lib/certificates.server";
import { redis } from "@/lib/redis";
import { presignGet } from "@/lib/r2";

/** Long enough to follow the redirect, short enough that a copied URL is useless. */
const PRESIGN_TTL_SECONDS = 120;

function fail(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  if (!token) return fail("Missing download token.", 400);

  // A throw means CERT_TOKEN_SECRET is unset — config fault, not a bad token.
  let claim: ReturnType<typeof verifyDownloadToken>;
  try {
    claim = verifyDownloadToken(token);
  } catch {
    return fail("Certificate download is unavailable right now.", 503);
  }
  if (!claim) return fail("This download link has expired. Look up your certificate again.", 403);

  let record: CertRecord | null;
  try {
    record = await redis().get<CertRecord>(redisKey(claim.uid));
  } catch {
    return fail("Certificate download is unavailable right now.", 503);
  }

  const entry = record?.workshops?.[claim.workshopId];
  // Redis stays the authority, so a revoked attendance gets nothing.
  if (!record || !entry?.attended || !entry.cert) {
    return fail("No certificate is available for this workshop.", 404);
  }

  const extension = entry.cert.includes(".") ? entry.cert.split(".").pop() : "png";
  const filename = `ISA-RAIT-${claim.workshopId}-${record.uid}.${extension}`;

  let url: string;
  try {
    url = await presignGet(entry.cert, PRESIGN_TTL_SECONDS, filename);
  } catch {
    return fail("Certificate download is unavailable right now.", 503);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store" },
  });
}
