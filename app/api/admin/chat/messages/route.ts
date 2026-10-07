// GET ?channel=<id>[&after=<iso>|&before=<iso>] -> { messages } oldest first.

import { sessionFrom } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { getChannel, listMessages } from "@/lib/admin/chat";

export const runtime = "nodejs";

const PRIVATE = { "Cache-Control": "no-store" };
const date = (v: string | null) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export async function GET(request: Request) {
  const session = await sessionFrom(request);
  if (!session) return Response.json({ error: "Sign in again." }, { status: 401, headers: PRIVATE });
  if (!hasCap(session, "chat")) return Response.json({ error: "No chat access." }, { status: 403, headers: PRIVATE });

  const url = new URL(request.url);
  const channel = await getChannel(url.searchParams.get("channel") ?? "");
  if (!channel) return Response.json({ error: "Unknown channel." }, { status: 404, headers: PRIVATE });

  const messages = await listMessages(channel.id, {
    after: date(url.searchParams.get("after")),
    before: date(url.searchParams.get("before")),
  });
  return Response.json({ messages }, { headers: PRIVATE });
}
