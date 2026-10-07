// POST { id } -> deletes a message. Authors delete their own; moderators (Core and above)
// can remove anyone's in channels they can see (logged).

import { sessionFrom } from "@/lib/admin/session";
import { audit, hasCap, seesDomain } from "@/lib/admin/store";
import { deleteMessage, getChannel, getMessage } from "@/lib/admin/chat";
import { signal } from "@/lib/ably";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Sign in again." }, 401);
  if (!hasCap(session, "chat")) return json({ error: "No chat access." }, 403);

  const { id } = (await request.json().catch(() => ({}))) as { id?: unknown };
  const message = await getMessage(String(id ?? ""));
  const channel = message ? await getChannel(message.channelId) : null;
  if (!message || message.deletedAt || !channel || !seesDomain(session, channel.domain)) {
    return json({ error: "That message no longer exists." }, 404);
  }

  const own = message.createdBy === session.email;
  if (!own && !hasCap(session, "forum")) return json({ error: "You can only delete your own messages." }, 403);

  await deleteMessage(message.id);
  if (!own) await audit(session.email, `removed a chat message by ${message.createdBy}`);
  await signal(message.channelId, "deleted");
  return json({ ok: true });
}
