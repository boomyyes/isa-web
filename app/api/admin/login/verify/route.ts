// POST token -> starts a session. Reached from the confirm page's button, not
// the emailed link itself: mail scanners open links, and a GET that consumed
// the token would burn it before the person clicked.

import { adminRedirect, sessionCookie } from "@/lib/admin/session";
import { audit, consumeLoginToken, createSession, roleOf } from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  if (typeof token !== "string") return adminRedirect(request, "/login?error=expired");

  try {
    const email = await consumeLoginToken(token);
    // Removed between the email and the click: the link dies with the access.
    if (!email || !(await roleOf(email))) return adminRedirect(request, "/login?error=expired");

    const id = await createSession(email);
    await audit(email, "signed in");
    return adminRedirect(request, "/", { "Set-Cookie": sessionCookie(id) });
  } catch {
    return adminRedirect(request, "/login?error=unavailable");
  }
}
