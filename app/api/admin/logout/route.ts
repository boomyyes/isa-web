import { adminRedirect, clearedSessionCookie, sessionIdFrom } from "@/lib/admin/session";
import { destroySession } from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  await destroySession(sessionIdFrom(request)).catch(() => {});
  return adminRedirect(request, "/login", { "Set-Cookie": clearedSessionCookie });
}
