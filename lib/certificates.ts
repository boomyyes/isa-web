// Shared certificate types + the workshop catalog.
//
// This module is deliberately dependency-free and crypto-free so the client
// bundle can import it. Anything needing node:crypto or Redis lives in
// ./certificates.server.ts, which must never be imported from a "use client"
// component.

/** Stable workshop identifier. Doubles as the R2 key prefix. */
export type WorkshopId = string;

export interface WorkshopMeta {
  id: WorkshopId;
  title: string;
  /** ISO calendar date, "YYYY-MM-DD". Render with formatEventDate(). */
  date: string;
  /**
   * How this workshop's columns are labelled in the attendance sheet.
   *
   * Optional: the importer derives it from the digits in `id`, so "wks-2" finds
   * "WKS 2" / "WKS2" / "Workshop 2" on its own. Set it explicitly when the id
   * has no number in it (e.g. id "plc-basics", sheetLabel "PLC Basics").
   */
  sheetLabel?: string;
}

/**
 * The workshops certificates can be issued for, in display order.
 *
 * The `id` values must match the `WKS n` column pairs in the attendance sheet
 * (see scripts/import-roster.ts) and the folder names in the R2 bucket. Adding
 * a workshop means: add an entry here, add its columns to the sheet, upload the
 * images to `{id}/` in R2, then re-run the import script.
 *
 * Titles/dates are placeholders until the real workshop details are filled in.
 */
export const WORKSHOPS: WorkshopMeta[] = [
  { id: "wks-1", title: "[Workshop 1 — Title]", date: "2026-01-24" },
  { id: "wks-2", title: "[Workshop 2 — Title]", date: "2026-03-14" },
  { id: "wks-3", title: "[Workshop 3 — Title]", date: "2026-05-17" },
];

/** Per-workshop attendance, as stored in Redis. */
export interface WorkshopRecord {
  /** Attended the session. Gates both the digital and the physical copy. */
  attended: boolean;
  /** Physical copy already collected — makes any further copy chargeable. */
  received: boolean;
  /** Authoritative R2 object key. Null when no image has been uploaded yet. */
  cert: string | null;
}

/**
 * A roster row, as stored in Redis under `cert:{uid}`.
 *
 * The UID is the primary key and the only identifier a student types. `email`
 * is carried for mail-outs (see scripts/send-passwords.ts) but plays no part in
 * the lookup and is never returned by the API.
 */
export interface CertRecord {
  uid: string;
  name: string;
  college: string;
  /** Stored for mail-outs only. NEVER returned by any API response. */
  email: string;
  /** scrypt digest of the student's access code. Never the code itself. */
  passwordHash: string;
  /**
   * ISO timestamp of when this student was sent their UID + access code, or
   * null if they haven't been mailed yet.
   *
   * This is the authoritative "already emailed" guard — it lives in Redis
   * rather than in a local file so that re-running the mailer, running it from
   * another machine, or re-importing the roster can never double-send. A newly
   * registered student is the only one with null here.
   */
  passwordEmailedAt: string | null;
  workshops: Record<WorkshopId, WorkshopRecord>;
}

/**
 * What the physical copy costs this student.
 * `free` — first copy, not yet collected. `chargeable` — already collected one.
 */
export type PhysicalCopyState = "free" | "chargeable";

/** Per-workshop result sent to the browser. Carries no PII. */
export interface PublicWorkshopView {
  id: WorkshopId;
  title: string;
  date: string;
  attended: boolean;
  /** Null when not attended — no physical copy is offered at all. */
  physical: PhysicalCopyState | null;
  /**
   * Short-lived signed token for /api/certificates/download.
   * Null when not attended, or when no image has been uploaded yet.
   */
  downloadToken: string | null;
}

/**
 * The full lookup response.
 *
 * Name and UID are the only personal fields that leave the server — and the UID
 * is something the student just typed in to get here, so echoing it back reveals
 * nothing. It's returned rather than reused from the form so the display shows
 * the canonical stored value.
 */
export interface PublicCertView {
  uid: string;
  name: string;
  workshops: PublicWorkshopView[];
}

/**
 * Canonical UID form. Trimmed only — a UID is matched exactly, so "01" and "1"
 * are deliberately different students.
 */
export function normalizeUid(uid: string): string {
  return uid.trim();
}

/**
 * Canonical access-code form: upper-cased with separators stripped, so
 * "k7p2-9xqm", "K7P2 9XQM" and "K7P29XQM" all resolve to the same code.
 *
 * Codes are generated from an alphabet with no O/0/I/1 (see generatePassword),
 * so there is nothing ambiguous left to normalise beyond case and spacing.
 */
export function normalizePassword(password: string): string {
  return password.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
