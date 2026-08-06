// Server-only certificate helpers: access-code hashing, download-token signing,
// and the record -> public view projection that strips PII.
//
// Never import this from a "use client" component — it pulls in node:crypto and
// reads a server-only secret.

import {
  createHmac,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  WORKSHOPS,
  normalizePassword,
  type CertRecord,
  type PublicCertView,
  type PublicWorkshopView,
  type WorkshopId,
} from "./certificates";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>;

/** How long a download token stays valid. Long enough to click, short enough to not be a share link. */
const TOKEN_TTL_SECONDS = 600;

// scrypt cost. N=16384 lands around 50-100ms per verification — slow enough to
// make offline cracking expensive, fast enough for a serverless request.
const SCRYPT = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;

function secret(): string {
  const value = process.env.CERT_TOKEN_SECRET;
  // Read lazily rather than at module load, so a missing secret surfaces as a
  // runtime 500 on the endpoint instead of breaking `next build`.
  if (!value) throw new Error("CERT_TOKEN_SECRET is not set");
  return value;
}

/** Redis key for a student. The UID is the primary key. */
export function redisKey(uid: string): string {
  return `cert:${uid}`;
}

// ------------------------------------------------------------------ passwords

/**
 * Alphabet with no O/0 or I/1/L — students read these codes off a screen or a
 * printout and type them back, so ambiguous glyphs cause avoidable failures.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * A fresh access code, e.g. "K7P2-9XQM".
 *
 * 31^8 ≈ 8.5e11 (~40 bits). Combined with the per-UID rate limit that is far
 * out of brute-force reach, while staying short enough to type.
 *
 * Returns the display form; hash the normalised form (see normalizePassword).
 */
export function generatePassword(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    // randomInt is rejection-sampled, so no modulo bias across the alphabet.
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Hash an access code for storage. Format: scrypt$N$r$p$salt$hash (all base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(normalizePassword(password), salt, KEY_LENGTH, SCRYPT);
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Check an access code against a stored hash.
 *
 * Returns false rather than throwing on a malformed stored value, so a corrupt
 * record fails closed instead of 500-ing the endpoint.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  let expected: Buffer;
  let derived: Buffer;
  try {
    expected = Buffer.from(parts[5], "base64");
    derived = await scrypt(normalizePassword(password), Buffer.from(parts[4], "base64"), expected.length, { N, r, p });
  } catch {
    return false;
  }

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// --------------------------------------------------------------------- tokens

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

/**
 * Mint a download token for one student + one workshop.
 *
 * The token asserts *identity* only. Eligibility is re-checked against Redis at
 * download time, so revoking someone's attendance takes effect immediately even
 * if they are holding an unexpired token.
 */
export function signDownloadToken(
  uid: string,
  workshopId: WorkshopId,
  ttlSeconds: number = TOKEN_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  // UID is base64url'd as part of the payload, so a UID containing ":" can't
  // forge extra fields.
  const encoded = Buffer.from(
    `${Buffer.from(uid, "utf8").toString("base64url")}:${workshopId}:${exp}`,
    "utf8"
  ).toString("base64url");
  // Sign the encoded form, so verification never depends on a decode round-trip.
  return `${encoded}.${sign(encoded)}`;
}

export function verifyDownloadToken(
  token: string
): { uid: string; workshopId: WorkshopId } | null {
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;

  const encoded = token.slice(0, dot);
  const provided = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(encoded));
  // timingSafeEqual throws on length mismatch, so check that first. The length
  // itself is not a secret — the signature is fixed-width.
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  const parts = Buffer.from(encoded, "base64url").toString("utf8").split(":");
  if (parts.length !== 3) return null;
  const [encodedUid, workshopId, expStr] = parts;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  const uid = Buffer.from(encodedUid, "base64url").toString("utf8");
  if (!uid || !workshopId) return null;

  return { uid, workshopId };
}

// ---------------------------------------------------------------- public view

/**
 * Project a stored record into what the browser is allowed to see.
 *
 * Drops `email`, `college`, `passwordHash` and the R2 object keys entirely —
 * the response carries the student's name and their eligibility, nothing else.
 */
export function toPublicView(record: CertRecord): PublicCertView {
  const workshops: PublicWorkshopView[] = WORKSHOPS.map((meta) => {
    const entry = record.workshops?.[meta.id];
    const attended = entry?.attended === true;

    return {
      id: meta.id,
      title: meta.title,
      date: meta.date,
      attended,
      // Not attended -> no physical copy is offered at all. Otherwise the first
      // copy is free and any copy after the one already collected is chargeable.
      physical: attended ? (entry?.received ? "chargeable" : "free") : null,
      // No token when there is nothing to download — an attended student whose
      // image hasn't been uploaded yet gets the physical route only.
      downloadToken:
        attended && entry?.cert ? signDownloadToken(record.uid, meta.id) : null,
    };
  });

  return { name: record.name, workshops };
}
