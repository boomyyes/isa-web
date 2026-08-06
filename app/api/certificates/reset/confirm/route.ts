// POST { token } -> issues a new access code and returns it once, on screen.
//
// Single-use falls out of the token design: the payload carries a fingerprint of
// the password hash current when the link was minted, so changing the code
// invalidates every outstanding token. No used-token table needed.

import type { CertRecord } from "@/lib/certificates";
import {
  generatePassword,
  hashPassword,
  redisKey,
  verifyResetToken,
} from "@/lib/certificates.server";
import { clientIp, redis, resetIpLimiter } from "@/lib/redis";

export const runtime = "nodejs";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

const INVALID = {
  error: "This reset link has expired or has already been used. Request a new one.",
} as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const { token } = (body ?? {}) as { token?: unknown };
  if (typeof token !== "string" || token.length === 0 || token.length > 512) {
    return Response.json(INVALID, { status: 400, headers: PRIVATE_HEADERS });
  }

  try {
    const { success } = await resetIpLimiter().limit(clientIp(request));
    if (!success) {
      return Response.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: PRIVATE_HEADERS }
      );
    }
  } catch {
    return Response.json(
      { error: "Password reset is unavailable right now." },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  // Peek at the UID to load the record, then verify against that record's
  // current hash — which is what makes a replayed link fail.
  let uid: string;
  try {
    const encoded = token.slice(0, token.indexOf("."));
    const parts = Buffer.from(encoded, "base64url").toString("utf8").split(":");
    uid = Buffer.from(parts[0] ?? "", "base64url").toString("utf8");
    if (!uid || uid.length > 64) throw new Error("bad uid");
  } catch {
    return Response.json(INVALID, { status: 400, headers: PRIVATE_HEADERS });
  }

  let record: CertRecord | null;
  try {
    record = await redis().get<CertRecord>(redisKey(uid));
  } catch {
    return Response.json(
      { error: "Password reset is unavailable right now." },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  if (!record) return Response.json(INVALID, { status: 400, headers: PRIVATE_HEADERS });

  const claim = verifyResetToken(token, record.passwordHash);
  if (!claim || claim.uid !== record.uid) {
    return Response.json(INVALID, { status: 400, headers: PRIVATE_HEADERS });
  }

  const password = generatePassword();
  try {
    await redis().set(redisKey(record.uid), {
      ...record,
      passwordHash: await hashPassword(password),
      passwordEmailedAt: new Date().toISOString(),
    } satisfies CertRecord);
  } catch {
    return Response.json(
      { error: "Password reset is unavailable right now." },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  return Response.json(
    { ok: true, uid: record.uid, name: record.name, password },
    { headers: PRIVATE_HEADERS }
  );
}
