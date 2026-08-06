// Server-only: hashing, token signing, and the projection that strips PII.
// Never import from a "use client" component.

import {
  createHash,
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

const TOKEN_TTL_SECONDS = 600;

/** N=16384 is ~50-100ms per verification: costly to crack, fine for a request. */
const SCRYPT = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;

function secret(): string {
  const value = process.env.CERT_TOKEN_SECRET;
  if (!value) throw new Error("CERT_TOKEN_SECRET is not set");
  return value;
}

export function redisKey(uid: string): string {
  return `cert:${uid}`;
}

// ------------------------------------------------------------------ passwords

/** No O/0 or I/1/L — students read these off a screen and type them back. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** e.g. "K7P2-9XQM". 31^8 ≈ 40 bits, well out of brute-force reach. */
export function generatePassword(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    // randomInt is rejection-sampled, so no modulo bias.
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Format: scrypt$N$r$p$salt$hash */
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

/** Returns false rather than throwing, so a corrupt record fails closed. */
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
 * Asserts identity only — eligibility is re-checked against Redis at download
 * time, so revoking attendance takes effect even on an unexpired token.
 */
export function signDownloadToken(
  uid: string,
  workshopId: WorkshopId,
  ttlSeconds: number = TOKEN_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  // UID is base64url'd so one containing ":" can't forge extra fields.
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
  // timingSafeEqual throws on length mismatch, and the length isn't secret.
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

// --------------------------------------------------------------- reset tokens

export const RESET_TTL_SECONDS = 1800;

/**
 * Baked into reset tokens to make them single-use for free: changing the code
 * changes the fingerprint, so every outstanding link stops verifying.
 */
function passwordFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export function signResetToken(
  uid: string,
  passwordHash: string,
  ttlSeconds: number = RESET_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const encoded = Buffer.from(
    [
      Buffer.from(uid, "utf8").toString("base64url"),
      passwordFingerprint(passwordHash),
      exp,
    ].join(":"),
    "utf8"
  ).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** `currentPasswordHash` comes from the record being reset. */
export function verifyResetToken(
  token: string,
  currentPasswordHash: string
): { uid: string } | null {
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;

  const encoded = token.slice(0, dot);
  const provided = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(encoded));
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  const parts = Buffer.from(encoded, "base64url").toString("utf8").split(":");
  if (parts.length !== 3) return null;
  const [encodedUid, fingerprint, expStr] = parts;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  const expectedFingerprint = Buffer.from(passwordFingerprint(currentPasswordHash));
  const providedFingerprint = Buffer.from(fingerprint);
  if (providedFingerprint.length !== expectedFingerprint.length) return null;
  if (!timingSafeEqual(providedFingerprint, expectedFingerprint)) return null;

  const uid = Buffer.from(encodedUid, "base64url").toString("utf8");
  return uid ? { uid } : null;
}

// ---------------------------------------------------------------- public view

/** Drops email, college, the hash and the R2 keys. */
export function toPublicView(record: CertRecord): PublicCertView {
  const workshops: PublicWorkshopView[] = WORKSHOPS.map((meta) => {
    const entry = record.workshops?.[meta.id];
    const attended = entry?.attended === true;

    return {
      id: meta.id,
      title: meta.title,
      date: meta.date,
      attended,
      physical: attended ? (entry?.received ? "chargeable" : "free") : null,
      // An attended student whose image isn't uploaded yet gets the physical route only.
      downloadToken:
        attended && entry?.cert ? signDownloadToken(record.uid, meta.id) : null,
    };
  });

  return { uid: record.uid, name: record.name, workshops };
}
