// POST action=set|caps|remove, email, role | cap[] -> manages admins. Owners only.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import {
  audit,
  bootstrapOwners,
  can,
  isCapability,
  isRole,
  normaliseEmail,
  removeAdmin,
  setAdmin,
  setCaps,
} from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  if (!can(session.role, "owner")) return adminRedirect(request, "/?error=denied");

  const form = await request.formData().catch(() => null);
  const action = form?.get("action");
  const raw = form?.get("email");
  const role = form?.get("role");
  const email = typeof raw === "string" ? normaliseEmail(raw).slice(0, 254) : "";

  if (!EMAIL.test(email)) return adminRedirect(request, "/team?error=email");
  // Owners set in Vercel can't be changed here, so nobody gets locked out.
  if (bootstrapOwners().includes(email)) return adminRedirect(request, "/team?error=fixed");

  if (action === "caps") {
    const caps = (form?.getAll("cap") ?? []).filter(isCapability);
    if (!(await setCaps(email, caps))) return adminRedirect(request, "/team?error=email");
    await audit(session.email, `set permissions: ${caps.join(", ") || "none"}`, email);
  } else if (action === "set" && isRole(role)) {
    await setAdmin(email, role, session.email);
    await audit(session.email, `set role "${role}"`, email);
  } else if (action === "remove") {
    await removeAdmin(email);
    await audit(session.email, "removed admin", email);
  } else {
    return adminRedirect(request, "/team");
  }
  return adminRedirect(request, "/team?saved=1");
}
