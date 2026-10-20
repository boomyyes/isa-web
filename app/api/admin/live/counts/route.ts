// GET -> this member's sidebar badges, refetched by LiveUpdates on each signal.

import { sessionFrom } from "@/lib/admin/session";
import { navCounts } from "@/lib/admin/navCounts";

export const runtime = "nodejs";

const PRIVATE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const session = await sessionFrom(request);
  if (!session) return Response.json({ error: "Sign in again." }, { status: 401, headers: PRIVATE });
  return Response.json(await navCounts(session), { headers: PRIVATE });
}
