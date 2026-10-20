// GET -> an Ably TokenRequest for the workspace channel: subscribe-only, one
// hour. Called by LiveUpdates in the browser (authUrl), with the session cookie.

import { sessionFrom } from "@/lib/admin/session";
import { ablyConfigured, subscribeTokenRequest, WORKSPACE_ID } from "@/lib/ably";

export const runtime = "nodejs";

const PRIVATE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const session = await sessionFrom(request);
  if (!session) return Response.json({ error: "Sign in again." }, { status: 401, headers: PRIVATE });
  if (!ablyConfigured()) return Response.json({ error: "Live updates aren't set up." }, { status: 503, headers: PRIVATE });
  return Response.json(await subscribeTokenRequest(session.email, [WORKSPACE_ID]), { headers: PRIVATE });
}
