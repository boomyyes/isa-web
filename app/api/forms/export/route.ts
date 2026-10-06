// Pulled by the Apps Script in the submissions sheet.
//
// GET, Authorization: Bearer <FORMS_SYNC_SECRET>
// -> { tabs: { [tab]: header[] }, items: [{ id, tab, row }], expired: id[], erase: id[] }
//
// `items` are new or edited rows (the script appends or updates by ref);
// `erase` are refs whose rows must be deleted (DPDP erasure requests).
//
// Read-only: nothing leaves the queue until the script acks it, so a crash
// between append and ack duplicates a row (the script skips known refs) but
// never loses one.

import { isFormName } from "@/lib/forms/schemas";
import { ERASE_KEY, PENDING_KEY, subKey, type StoredSubmission } from "@/lib/forms/server";
import { SHEET_LAYOUT, headerFor, syncAuthorised, toRow } from "@/lib/forms/sheet";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const BATCH = 100;
const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!syncAuthorised(request)) {
    return Response.json({ error: "Unauthorised." }, { status: 401, headers: PRIVATE_HEADERS });
  }

  const db = redis();
  const [ids, erase] = await Promise.all([
    db.lrange<string>(PENDING_KEY, 0, BATCH - 1),
    db.lrange<string>(ERASE_KEY, 0, BATCH - 1),
  ]);
  const records = ids.length
    ? await db.mget<(StoredSubmission | null)[]>(...ids.map(subKey))
    : [];

  const items: { id: string; tab: string; row: string[] }[] = [];
  // Erased or past retention before the sheet saw it: ack without writing.
  const expired: string[] = [];

  ids.forEach((id, i) => {
    const sub = records[i];
    if (!sub || !isFormName(sub.form)) {
      expired.push(id);
      return;
    }
    items.push({ id, tab: SHEET_LAYOUT[sub.form].tab, row: toRow(sub) });
  });

  const tabs = Object.fromEntries(
    Object.entries(SHEET_LAYOUT).map(([form, { tab }]) => [
      tab,
      headerFor(form as keyof typeof SHEET_LAYOUT),
    ])
  );

  // The same ref can be queued twice (submitted, then edited); one row write is enough.
  const unique = [...new Map(items.map((item) => [item.id, item])).values()];

  return Response.json({ tabs, items: unique, expired, erase }, { headers: PRIVATE_HEADERS });
}
