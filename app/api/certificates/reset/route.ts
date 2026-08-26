// POST { uid } -> emails a reset link to the address on file.
//
// Sends a link rather than a new code, so a stranger walking UIDs can't lock
// anyone out — only send them an email they can ignore. The response is identical
// whether or not the UID exists.

import { normalizeUid, type CertRecord } from "@/lib/certificates";
import { redisKey, signResetToken, RESET_TTL_SECONDS } from "@/lib/certificates.server";
import { clientIp, redis, resetIpLimiter, resetUidLimiter } from "@/lib/redis";
import { mailerConfigured, sendResetEmail, siteUrl } from "@/lib/mailer";

export const runtime = "nodejs";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

/** Says nothing about whether the UID exists. */
const ACCEPTED = {
  ok: true,
  message: "If that UID is on our roster, we've emailed a reset link to the address on file.",
} as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const { uid: rawUid } = (body ?? {}) as { uid?: unknown };
  if (typeof rawUid !== "string" || rawUid.length > 64 || normalizeUid(rawUid).length === 0) {
    return Response.json({ error: "Enter your UID." }, { status: 400, headers: PRIVATE_HEADERS });
  }
  const uid = normalizeUid(rawUid);

  try {
    const [byIp, byUid] = await Promise.all([
      resetIpLimiter().limit(clientIp(request)),
      resetUidLimiter().limit(uid),
    ]);
    if (!byIp.success || !byUid.success) {
      return Response.json(
        { error: "Too many reset requests. Try again later." },
        { status: 429, headers: PRIVATE_HEADERS }
      );
    }
  } catch {
    return Response.json(
      { error: "Password reset is unavailable right now." },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  if (!mailerConfigured()) {
    return Response.json(
      { error: "Password reset is unavailable right now." },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  let record: CertRecord | null = null;
  try {
    record = await redis().get<CertRecord>(redisKey(uid));
  } catch {
    return Response.json(
      { error: "Password reset is unavailable right now." },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  // Every path below returns ACCEPTED: no such UID, no email on file, and a
  // successful send must look identical from outside.
  if (record?.email) {
    const token = signResetToken(uid, record.passwordHash);
    const link = `${siteUrl()}/certificates/reset?t=${encodeURIComponent(token)}`;
    try {
      await sendResetEmail({
        to: record.email,
        name: record.name,
        uid: record.uid,
        link,
        expiresMinutes: Math.round(RESET_TTL_SECONDS / 60),
      });
    } catch {
      // Swallowed: surfacing a send failure would reveal the UID exists.
    }
  }

  return Response.json(ACCEPTED, { headers: PRIVATE_HEADERS });
}
