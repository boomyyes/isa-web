// POST { ids: string[] }, Authorization: Bearer <FORMS_SYNC_SECRET>
// Drops rows the sheet has written from the pending queue.

import { PENDING_KEY } from "@/lib/forms/server";
import { syncAuthorised } from "@/lib/forms/sheet";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!syncAuthorised(request)) {
    return Response.json({ error: "Unauthorised." }, { status: 401, headers: PRIVATE_HEADERS });
  }

  let ids: unknown;
  try {
    ({ ids } = (await request.json()) as { ids?: unknown });
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  if (
    !Array.isArray(ids) ||
    ids.length > 500 ||
    !ids.every((id) => typeof id === "string" && /^[A-Z]-[0-9A-Z]{6}$/.test(id))
  ) {
    return Response.json({ error: "Expected `ids` to be a list of refs." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  if (ids.length > 0) {
    const tx = redis().multi();
    for (const id of ids) tx.lrem(PENDING_KEY, 0, id);
    await tx.exec();
  }

  return Response.json({ acked: ids.length }, { headers: PRIVATE_HEADERS });
}
