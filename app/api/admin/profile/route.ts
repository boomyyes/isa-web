// POST name, phone -> updates the signed-in member's own profile. Blank clears
// a field. Any member may edit their own; nobody edits someone else's here
// (the President sets names for others on the Team page).

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { cleanName, cleanPhone, setName, setPhone } from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");

  const form = await request.formData().catch(() => null);
  const rawPhone = form?.get("phone");
  const phone = cleanPhone(rawPhone);
  // Something typed that isn't a valid number is an error, not a silent clear.
  if (typeof rawPhone === "string" && rawPhone.trim() && !phone) return adminRedirect(request, "/profile?error=phone");

  try {
    await Promise.all([setName(session.email, cleanName(form?.get("name"))), setPhone(session.email, phone)]);
  } catch {
    return adminRedirect(request, "/profile?error=save");
  }
  return adminRedirect(request, "/profile?saved=1");
}
