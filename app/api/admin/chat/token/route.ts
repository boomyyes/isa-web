// GET -> an Ably TokenRequest: subscribe-only, one hour. Called by the Ably
// client in the browser (authUrl), with the admin session cookie.

import { sessionFrom } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { ablyConfigured, subscribeTokenRequest } from "@/lib/ably";

export const runtime = "nodejs";

const PRIVATE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const session = await sessionFrom(request);
  if (!session) return Response.json({ error: "Sign in again." }, { status: 401, headers: PRIVATE });
  if (!hasCap(session, "chat")) return Response.json({ error: "No chat access." }, { status: 403, headers: PRIVATE });
  if (!ablyConfigured()) return Response.json({ error: "Live updates aren't set up." }, { status: 503, headers: PRIVATE });
  return Response.json(await subscribeTokenRequest(session.email), { headers: PRIVATE });
}
