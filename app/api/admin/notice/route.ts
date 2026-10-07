// POST -> records that the signed-in member has read the current internal notice.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { acknowledge } from "@/lib/admin/notice";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  try {
    await acknowledge(session.email);
  } catch {
    return adminRedirect(request, "/notice?error=1");
  }
  return adminRedirect(request, "/");
}
