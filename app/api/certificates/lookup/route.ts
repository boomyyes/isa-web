// POST { uid, password } -> name + per-workshop eligibility.
//
// A credential check, not a convenience lookup: "no such UID" and "wrong code"
// return byte-identical responses, since UIDs are sequential and enumerable.

import { normalizeUid, type CertRecord } from "@/lib/certificates";
import { redisKey, toPublicView, verifyPassword } from "@/lib/certificates.server";
import { clientIp, lookupIpLimiter, lookupUidLimiter, redis } from "@/lib/redis";

/** The single failure body. Used for both failure modes — do not specialise it. */
const REJECTED = {
  error: "That UID and access code don't match.",
} as const;

const MAX_UID_LENGTH = 64;
const MAX_PASSWORD_LENGTH = 128;

/** Personal data — never let a CDN or browser hold on to it. */
const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

const tooMany = () =>
  Response.json(
    { error: "Too many attempts. Try again in a few minutes." },
    { status: 429, headers: PRIVATE_HEADERS }
  );

const unavailable = () =>
  Response.json(
    { error: "Certificate lookup is unavailable right now." },
    { status: 503, headers: PRIVATE_HEADERS }
  );

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const { uid: rawUid, password } = (body ?? {}) as { uid?: unknown; password?: unknown };

  // Hand-rolled validation: the repo carries no schema library and shouldn't
  // gain one for two string fields.
  if (
    typeof rawUid !== "string" ||
    typeof password !== "string" ||
    rawUid.length > MAX_UID_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH ||
    normalizeUid(rawUid).length === 0 ||
    password.trim().length === 0
  ) {
    return Response.json(
      { error: "Enter your UID and access code." },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  const uid = normalizeUid(rawUid);

  // Both limits are checked before touching the record, so a flood costs one
  // Redis round-trip rather than a scrypt verification.
  try {
    const [byIp, byUid] = await Promise.all([
      lookupIpLimiter().limit(clientIp(request)),
      lookupUidLimiter().limit(uid),
    ]);
    if (!byIp.success || !byUid.success) return tooMany();
  } catch {
    return unavailable();
  }

  let record: CertRecord | null;
  try {
    record = await redis().get<CertRecord>(redisKey(uid));
  } catch {
    return unavailable();
  }

  if (!record || !record.passwordHash) {
    return Response.json(REJECTED, { status: 401, headers: PRIVATE_HEADERS });
  }

  const valid = await verifyPassword(password, record.passwordHash);
  if (!valid) {
    return Response.json(REJECTED, { status: 401, headers: PRIVATE_HEADERS });
  }

  return Response.json(toPublicView(record), { headers: PRIVATE_HEADERS });
}
