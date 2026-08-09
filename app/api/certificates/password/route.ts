// POST { uid, password, newPassword } -> replaces a student's own access code.
//
// Guarded by the current code, so it is a credential check like lookup — and it
// returns lookup's failure body verbatim, or it would become the enumeration
// oracle that lookup deliberately isn't.

import {
  normalizeUid,
  validateAccessCode,
  type CertRecord,
} from "@/lib/certificates";
import { hashPassword, redisKey, verifyPassword } from "@/lib/certificates.server";
import { clientIp, lookupIpLimiter, lookupUidLimiter, redis } from "@/lib/redis";

export const runtime = "nodejs";

/** Byte-identical to lookup's REJECTED — do not specialise it. */
const REJECTED = {
  error: "That UID and access code don't match.",
} as const;

const MAX_UID_LENGTH = 64;
const MAX_PASSWORD_LENGTH = 128;

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

const tooMany = () =>
  Response.json(
    { error: "Too many attempts. Try again in a few minutes." },
    { status: 429, headers: PRIVATE_HEADERS }
  );

const unavailable = () =>
  Response.json(
    { error: "Changing your access code is unavailable right now." },
    { status: 503, headers: PRIVATE_HEADERS }
  );

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const { uid: rawUid, password, newPassword } = (body ?? {}) as {
    uid?: unknown;
    password?: unknown;
    newPassword?: unknown;
  };

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

  // Checked before the record is touched, so a flood costs one Redis round-trip
  // rather than two scrypt runs.
  const uid = normalizeUid(rawUid);
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
  if (!(await verifyPassword(password, record.passwordHash))) {
    return Response.json(REJECTED, { status: 401, headers: PRIVATE_HEADERS });
  }

  // After the credential check: an unauthenticated caller learns nothing about
  // our rules, and gets the same 401 either way.
  const problem = validateAccessCode(newPassword);
  if (problem) {
    return Response.json({ error: problem }, { status: 400, headers: PRIVATE_HEADERS });
  }

  try {
    await redis().set(redisKey(record.uid), {
      ...record,
      passwordHash: await hashPassword(newPassword as string),
      // passwordEmailedAt stays put — they chose this one, we never sent it.
    } satisfies CertRecord);
  } catch {
    return unavailable();
  }

  return Response.json({ ok: true }, { headers: PRIVATE_HEADERS });
}
