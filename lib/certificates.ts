// Types + workshop catalog. Kept crypto-free so the client bundle can import it;
// anything needing node:crypto lives in ./certificates.server.ts.

/** Stable workshop identifier. Doubles as the R2 key prefix. */
export type WorkshopId = string;

export interface WorkshopMeta {
  id: WorkshopId;
  title: string;
  /** ISO, "YYYY-MM-DD". Render with formatEventDate(). */
  date: string;
  /** Sheet column label. Defaults to "WKS <n>" from the digits in `id`. */
  sheetLabel?: string;
}

/**
 * In display order. Each `id` must match the sheet's `WKS n` columns and the
 * folder name in R2. See ADD-WORKSHOP.md.
 */
export const WORKSHOPS: WorkshopMeta[] = [
  { id: "iaw", title: "Industrial Automation Workshop", date: "2026-08-01", sheetLabel: "IAW" },
  { id: "ros", title: "ROS2 Bootcamp", date: "2026-08-21", sheetLabel: "ROS" },
  { id: "artemis", title: "Artemis Hackathon 2026", date: "2026-09-26", sheetLabel: "ARTEMIS" }
]
export interface WorkshopRecord {
  /** Gates both the digital and the physical copy. */
  attended: boolean;
  /** Physical copy collected — makes any further copy chargeable. */
  received: boolean;
  /** R2 object key. Null when no image has been uploaded yet. */
  cert: string | null;
}

/** A roster row, stored under `cert:{uid}`. */
export interface CertRecord {
  uid: string;
  name: string;
  college: string;
  /** Mail-outs only. Never returned by the API. */
  email: string;
  /** scrypt digest, never the code itself. Empty means no code issued yet. */
  passwordHash: string;
  /** Null until they've been sent their code. */
  passwordEmailedAt: string | null;
  workshops: Record<WorkshopId, WorkshopRecord>;
}

export type PhysicalCopyState = "free" | "chargeable";

export interface PublicWorkshopView {
  id: WorkshopId;
  title: string;
  date: string;
  attended: boolean;
  /** Null when not attended — no physical copy is offered. */
  physical: PhysicalCopyState | null;
  downloadToken: string | null;
}

export interface PublicCertView {
  uid: string;
  name: string;
  workshops: PublicWorkshopView[];
}

/** Trimmed only — "01" and "1" are deliberately different students. */
export function normalizeUid(uid: string): string {
  return uid.trim();
}

/** "k7p2-9xqm", "K7P2 9XQM" and "K7P29XQM" all resolve to the same code. */
export function normalizePassword(password: string): string {
  return password.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Counted after normalising, so punctuation can't pad a short code. */
export const MIN_CODE_LENGTH = 6;
export const MAX_CODE_LENGTH = 128;

/** Returns the problem with a chosen code, or null if it's fine. */
export function validateAccessCode(code: unknown): string | null {
  if (typeof code !== "string" || code.length === 0) {
    return "Enter a new access code.";
  }
  if (code.length > MAX_CODE_LENGTH) {
    return `Keep it under ${MAX_CODE_LENGTH} characters.`;
  }
  if (normalizePassword(code).length < MIN_CODE_LENGTH) {
    return `Use at least ${MIN_CODE_LENGTH} letters or numbers. Spaces and punctuation are ignored.`;
  }
  if (isWeakCode(normalizePassword(code))) {
    return "That code is too easy to guess. Mix letters and numbers, and avoid sequences.";
  }
  return null;
}

const COMMON_CODES = new Set([
  "PASSWORD", "PASSWORD1", "PASSWORD123", "QWERTY", "QWERTY123", "QWERTYUIOP", "ASDFGH", "ASDFGHJKL",
  "ZXCVBN", "ABC123", "ABCDEF", "ABCDEFG", "ABCDEFGH", "LETMEIN", "WELCOME", "WELCOME1", "ADMIN123",
  "ILOVEYOU", "MONKEY", "DRAGON", "FOOTBALL", "CRICKET", "SUNSHINE", "PRINCESS", "IISA", "ISARAIT",
  "RAIT", "RAIT123", "ISA123", "STUDENT", "CHANGEME", "SECRET", "TRUSTNO1", "PASSWORD@123",
]);

/** All digits, one repeated character, a run like ABCDEF/123456, or a well-known password. */
function isWeakCode(code: string): boolean {
  if (/^\d+$/.test(code)) return true;
  if (/^(.)\1+$/.test(code)) return true;
  if (COMMON_CODES.has(code)) return true;
  const steps = new Set<number>();
  for (let i = 1; i < code.length; i++) steps.add(code.charCodeAt(i) - code.charCodeAt(i - 1));
  return steps.size === 1 && [1, -1].includes([...steps][0]);
}
