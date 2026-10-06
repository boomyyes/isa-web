// POST { ids: string[], erased?: string[] }, Authorization: Bearer <FORMS_SYNC_SECRET>
// Drops refs the sheet has written (ids) or deleted (erased) from their queues.

import { ERASE_KEY, PENDING_KEY } from "@/lib/forms/server";
import { syncAuthorised } from "@/lib/forms/sheet";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!syncAuthorised(request)) {
    return Response.json({ error: "Unauthorised." }, { status: 401, headers: PRIVATE_HEADERS });
  }

  let ids: unknown;
  let erased: unknown;
  try {
    ({ ids, erased = [] } = (await request.json()) as { ids?: unknown; erased?: unknown });
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const isRefs = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.length <= 500 &&
    value.every((id) => typeof id === "string" && /^[A-Z]-[0-9A-Z]{6}$/.test(id));

  if (!isRefs(ids) || !isRefs(erased)) {
    return Response.json({ error: "Expected `ids` to be a list of refs." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  if (ids.length + erased.length > 0) {
    const tx = redis().multi();
    for (const id of ids) tx.lrem(PENDING_KEY, 0, id);
    for (const id of erased) tx.lrem(ERASE_KEY, 0, id);
    await tx.exec();
  }

  return Response.json({ acked: ids.length, erased: erased.length }, { headers: PRIVATE_HEADERS });
}
