// GET -> an Ably TokenRequest: subscribe-only, one hour. Called by the Ably
// client in the browser (authUrl), with the admin session cookie.

import { sessionFrom } from "@/lib/admin/session";
import { domainScoped, hasCap, seesDomain } from "@/lib/admin/store";
import { listChannels } from "@/lib/admin/chat";
import { ablyConfigured, subscribeTokenRequest } from "@/lib/ably";

export const runtime = "nodejs";

const PRIVATE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const session = await sessionFrom(request);
  if (!session) return Response.json({ error: "Sign in again." }, { status: 401, headers: PRIVATE });
  if (!hasCap(session, "chat")) return Response.json({ error: "No chat access." }, { status: 403, headers: PRIVATE });
  if (!ablyConfigured()) return Response.json({ error: "Live updates aren't set up." }, { status: 503, headers: PRIVATE });
  // Domain-scoped roles get a token for exactly the channels they can see; everyone else for all.
  const ids = domainScoped(session.role)
    ? (await listChannels({ includeArchived: true })).filter((ch) => seesDomain(session, ch.domain)).map((ch) => ch.id)
    : null;
  if (ids?.length === 0) return Response.json({ error: "No channels to follow." }, { status: 403, headers: PRIVATE });
  return Response.json(await subscribeTokenRequest(session.email, ids), { headers: PRIVATE });
}
