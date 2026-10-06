// Shapes stored submissions into spreadsheet rows for the Apps Script pull.

import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { FormName } from "./schemas";
import type { StoredSubmission } from "./server";

/** Tab name and column order per form. The script creates tabs and headers from this. */
export const SHEET_LAYOUT: Record<FormName, { tab: string; columns: [string, string][] }> = {
  query: {
    tab: "Queries",
    columns: [
      ["name", "Name"],
      ["email", "Email"],
      ["subject", "Subject"],
      ["message", "Message"],
    ],
  },
};

/**
 * Sheets runs anything starting with these as a formula, so a submitted
 * `=IMPORTXML(...)` would execute in the committee's sheet. A leading
 * apostrophe makes the cell literal text.
 */
export function safeCell(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function toRow(sub: StoredSubmission): string[] {
  const { columns } = SHEET_LAYOUT[sub.form];
  return [
    sub.id,
    sub.receivedAt,
    ...columns.map(([key]) => safeCell(sub.data[key])),
    sub.data.consent === true ? "yes" : "no",
    sub.data.adult === true ? "yes" : "no",
    sub.status ?? "new",
    safeCell((sub.notes ?? []).map((n) => `${n.at.slice(0, 10)} ${n.by}: ${n.text}`).join(" | ")),
    sub.retainUntil,
  ];
}

export function headerFor(form: FormName): string[] {
  return [
    "Ref",
    "Received",
    ...SHEET_LAYOUT[form].columns.map(([, title]) => title),
    "Consent",
    "18+",
    "Status",
    "Notes",
    "Delete after",
  ];
}

/** Same bearer check as the roster sync, against its own secret. */
export function syncAuthorised(request: Request): boolean {
  const secret = process.env.FORMS_SYNC_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
