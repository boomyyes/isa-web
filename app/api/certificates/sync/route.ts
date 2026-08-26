// Called by the Apps Script in the attendance sheet.
//
// POST { rows: string[][], force?, dryRun? }, Authorization: Bearer <secret>
//
// Reconciles the sheet, then issues and emails codes to new students. Delivery is
// capped per invocation; the response reports `remaining` and the caller re-posts.

import { timingSafeEqual } from "node:crypto";
import { redis } from "@/lib/redis";
import { deliverPendingCodes, parseSheet, reconcile } from "@/lib/roster";
import { mailerConfigured } from "@/lib/mailer";

/** nodemailer needs a TCP socket, so this must not run on the edge. */
export const runtime = "nodejs";

/** Access codes are issued one at a time and scrypt is deliberately slow. */
const DELIVER_LIMIT = 15;

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

function authorised(request: Request): boolean {
  const secret = process.env.ROSTER_SYNC_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "Unauthorised." }, { status: 401, headers: PRIVATE_HEADERS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const { rows, force, dryRun, extension } = (body ?? {}) as {
    rows?: unknown;
    force?: unknown;
    dryRun?: unknown;
    extension?: unknown;
  };

  if (!Array.isArray(rows) || rows.length < 2 || !Array.isArray(rows[0])) {
    return Response.json(
      { error: "Expected `rows` to be a grid of at least two rows (header + data)." },
      { status: 400, headers: PRIVATE_HEADERS }
    );
  }

  // Apps Script sends numbers and booleans as-is; normalise so the parser sees
  // what the CSV path would give it.
  const grid: string[][] = (rows as unknown[][]).map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell)))
  );

  let parsed;
  try {
    parsed = parseSheet(grid, typeof extension === "string" ? extension : "png");
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 422, headers: PRIVATE_HEADERS }
    );
  }

  let result;
  try {
    result = await reconcile(redis(), parsed.rows, {
      force: force === true,
      dryRun: dryRun === true,
    });
  } catch (error) {
    return Response.json(
      { error: `Sync failed: ${(error as Error).message}` },
      { status: 503, headers: PRIVATE_HEADERS }
    );
  }

  // 409 so the Apps Script surfaces it rather than treating it as success.
  if (result.refused) {
    return Response.json(
      {
        ok: false,
        refused: result.refused,
        hint: "Re-post with force:true only if the removal is intended.",
        warnings: parsed.warnings,
      },
      { status: 409, headers: PRIVATE_HEADERS }
    );
  }

  let delivery = { sent: 0, failed: 0, skippedNoEmail: 0, remaining: 0 };
  let deliveryError: string | undefined;

  if (!dryRun) {
    try {
      delivery = await deliverPendingCodes(redis(), { limit: DELIVER_LIMIT });
    } catch (error) {
      // The queue is durable, so a mail outage is only a delay — report it
      // without failing the sync.
      deliveryError = (error as Error).message;
    }
  }

  return Response.json(
    {
      ok: true,
      dryRun: dryRun === true,
      workshopsMatched: parsed.workshopCount,
      rowsParsed: parsed.rows.length,
      skipped: parsed.skipped,
      written: result.written,
      deleted: result.deleted,
      registered: result.registered,
      emails: delivery,
      ...(deliveryError ? { deliveryError } : {}),
      ...(mailerConfigured() ? {} : { warning: "SMTP is not configured — no codes can be sent." }),
      warnings: parsed.warnings,
    },
    { headers: PRIVATE_HEADERS }
  );
}
