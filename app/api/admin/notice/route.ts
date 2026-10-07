// POST action=ack, name? -> records that the signed-in member has read the
// current internal notice, and saves their display name if they gave one.
// POST action=name, name -> sets or (when blank) clears their display name.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { acknowledge } from "@/lib/admin/notice";
import { cleanName, setName } from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");

  const form = await request.formData().catch(() => null);
  const name = cleanName(form?.get("name"));

  try {
    if (form?.get("action") === "name") {
      await setName(session.email, name);
      return adminRedirect(request, "/notice?named=1#name");
    }
    // On first acknowledgement a blank name just means "none given".
    if (name) await setName(session.email, name);
    await acknowledge(session.email);
  } catch {
    return adminRedirect(request, "/notice?error=1");
  }
  return adminRedirect(request, "/");
}
