// Request a new access code.
//
// POST { uid } -> emails a reset LINK to the address on file.
//
// Two properties matter here:
//
//  1. The response is identical whether or not the UID exists. UIDs are
//     sequential, so anything else would confirm which ones are real.
//
//  2. It sends a link, not a new code. The student's existing code keeps working
//     until the link is actually opened from their inbox — so a stranger walking
//     UIDs can't lock people out of their own certificates, only send them an
//     email they can ignore. That is also why this is rate-limited far harder
//     than sign-in: it sends mail, so it is a spam vector.

import { normalizeUid, type CertRecord } from "@/lib/certificates";
import { redisKey, signResetToken, RESET_TTL_SECONDS } from "@/lib/certificates.server";
import { clientIp, redis, resetIpLimiter, resetUidLimiter } from "@/lib/redis";
import { mailerConfigured, sendResetEmail, siteUrl } from "@/lib/mailer";

export const runtime = "nodejs";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

/** Deliberately says nothing about whether the UID exists. */
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

  // From here on, every path returns ACCEPTED — no UID exists, no email on file,
  // and a successful send must all look the same from outside.
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
      // Swallowed on purpose: surfacing a send failure here would reveal that
      // the UID exists. The student can simply try again.
    }
  }

  return Response.json(ACCEPTED, { headers: PRIVATE_HEADERS });
}
