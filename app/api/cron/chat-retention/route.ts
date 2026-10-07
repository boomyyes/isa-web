// Daily (vercel.json): deletes chat messages older than a year, the retention
// period stated in the internal notice. Vercel sends
// `Authorization: Bearer <CRON_SECRET>`; anything else is refused.

import { timingSafeEqual } from "node:crypto";
import { purgeOld, RETENTION_DAYS } from "@/lib/admin/chat";

export const runtime = "nodejs";

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorised." }, { status: 401 });
  const deleted = await purgeOld();
  return Response.json({ ok: true, deleted, olderThanDays: RETENTION_DAYS }, { headers: { "Cache-Control": "no-store" } });
}
