// POST { channelId, body } -> stores the message, then signals listeners.

import { sessionFrom } from "@/lib/admin/session";
import { hasCap, seesDomain } from "@/lib/admin/store";
import { addMessage, getChannel, messageSchema, sendLimiter } from "@/lib/admin/chat";
import { signal } from "@/lib/ably";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Sign in again." }, 401);
  if (!hasCap(session, "chat")) return json({ error: "No chat access." }, 403);

  const parsed = messageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const channel = await getChannel(parsed.data.channelId);
  if (!channel || !seesDomain(session, channel.domain)) return json({ error: "Unknown channel." }, 404);
  if (channel.archived) return json({ error: "This channel is archived." }, 403);

  try {
    if (!(await sendLimiter().limit(session.email)).success) {
      return json({ error: "You're sending too fast. Wait a moment." }, 429);
    }
  } catch {
    // Rate limiting is a guard rail; don't block conversation if Upstash blips.
  }

  const message = await addMessage(channel.id, parsed.data.body, session.email);
  await signal(channel.id, "new");
  return json({ message });
}
